import { ethers } from 'ethers';
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction as SolanaTransaction, Keypair } from '@solana/web3.js';
import axios from 'axios';
import { BlockchainNetwork, SendTransactionParams, Token } from '@/types';
import { NETWORKS } from '@/config/networks';
import { StorageService } from '@/services/storageService';

// ERC20 ABI for token interactions
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint amount) returns (bool)',
];

export class BlockchainService {
  /**
   * Get EVM provider for a network
   */
  private static getEVMProvider(network: string): ethers.JsonRpcProvider {
  const config =
    NETWORKS[network] ??
    StorageService.getCustomNetworks().find((n) => n.name === network);

  if (!config) throw new Error(`Unknown network: ${network}`);
  return new ethers.JsonRpcProvider(config.rpcUrl);
}

  /**
   * Get Solana connection
   */
  private static getSolanaConnection(): Connection {
    return new Connection(NETWORKS.solana.rpcUrl, 'confirmed');
  }

  /**
   * Get native balance for EVM chains
   */
  static async getEVMBalance(address: string, network: BlockchainNetwork): Promise<string> {
    try {
      const provider = this.getEVMProvider(network);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error(`Error fetching ${network} balance:`, error);
      return '0';
    }
  }

  /**
   * Get Solana balance
   */
  static async getSolanaBalance(address: string): Promise<string> {
    try {
      const connection = this.getSolanaConnection();
      const publicKey = new PublicKey(address);
      const balance = await connection.getBalance(publicKey);
      return (balance / LAMPORTS_PER_SOL).toString();
    } catch (error) {
      console.error('Error fetching Solana balance:', error);
      return '0';
    }
  }

  /**
   * Get Bitcoin balance (using Blockstream API)
   */
  static async getBitcoinBalance(address: string): Promise<string> {
    try {
      // Using Blockstream API for Bitcoin balance
      const response = await axios.get(`https://blockstream.info/api/address/${address}`);
      const data = response.data;

      // Chain stats contains the confirmed balance
      const chainStats = data.chain_stats || {};
      const funded = chainStats.funded_txo_sum || 0;
      const spent = chainStats.spent_txo_sum || 0;
      const balanceSatoshis = funded - spent;

      return (balanceSatoshis / 100000000).toString(); // Convert satoshis to BTC
    } catch (error) {
      console.error('Error fetching Bitcoin balance:', error);
      return '0';
    }
  }

  /**
   * Get balance for any network
   */
  static async getBalance(address: string, network: BlockchainNetwork): Promise<string> {
    switch (network) {
      case 'ethereum':
      case 'polygon':
      case 'binance':
      case 'base':
        return this.getEVMBalance(address, network);
      case 'solana':
        return this.getSolanaBalance(address);
      case 'bitcoin':
        return this.getBitcoinBalance(address);
      default:
        return '0';
    }
  }

  /**
   * Get ERC20 token balance
   */
  static async getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  network: string          
): Promise<{ balance: string; decimals: number }>{
    try {
      const provider = this.getEVMProvider(network);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals(),
      ]);
      return {
        balance: ethers.formatUnits(balance, decimals),
        decimals: Number(decimals),
      };
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return { balance: '0', decimals: 18 };
    }
  }

  /**
   * Get token metadata
   */
  static async getTokenMetadata(
  tokenAddress: string,
  network: string          // ← BlockchainNetwork se string
): Promise<{ name: string; symbol: string; decimals: number }> {
    try {
      const provider = this.getEVMProvider(network);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);
      return { name, symbol, decimals: Number(decimals) };
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      throw new Error('Invalid token address');
    }
  }

  /**
   * Send native currency (EVM)
   */
  static async sendEVMTransaction(params: SendTransactionParams): Promise<string> {
    try {
      const provider = this.getEVMProvider(params.network);
      const wallet = new ethers.Wallet(params.privateKey, provider);

      const tx = await wallet.sendTransaction({
        to: params.to,
        value: ethers.parseEther(params.amount),
      });

      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Error sending EVM transaction:', error);
      throw new Error(error.message || 'Transaction failed');
    }
  }

  /**
   * Send ERC20 token
   */
  static async sendTokenTransaction(params: SendTransactionParams): Promise<string> {
    try {
      if (!params.tokenAddress) {
        throw new Error('Token address is required');
      }

      const provider = this.getEVMProvider(params.network);
      const wallet = new ethers.Wallet(params.privateKey, provider);
      const contract = new ethers.Contract(params.tokenAddress, ERC20_ABI, wallet);

      const decimals = await contract.decimals();
      const amount = ethers.parseUnits(params.amount, decimals);

      const tx = await contract.transfer(params.to, amount);
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Error sending token transaction:', error);
      throw new Error(error.message || 'Token transfer failed');
    }
  }

  /**
   * Send Solana transaction (without WebSocket subscriptions)
   */
  static async sendSolanaTransaction(params: SendTransactionParams): Promise<string> {
    try {
      const connection = this.getSolanaConnection();
      const secretKey = Buffer.from(params.privateKey, 'hex');
      const fromKeypair = Keypair.fromSecretKey(secretKey);
      const toPubkey = new PublicKey(params.to);

      const lamports = Math.floor(parseFloat(params.amount) * LAMPORTS_PER_SOL);

      // Create transaction
      const transaction = new SolanaTransaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey,
          lamports,
        })
      );

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromKeypair.publicKey;

      // Sign the transaction
      transaction.sign(fromKeypair);

      // Send transaction without using WebSocket subscriptions
      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      // Manual polling for confirmation (avoid WebSocket)
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (!confirmed && attempts < maxAttempts) {
        const status = await connection.getSignatureStatus(signature);

        if (status?.value?.confirmationStatus === 'confirmed' ||
            status?.value?.confirmationStatus === 'finalized') {
          if (status.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
          }
          confirmed = true;
          break;
        }

        // Wait 1 second before next check
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!confirmed) {
        // Transaction might still be processing, but we'll return the signature
        console.warn('Transaction confirmation timeout, but transaction was sent:', signature);
      }

      return signature;
    } catch (error: any) {
      console.error('Error sending Solana transaction:', error);
      throw new Error(error.message || 'Solana transaction failed');
    }
  }

  /**
   * Send transaction based on network
   */
  static async sendTransaction(params: SendTransactionParams): Promise<string> {
    if (params.tokenAddress) {
      return this.sendTokenTransaction(params);
    }

    switch (params.network) {
      case 'ethereum':
      case 'polygon':
      case 'binance':
      case 'base':
        return this.sendEVMTransaction(params);
      case 'solana':
        return this.sendSolanaTransaction(params);
      case 'bitcoin':
        throw new Error('Bitcoin transactions not yet implemented');
      default:
        throw new Error('Unsupported network');
    }
  }

  /**
   * Get transaction history (simplified - you may want to use proper indexing services)
   */
  static async getTransactionHistory(
    address: string,
    network: BlockchainNetwork
  ): Promise<any[]> {
    // This is a placeholder. In production, use services like:
    // - Etherscan API for Ethereum
    // - PolygonScan API for Polygon
    // - BSCScan API for Binance
    // - Solscan API for Solana
    // - Blockchain.info for Bitcoin
    return [];
  }
}
