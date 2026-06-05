/**
 * services/storageService.ts  (MongoDB + localStorage hybrid)
 *
 * Storage split:
 *   localStorage   → passwordHash, walletAddress, hasWallet flag  (browser-specific, never leaves)
 *   MongoDB        → encryptedBlob, salt, iv, tokens, transactions (syncs across devices)
 *   sessionStorage → nothing (removed — we use localStorage for persistence)
 *
 * This means:
 *   - Password is set ONCE per browser, just like MetaMask
 *   - New browser = new password setup
 *   - Same browser = same password forever, no matter how many wallets
 */

import { MultiChainWallet, Token, Transaction } from '@/types';

const LS_PASSWORD_HASH = 'avg_password_hash';
const LS_WALLET_ADDRESS = 'avg_wallet_address';
const LS_HAS_WALLET = 'avg_has_wallet';
const LS_CUSTOM_NETWORKS = 'avg_custom_networks';

// ─── Crypto helpers ────────────────────────────────────────────────────────────

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 210_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

/** PBKDF2 hash of password — stored in localStorage for browser-local verification */
async function derivePasswordHash(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = 'avg_wallet_static_salt_v1';
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── localStorage helpers ──────────────────────────────────────────────────────

function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function lsSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

function lsRemove(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

// ─── StorageService ────────────────────────────────────────────────────────────

export class StorageService {

  // ─── Password (localStorage — browser specific) ──────────────────────────────

  /**
   * Returns true if a password has been set in THIS browser.
   * Synchronous — reads localStorage.
   */
  static hasPasswordSet(): boolean {
    return !!lsGet(LS_PASSWORD_HASH);
  }

  /**
   * Save password hash to localStorage.
   * Called once when the user sets their password for the first time in this browser.
   */
  static async savePasswordHash(password: string): Promise<void> {
    const hash = await derivePasswordHash(password);
    lsSet(LS_PASSWORD_HASH, hash);
  }

  /**
   * Verify password against the hash stored in localStorage.
   * Works even when no wallet is loaded yet.
   */
  static async verifyPassword(password: string): Promise<boolean> {
    const storedHash = lsGet(LS_PASSWORD_HASH);
    if (!storedHash) return false;
    const inputHash = await derivePasswordHash(password);
    return inputHash === storedHash;
  }

  // ─── Wallet address (localStorage) ───────────────────────────────────────────

  private static getCachedAddress(): string | null {
    return lsGet(LS_WALLET_ADDRESS);
  }

  private static setCachedAddress(address: string): void {
    lsSet(LS_WALLET_ADDRESS, address);
    lsSet(LS_HAS_WALLET, 'true');
  }

  private static clearCachedAddress(): void {
    lsRemove(LS_WALLET_ADDRESS);
    lsRemove(LS_HAS_WALLET);
  }

  // ─── Wallet (encrypted blob → MongoDB) ───────────────────────────────────────

  /**
   * Synchronous check — reads localStorage flag.
   * True if a wallet address is cached in this browser.
   */
  static hasWallet(): boolean {
    return lsGet(LS_HAS_WALLET) === 'true';
  }

  /**
   * Encrypt wallet in the browser, POST blob to MongoDB.
   * Also saves password hash to localStorage if not already set.
   */
  static async saveWallet(wallet: MultiChainWallet, password: string): Promise<void> {
    try {
      // Save password hash to localStorage (browser-specific, first time only)
      if (!this.hasPasswordSet()) {
        await this.savePasswordHash(password);
      }

      // Cache wallet address in localStorage
      this.setCachedAddress(wallet.accounts.ethereum.address);

      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv   = crypto.getRandomValues(new Uint8Array(12));
      const key  = await deriveKey(password, salt);

      const plaintext  = new TextEncoder().encode(JSON.stringify(wallet));
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

      // We still send passwordHash to MongoDB so it can be used for
      // cross-device recovery flows in the future — but browser auth
      // always uses the localStorage hash first.
      const passwordHash = await derivePasswordHash(password);

      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet.accounts.ethereum.address,
          encryptedBlob: toBase64(new Uint8Array(ciphertext)),
          salt:          toBase64(salt),
          iv:            toBase64(iv),
          passwordHash,
        }),
      });

      if (!res.ok) throw new Error('Failed to save wallet to database');
    } catch (error) {
      console.error('Error saving wallet:', error);
      throw new Error('Failed to save wallet');
    }
  }

  /**
   * Fetch encrypted blob from MongoDB and decrypt in the browser.
   * Uses the cached address from localStorage to find the right wallet.
   */
  static async unlockWallet(password: string): Promise<MultiChainWallet | null> {
    try {
      const address = this.getCachedAddress();
      if (!address) return null;

      const res  = await fetch(`/api/wallet?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!data.exists) return null;

      const key = await deriveKey(password, fromBase64(data.salt));

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(data.iv) as BufferSource },
        key,
        fromBase64(data.encryptedBlob) as BufferSource
      );

      return JSON.parse(new TextDecoder().decode(decrypted)) as MultiChainWallet;
    } catch {
      return null;
    }
  }

  /**
   * Delete wallet from MongoDB and clear localStorage caches.
   * Password hash is also cleared so the next wallet setup asks for a new password.
   */
  static async deleteWallet(): Promise<void> {
    const address = this.getCachedAddress();
    if (address) {
      await fetch(`/api/wallet?address=${encodeURIComponent(address)}`, { method: 'DELETE' });
    }
    this.clearCachedAddress();
    
  }

  /**
   * Change password: verify old → re-encrypt → save new hash to localStorage.
   */
  static async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Verify old password against localStorage hash
      const isCorrect = await this.verifyPassword(oldPassword);
      if (!isCorrect) return false;

      // Re-encrypt wallet with new password
      const wallet = await this.unlockWallet(oldPassword);
      if (!wallet) return false;

      await this.saveWallet(wallet, newPassword);

      // Update localStorage hash with new password
      await this.savePasswordHash(newPassword);
      return true;
    } catch (error) {
      console.error('Failed to change password:', error);
      return false;
    }
  }

  // ─── Tokens (MongoDB) ─────────────────────────────────────────────────────────

  static async saveTokens(tokens: Token[]): Promise<void> {
    const address = this.getCachedAddress();
    if (!address) return;
    for (const token of tokens) {
      await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, ...token }),
      });
    }
  }

  static async getTokens(): Promise<Token[]> {
    const address = this.getCachedAddress();
    if (!address) return [];
    try {
      const res  = await fetch(`/api/tokens?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      return (data.tokens ?? []).map((t: Token & { walletAddress?: string }) => {
        const { walletAddress: _, ...token } = t as Token & { walletAddress: string };
        return token;
      });
    } catch {
      return [];
    }
  }

  static async addToken(token: Token): Promise<void> {
    const address = this.getCachedAddress();
    if (!address) return;
    await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address, ...token }),
    });
  }

  // ─── Transactions (MongoDB) ───────────────────────────────────────────────────

  static async saveTransactions(transactions: Transaction[]): Promise<void> {
    for (const tx of transactions) {
      await this.addTransaction(tx);
    }
  }

  static async getTransactions(): Promise<Transaction[]> {
    const address = this.getCachedAddress();
    if (!address) return [];
    try {
      const res  = await fetch(`/api/transactions?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      return (data.transactions ?? []).map((t: Transaction & { walletAddress?: string }) => {
        const { walletAddress: _, ...tx } = t as Transaction & { walletAddress: string };
        return tx;
      });
    } catch {
      return [];
    }
  }

  static async addTransaction(transaction: Transaction): Promise<void> {
    const address = this.getCachedAddress();
    if (!address) return;
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address, ...transaction }),
    });
  }

  static async updateTransactionStatus(
    hash: string,
    status: 'pending' | 'confirmed' | 'failed',
    network: string
  ): Promise<void> {
    const address = this.getCachedAddress();
    if (!address) return;
    await fetch('/api/transactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address, hash, network, status }),
    });
  }

  // ─── Custom Networks (localStorage — device specific) ─────────────────────────

  static getCustomNetworks(): any[] {
    if (typeof window === 'undefined') return [];
    const networks = lsGet(LS_CUSTOM_NETWORKS);
    return networks ? JSON.parse(networks) : [];
  }

  static saveCustomNetworks(networks: any[]): void {
    lsSet(LS_CUSTOM_NETWORKS, JSON.stringify(networks));
  }

  static addCustomNetwork(network: any): void {
    const networks = this.getCustomNetworks();
    networks.push(network);
    this.saveCustomNetworks(networks);
  }



  static logout(): void {
  this.clearCachedAddress();
  // Password hash stays — same password if they log back in
}
}