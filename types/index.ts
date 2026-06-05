// Blockchain Types
export type BlockchainNetwork =
  | 'ethereum'
  | 'polygon'
  | 'binance'
  | 'base'
  | 'solana'
  | 'bitcoin';

export interface WalletAccount {
  address: string;
  privateKey: string;
  publicKey?: string;
  network: BlockchainNetwork;
  balance: string;
  name?: string;
}

export interface MultiChainWallet {
  mnemonic: string;
  accounts: {
    ethereum: WalletAccount;
    polygon: WalletAccount;
    binance: WalletAccount;
    base: WalletAccount;
    solana: WalletAccount;
    bitcoin: WalletAccount;
  };
  createdAt: number;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  network: BlockchainNetwork;
  logo?: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  network: BlockchainNetwork;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'send' | 'receive';
  tokenSymbol?: string;
  fee?: string;
}

export interface NetworkConfig {
  name: string;
  symbol: string;
  chainId?: number;
  rpcUrl: string;
  explorer: string;
  logo: string;
  color: string;
}

export interface SendTransactionParams {
  from: string;
  to: string;
  amount: string;
  network: BlockchainNetwork;
  privateKey: string;
  tokenAddress?: string;
  gasLimit?: string;
}

export interface CustomNetwork {
  name: string;
  rpcUrl: string;
  chainId: number;
  symbol: string;
  explorer: string;
  logo?: string;
  color?: string;
  isCustom: true;
}