import { MultiChainWallet, Token, Transaction } from '@/types';

const STORAGE_KEYS = {
  WALLET: 'avg_wallet_data',
  TOKENS: 'avg_wallet_tokens',
  TRANSACTIONS: 'avg_wallet_transactions',
  SETTINGS: 'avg_wallet_settings',
  PASSWORD_HASH: 'avg_password_hash',
} as const;

// ─── Crypto helpers ───────────────────────────────────────────────

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

// ─── StorageService ───────────────────────────────────────────────

export class StorageService {

  // ─── Password ─────────────────────────────────────────────────────

  /**
   * Password hash save karta hai — sirf ek baar set hota hai
   */
  static async savePasswordHash(password: string): Promise<void> {
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
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, hashHex);
  }

  /**
   * Password verify karta hai saved hash se
   */
  static async verifyPassword(password: string): Promise<boolean> {
    const savedHash = localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
    if (!savedHash) return false;
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
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hashHex === savedHash;
  }

  /**
   * Check karta hai ki password pehle se set hai ya nahi
   */
  static hasPasswordSet(): boolean {
    return localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH) !== null;
  }

  // ─── Wallet ───────────────────────────────────────────────────────

  /**
   * Wallet ko AES-GCM se encrypt karke save karta hai
   */
  static async saveWallet(wallet: MultiChainWallet, password: string): Promise<void> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt);

      const plaintext = new TextEncoder().encode(JSON.stringify(wallet));
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        plaintext
      );

      const payload = {
        salt: toBase64(salt),
        iv: toBase64(iv),
        data: toBase64(new Uint8Array(ciphertext)),
      };

      localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(payload));
    } catch (error) {
      console.error('Error saving wallet:', error);
      throw new Error('Failed to save wallet');
    }
  }

  /**
   * Password se decrypt karke wallet return karta hai.
   * Wrong password ya tampered data pe null return karta hai.
   */
  static async unlockWallet(password: string): Promise<MultiChainWallet | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.WALLET);
      if (!raw) return null;

      const { salt, iv, data } = JSON.parse(raw);
      const key = await deriveKey(password, fromBase64(salt));

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(iv) as BufferSource },
        key,
        fromBase64(data) as BufferSource
      );

      return JSON.parse(new TextDecoder().decode(decrypted)) as MultiChainWallet;
    } catch {
      return null;
    }
  }

  /**
   * Sirf check karta hai ki encrypted wallet blob exist karta hai ya nahi
   */
  static hasWallet(): boolean {
    return localStorage.getItem(STORAGE_KEYS.WALLET) !== null;
  }

  /**
   * Wallet data delete karta hai — PASSWORD_HASH intentionally nahi hata
   * Taaki returning user ko naya password set na karna pade
   */
  static deleteWallet(): void {
    localStorage.removeItem(STORAGE_KEYS.WALLET);
    localStorage.removeItem(STORAGE_KEYS.TOKENS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    // PASSWORD_HASH nahi hata rahe — yeh permanent rehta hai
  }


  static async changePassword(
  oldPassword: string,
  newPassword: string
): Promise<boolean> {
  try {
    const wallet = await this.unlockWallet(oldPassword);

    if (!wallet) {
      return false;
    }

    await this.saveWallet(wallet, newPassword);

    await this.savePasswordHash(newPassword);

    return true;
  } catch (error) {
    console.error('Failed to change password:', error);
    return false;
  }
}

  // ─── Tokens ───────────────────────────────────────────────────────

  static saveTokens(tokens: Token[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  static getTokens(): Token[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TOKENS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addToken(token: Token): void {
    const tokens = this.getTokens();
    const exists = tokens.some(
      (t) =>
        t.address.toLowerCase() === token.address.toLowerCase() &&
        t.network === token.network
    );
    if (!exists) {
      tokens.push(token);
      this.saveTokens(tokens);
    }
  }

  // ─── Transactions ─────────────────────────────────────────────────

  static saveTransactions(transactions: Transaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }

  static getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addTransaction(transaction: Transaction): void {
    const transactions = this.getTransactions();
    transactions.unshift(transaction);
    if (transactions.length > 100) transactions.pop();
    this.saveTransactions(transactions);
  }

  static updateTransactionStatus(
    hash: string,
    status: 'pending' | 'confirmed' | 'failed'
  ): void {
    const transactions = this.getTransactions();
    const tx = transactions.find((t) => t.hash === hash);
    if (tx) {
      tx.status = status;
      this.saveTransactions(transactions);
    }
  }
}