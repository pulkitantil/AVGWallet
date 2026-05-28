import { NetworkConfig } from '@/types';

// Using free public RPC endpoints (no API keys required)
// For production, consider using your own RPC endpoints for better reliability

export const NETWORKS: Record<string, NetworkConfig> = {
  binance: {
  name: 'BNB Smart Chain',
  symbol: 'BNB',
  chainId: 56,
  rpcUrl: `https://bnb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  explorer: 'https://bscscan.com',
  logo: '◆',
  color: '#F3BA2F',
},

ethereum: {
  name: 'Ethereum',
  symbol: 'ETH',
  chainId: 1,
  rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  explorer: 'https://etherscan.io',
  logo: '⟠',
  color: '#627EEA',
},

polygon: {
  name: 'Polygon',
  symbol: 'MATIC',
  chainId: 137,
  rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  explorer: 'https://polygonscan.com',
  logo: '⬡',
  color: '#8247E5',
},

base: {
  name: 'Base',
  symbol: 'ETH',
  chainId: 8453,
  rpcUrl: `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  explorer: 'https://basescan.org',
  logo: '🔵',
  color: '#0052FF',
},
  solana: {
    name: 'Solana',
    symbol: 'SOL',
    rpcUrl: `https://solana-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY}`,  // Alchemy Solana RPC
    explorer: 'https://solscan.io',
    logo: '◎',
    color: '#14F195',
  },
  bitcoin: {
    name: 'Bitcoin',
    symbol: 'BTC',
    rpcUrl: `https://bitcoin-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    explorer: 'https://blockchain.info',
    logo: '₿',
    color: '#F7931A',
  },
};

export const EVM_NETWORKS = ['ethereum', 'polygon', 'binance', 'base'];
export const NON_EVM_NETWORKS = ['solana', 'bitcoin'];

// Common stablecoins for each network
export const COMMON_TOKENS: Record<string, Array<{ address: string; symbol: string; name: string; decimals: number }>> = {
  ethereum: [
    {
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
    },
    {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    {
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
    },
  ],
  polygon: [
    {
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
    },
    {
      address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
  ],
  binance: [
    {
      address: '0x55d398326f99059ff775485246999027b3197955',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
    },
    {
      address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
    },
  ],
  base: [
    {
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
  ],
};
