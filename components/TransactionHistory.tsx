'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';
import { BlockchainNetwork, Transaction } from '@/types';
import { StorageService } from '@/services/storageService';
import { NETWORKS } from '@/config/networks';

interface TransactionHistoryProps {
  address: string;
  network: BlockchainNetwork;
  onBack: () => void;
}

export default function TransactionHistory({
  address,
  network,
  onBack,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const networkConfig = NETWORKS[network];

  useEffect(() => {
    loadTransactions();
  }, [address, network]);

  const loadTransactions = async () => {
  const allTransactions = await StorageService.getTransactions();

  const filtered = allTransactions.filter(
    (tx) =>
      tx.network === network &&
      (
        tx.from.toLowerCase() === address.toLowerCase() ||
        tx.to.toLowerCase() === address.toLowerCase()
      )
  );

  setTransactions(filtered);
  setLoading(false);
};

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const openExplorer = (hash: string) => {
    const url = `${networkConfig.explorer}/tx/${hash}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F] text-white p-6 rounded-b-3xl shadow-2xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <p className="text-blue-100 mt-1">
          {networkConfig.name} transactions
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ArrowUpRight className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-center">
              No transactions yet
            </p>
            <p className="text-gray-500 text-sm text-center mt-2">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <button
                key={tx.hash}
                onClick={() => openExplorer(tx.hash)}
                className="w-full transaction-item"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'send'
                        ? 'bg-red-50'
                        : 'bg-green-50'
                    }`}
                  >
                    {tx.type === 'send' ? (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 capitalize">
                        {tx.type}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : tx.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {tx.type === 'send' ? 'To' : 'From'}: {formatAddress(tx.type === 'send' ? tx.to : tx.from)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(tx.timestamp)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        tx.type === 'send' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {tx.type === 'send' ? '-' : '+'}{parseFloat(tx.value).toFixed(4)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tx.tokenSymbol || networkConfig.symbol}
                    </p>
                  </div>

                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
