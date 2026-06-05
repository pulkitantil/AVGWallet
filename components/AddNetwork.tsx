'use client';

import { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { CustomNetwork } from '@/types';
import { StorageService } from '@/services/storageService';
import { ethers } from 'ethers';

interface AddNetworkProps {
  onBack: () => void;
  onNetworkAdded: (network: CustomNetwork) => void;
}

export default function AddNetwork({ onBack, onNetworkAdded }: AddNetworkProps) {
  const [name, setName] = useState('');
  const [rpcUrl, setRpcUrl] = useState('');
  const [chainId, setChainId] = useState('');
  const [symbol, setSymbol] = useState('');
  const [explorer, setExplorer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    // Validation
    if (!name.trim()) return setError('Network name is required');
    if (!rpcUrl.trim()) return setError('RPC URL is required');
    if (!chainId.trim()) return setError('Chain ID is required');
    if (!symbol.trim()) return setError('Currency symbol is required');

    setError('');
    setLoading(true);

    try {
      // RPC URL validate karo — actual provider se connect karke
      const provider = new ethers.JsonRpcProvider(rpcUrl.trim());
      const network = await provider.getNetwork();

      // Chain ID match check
      if (Number(network.chainId) !== Number(chainId)) {
        throw new Error(
          `Chain ID mismatch: RPC returned ${network.chainId}, you entered ${chainId}`
        );
      }

      const customNetwork: CustomNetwork = {
        name: name.trim(),
        rpcUrl: rpcUrl.trim(),
        chainId: Number(chainId),
        symbol: symbol.trim().toUpperCase(),
        explorer: explorer.trim(),
        logo: symbol.trim().charAt(0).toUpperCase(),
        color: '#6B7280',
        isCustom: true,
      };

      StorageService.addCustomNetwork(customNetwork);
      onNetworkAdded(customNetwork);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to network. Check RPC URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F] text-white p-6 rounded-b-3xl shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Add network</h1>
          <button onClick={onBack} className="hover:opacity-80 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 p-6 space-y-5">
        {/* Network Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Network name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter network name"
            className="input-field w-full"
          />
        </div>

        {/* RPC URL */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Default RPC URL
          </label>
          <input
            type="url"
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
            placeholder="https://..."
            className="input-field w-full"
          />
        </div>

        {/* Chain ID */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Chain ID
          </label>
          <input
            type="number"
            value={chainId}
            onChange={(e) => setChainId(e.target.value)}
            placeholder="Enter Chain ID"
            className="input-field w-full"
          />
        </div>

        {/* Currency Symbol */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Currency symbol
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Enter symbol"
            className="input-field w-full"
          />
        </div>

        {/* Block Explorer URL */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Block explorer URL
          </label>
          <input
            type="url"
            value={explorer}
            onChange={(e) => setExplorer(e.target.value)}
            placeholder="https://..."
            className="input-field w-full"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <div className="spinner" /> : 'Save'}
        </button>
      </div>
    </div>
  );
}