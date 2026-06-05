'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { MultiChainWallet, BlockchainNetwork, Token } from '@/types';
import { BlockchainService } from '@/services/blockchainService';
import { StorageService } from '@/services/storageService';
import { NETWORKS } from '@/config/networks';

interface SendTransactionProps {
  wallet: MultiChainWallet;
  network: BlockchainNetwork;
  onBack: () => void;
  onSuccess: () => void;
}

export default function SendTransaction({
  wallet,
  network,
  onBack,
  onSuccess,
}: SendTransactionProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [balance, setBalance] = useState('0');
  const [isFocused, setIsFocused] = useState(false);

  const account = wallet.accounts[network as BlockchainNetwork];
  const networkConfig = NETWORKS[network as keyof typeof NETWORKS];
  const isEVM = ['ethereum', 'polygon', 'binance', 'base'].includes(network as string);

  useEffect(() => {
    loadBalance();
    if (isEVM) {
      loadTokens();
    }
  }, [network]);

  const loadBalance = async () => {
    if (!account) return;
    try {
      const bal = await BlockchainService.getBalance(account.address, network as BlockchainNetwork);
      setBalance(bal);
    } catch (err: any) {
      console.error('Error loading balance', err);
      setBalance('0');
    }
  };

  const loadTokens = async () => {
    const allTokens = await StorageService.getTokens();
    const networkTokens = allTokens.filter((t) => t.network === network);
    setTokens(networkTokens);
  };

  const handleSend = async () => {
    setError('');
    setSuccess('');

    if (!recipient.trim()) {
      setError('Please enter recipient address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const availableBalance = selectedToken ? selectedToken.balance : balance;
    if (parseFloat(amount) > parseFloat(availableBalance)) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);

    try {
      const txHash = await BlockchainService.sendTransaction({
        from: account.address,
        to: recipient.trim(),
        amount,
        network: network as BlockchainNetwork,
        privateKey: account.privateKey,
        tokenAddress: selectedToken?.address,
      });

      await StorageService.addTransaction({
        hash: txHash,
        from: account.address,
        to: recipient.trim(),
        value: amount,
        timestamp: Date.now(),
        network: network as BlockchainNetwork,
        status: 'confirmed',
        type: 'send',
        tokenSymbol: selectedToken?.symbol || networkConfig?.symbol || 'TOKEN',
      });

      setSuccess(`Transaction sent! Hash: ${txHash.slice(0, 10)}...`);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxAmount = () => {
    const availableBalance = selectedToken ? selectedToken.balance : balance;
    setAmount(availableBalance);
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
        <h1 className="text-2xl font-bold">Send {networkConfig?.symbol}</h1>
        <p className="text-blue-100 mt-1">
          Balance: {parseFloat(balance).toFixed(4)} {networkConfig?.symbol}
        </p>
      </div>

      <div className="flex-1 p-6">
        {/* Token Selector (for EVM chains) */}
        {isEVM && tokens.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset
            </label>
            <select
              value={selectedToken?.address || ''}
              onChange={(e) => {
                const token = tokens.find((t) => t.address === e.target.value);
                setSelectedToken(token || null);
              }}
              className="input-field"
            >
              <option value="">{networkConfig?.symbol} (Native)</option>
              {tokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {parseFloat(token.balance).toFixed(4)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Recipient Address */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={`Enter ${networkConfig?.name || 'network'} address`}
            className="input-field"
          />
        </div>

        {/* Amount */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <button
              onClick={handleMaxAmount}
              className="text-[#FF9902] text-sm font-medium hover:underline"
            >
              <strong>Max</strong>
            </button>
          </div>
         <div className="flex items-center border-2 border-gray-200 rounded-xl focus-within:border-blue-500 overflow-hidden">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="any"
            className="flex-1 px-4 py-3 outline-none bg-transparent text-gray-900"
          />
          <span className="px-4 py-3 text-gray-500 font-medium bg-transparent select-none border-l border-gray-200">
            {selectedToken?.symbol || networkConfig?.symbol}
          </span>
        </div>
        </div>

        {/* Estimated Fee */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Network Fee</span>
            <span className="text-gray-900 font-medium">~ 0.001 {networkConfig?.symbol}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Fee may vary based on network congestion
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm">{error}</div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-4 text-sm">{success}</div>
        )}

        <button
          onClick={handleSend}
          disabled={loading || !recipient || !amount}
          className="primary-theme-btn w-full bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F] text-white p-6 rounded-[28px] shadow-2xl border border-white/10 hover:scale-[1.02] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="spinner" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}