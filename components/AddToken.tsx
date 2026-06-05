'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { BlockchainNetwork, Token, MultiChainWallet } from '@/types';
import { BlockchainService } from '@/services/blockchainService';
import { StorageService } from '@/services/storageService';
import { NETWORKS, COMMON_TOKENS } from '@/config/networks';

interface AddTokenProps {
  wallet: MultiChainWallet;
  network: BlockchainNetwork;
  onBack: () => void;
  onTokenAdded: () => void;
}

export default function AddToken({ wallet, network, onBack, onTokenAdded }: AddTokenProps) {
  const [tokenAddress, setTokenAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    symbol: string;
    decimals: number;
  } | null>(null);

  const networkConfig = NETWORKS[network as keyof typeof NETWORKS];
  const commonTokens = COMMON_TOKENS[network as keyof typeof COMMON_TOKENS] || [];
  const currentAccount = wallet.accounts[network as BlockchainNetwork];

  // Auto-fetch when a valid address is typed
  useEffect(() => {
    const address = tokenAddress.trim();
    if (address.length === 42 && address.startsWith('0x')) {
      handleSearchToken(address);
    } else {
      setTokenInfo(null);
    }
  }, [tokenAddress]);

  const handleSearchToken = async (addressToSearch?: string) => {
    const address = addressToSearch || tokenAddress;

    if (!address.trim()) {
      setError('Please enter a token address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      setError('Invalid format. Address must be 42 characters starting with 0x.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const metadata = await BlockchainService.getTokenMetadata(
        address.trim(),
        network as string
      );
      setTokenInfo(metadata);
    } catch (err: any) {
      console.error(err);
      setError(`Token not found on ${networkConfig?.name || 'this network'}. Make sure the address is correct.`);
      setTokenInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToken = async () => {
    if (!tokenInfo || !currentAccount) return;

    try {
      setLoading(true);
      const { balance } = await BlockchainService.getTokenBalance(
        tokenAddress.trim(),
        currentAccount.address,
        network as string
      );

      const token: Token = {
        address: tokenAddress.trim(),
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        decimals: tokenInfo.decimals,
        balance,
        network: network as BlockchainNetwork,
      };

      await StorageService.addToken(token);
      onTokenAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to add token');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCommonToken = async (token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  }) => {
    if (!currentAccount) return;

    try {
      const { balance } = await BlockchainService.getTokenBalance(
        token.address,
        currentAccount.address,
        network as string
      );

      const newToken: Token = {
        ...token,
        balance,
        network: network as BlockchainNetwork,
      };

      await StorageService.addToken(newToken);
      onTokenAdded();
    } catch (err) {
      console.error('Error adding token:', err);
      setError(`Could not add ${token.symbol}. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F] text-white p-6 rounded-b-3xl shadow-2xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-bold">Add Token</h1>
        <p className="text-blue-100 mt-1">
          Import custom tokens to {networkConfig?.name || 'Network'}
        </p>
      </div>

      <div className="flex-1 p-6">
        {/* Popular Tokens */}
        {commonTokens.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Popular Tokens
            </h2>
            <div className="space-y-2">
              {commonTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleAddCommonToken(token)}
                  className="w-full bg-gray-50 hover:bg-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between transition-all active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-base font-bold text-gray-700">
                        {token.symbol.charAt(0)}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{token.symbol}</p>
                      <p className="text-sm text-gray-500">{token.name}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-[#A0E817]/15 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-[#A0E817]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Token */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Custom Token
          </h2>

          <div className="space-y-4">
            {/* Token Address Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Contract Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => {
                    setTokenAddress(e.target.value);
                    setError('');
                  }}
                  placeholder="0x..."
                  className="input-field w-full pr-12"
                />
                {loading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="spinner w-5 h-5 border-2 border-blue-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Token Symbol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Symbol
              </label>
              <input
                type="text"
                value={tokenInfo ? tokenInfo.symbol : ''}
                readOnly
                placeholder="e.g. USDT"
                className="input-field bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
              />
            </div>

            {/* Token Decimals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Decimal
              </label>
              <input
                type="text"
                value={tokenInfo ? tokenInfo.decimals.toString() : ''}
                readOnly
                placeholder="e.g. 18"
                className="input-field bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleAddToken}
            disabled={!tokenInfo || loading}
            className="w-full mt-6 bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F] text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Add Token
          </button>
        </div>
      </div>
    </div>
  );
}