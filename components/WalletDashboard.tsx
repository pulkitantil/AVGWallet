'use client';

import { useEffect, useState, useCallback } from 'react';
import { Send, Plus, RefreshCw, Menu, Copy, Check, Eye, EyeOff, Download, Home, Clock, User, Lock } from 'lucide-react';
import { MultiChainWallet, BlockchainNetwork, Token } from '@/types';
import { StorageService } from '@/services/storageService';
import { BlockchainService } from '@/services/blockchainService';
import { NETWORKS, COMMON_TOKENS } from '@/config/networks';
import SendTransaction from './SendTransaction';
import AddToken from './AddToken';
import TransactionHistory from './TransactionHistory';
import ExportWallet from './ExportWallet';
import ChangePassword from './ChangePassword';
import { ChevronDown } from 'lucide-react';

type FooterTab = 'assets' | 'history' | 'account';

interface WalletDashboardProps {
  wallet: MultiChainWallet;
  onLock: () => void;
}

export default function WalletDashboard({ wallet, onLock }: WalletDashboardProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<BlockchainNetwork>('binance');
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [activeTab, setActiveTab] = useState<FooterTab>('assets');
  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadUserTokens = () => {
    const tokens = StorageService.getTokens();
    setUserTokens(tokens);
  };

  const isPlaceholderAddress = (address: string): boolean => {
    return address.startsWith('0x0000') || address.startsWith('1111');
  };

  const fetchBalances = useCallback(async () => {
    if (!wallet) return;
    setRefreshing(true);
    const newBalances: Record<string, string> = {};

    try {
      const networks: BlockchainNetwork[] = ['ethereum', 'polygon', 'binance', 'base', 'solana', 'bitcoin'];

      for (const network of networks) {
        const account = wallet.accounts[network];
        if (isPlaceholderAddress(account.address)) {
          newBalances[network] = '0';
          continue;
        }
        try {
          const balance = await BlockchainService.getBalance(account.address, network);
          newBalances[network] = balance;
        } catch (error) {
          console.error(`Error fetching ${network} balance:`, error);
          newBalances[network] = '0';
        }
      }
      setBalances(newBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setRefreshing(false);
    }
  }, [wallet]);

  const fetchTokenBalances = useCallback(async () => {
    if (!wallet) return;

    const currentAccount = wallet.accounts[selectedNetwork];
    if (
      isPlaceholderAddress(currentAccount.address) ||
      !['ethereum', 'polygon', 'binance', 'base'].includes(selectedNetwork)
    ) {
      return;
    }

    const newTokenBalances: Record<string, string> = {};

    try {
      const commonTokens = COMMON_TOKENS[selectedNetwork] || [];
      for (const token of commonTokens) {
        try {
          const { balance } = await BlockchainService.getTokenBalance(
            token.address, currentAccount.address, selectedNetwork
          );
          newTokenBalances[`${selectedNetwork}-${token.address}`] = balance;
        } catch {
          newTokenBalances[`${selectedNetwork}-${token.address}`] = '0';
        }
      }

      const networkUserTokens = userTokens.filter((t) => t.network === selectedNetwork);
      for (const token of networkUserTokens) {
        try {
          const { balance } = await BlockchainService.getTokenBalance(
            token.address, currentAccount.address, selectedNetwork
          );
          newTokenBalances[`${selectedNetwork}-${token.address}`] = balance;
        } catch {
          newTokenBalances[`${selectedNetwork}-${token.address}`] = '0';
        }
      }

      setTokenBalances(newTokenBalances);
    } catch (error) {
      console.error('Error fetching token balances:', error);
    }
  }, [wallet, selectedNetwork, userTokens]);

  useEffect(() => {
    loadUserTokens();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (wallet) {
      fetchBalances();
      fetchTokenBalances();
    }
  }, [wallet, selectedNetwork, userTokens, fetchBalances, fetchTokenBalances]);

  const handleCopyAddress = () => {
    const address = wallet.accounts[selectedNetwork].address;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(4);
  };

  const handleRemoveWallet = () => {
    StorageService.deleteWallet();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const currentAccount = wallet.accounts[selectedNetwork];
  const currentBalance = balances[selectedNetwork] || '0';
  const networkConfig = NETWORKS[selectedNetwork];

  if (showSend) {
    return (
      <SendTransaction
        wallet={wallet}
        network={selectedNetwork}
        onBack={() => setShowSend(false)}
        onSuccess={() => { setShowSend(false); fetchBalances(); }}
      />
    );
  }

  if (showAddToken) {
    return (
      <AddToken
        network={selectedNetwork}
        onBack={() => setShowAddToken(false)}
        onTokenAdded={() => { setShowAddToken(false); loadUserTokens(); }}
      />
    );
  }

  if (showHistory) {
    return (
      <TransactionHistory
        address={currentAccount.address}
        network={selectedNetwork}
        onBack={() => { setShowHistory(false); setActiveTab('assets'); }}
      />
    );
  }

  if (showExport) {
    return <ExportWallet wallet={wallet} onBack={() => setShowExport(false)} />;
  }
  if (showChangePassword) {
  return (
    <ChangePassword
      onBack={() => setShowChangePassword(false)}
    />
  );
}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F] pt-12 pb-20 px-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg">
              <img src="/logo.png" alt="Company Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-wide">AGILAVETRI</h1>
              <p className="text-xs text-[#A0E817] uppercase tracking-[0.2em]">Web3 Wallet</p>
            </div>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Network Dropdown */}
        <div className="relative mb-6">
          <button
            onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
            className="w-full flex items-center justify-between bg-white/5 border border-white/10
                       backdrop-blur-xl rounded-2xl px-4 py-3 text-white hover:border-[#A0E817]/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{networkConfig.logo}</span>
              <span className="font-medium">{networkConfig.name}</span>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${showNetworkDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showNetworkDropdown && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-[#101827]/95 backdrop-blur-2xl
                            border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
              {Object.entries(NETWORKS).map(([key, network]) => (
                <button
                  key={key}
                  onClick={() => { setSelectedNetwork(key as BlockchainNetwork); setShowNetworkDropdown(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-all border-b border-white/5
                              ${selectedNetwork === key ? 'bg-[#A0E817]/15 text-[#A0E817]' : 'text-white hover:bg-white/5'}`}
                >
                  <span className="text-lg">{network.logo}</span>
                  <span className="font-medium">{network.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Balance Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-blue-100 text-sm">Total Balance</p>
            <button onClick={fetchBalances} disabled={refreshing} className="text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="mb-4">
            <h2 className="text-white text-4xl font-bold mb-1">{formatBalance(currentBalance)}</h2>
            <p className="text-blue-100 text-lg">{networkConfig.symbol}</p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <button onClick={() => setShowAddress(!showAddress)} className="text-white hover:text-blue-100 transition-colors">
              {showAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <span className="text-white font-mono text-sm flex-1">
              {showAddress ? currentAccount.address : formatAddress(currentAccount.address)}
            </span>
            <button onClick={handleCopyAddress} className="text-white hover:text-blue-100 transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 -mt-12 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setShowSend(true)}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all active:scale-95 flex flex-col items-center gap-3">
            <div className="bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F] text-white p-4 rounded-full shadow-lg">
              <Send className="w-6 h-6" />
            </div>
            <span className="font-semibold text-gray-900">Send</span>
          </button>

          <button onClick={() => setShowAddToken(true)}
            disabled={!['ethereum', 'polygon', 'binance', 'base'].includes(selectedNetwork)}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all active:scale-95 flex flex-col items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
            <div className="bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F] text-white p-4 rounded-full shadow-lg">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-semibold text-gray-900">Add Token</span>
          </button>
        </div>
      </div>

      {/* Assets */}
      <div className="px-6 pb-24">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets</h3>
        <div className="space-y-3">
          {/* Native Currency */}
          <div className="card-hover">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${networkConfig.color}20` }}>
                  {networkConfig.logo}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{networkConfig.symbol}</p>
                  <p className="text-sm text-gray-500">{networkConfig.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatBalance(currentBalance)}</p>
                <p className="text-sm text-gray-500">{networkConfig.symbol}</p>
              </div>
            </div>
          </div>

          {/* Common Tokens */}
          {['ethereum', 'polygon', 'binance', 'base'].includes(selectedNetwork) &&
            COMMON_TOKENS[selectedNetwork]?.map((token) => {
              const tokenKey = `${selectedNetwork}-${token.address}`;
              const balance = tokenBalances[tokenKey] || '0';
              return (
                <div key={tokenKey} className="card-hover">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{token.symbol.substring(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{token.symbol}</p>
                        <p className="text-sm text-gray-500">{token.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatBalance(balance)}</p>
                      <p className="text-sm text-gray-500">{token.symbol}</p>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* User Tokens */}
          {userTokens.filter((token) => token.network === selectedNetwork).map((token) => {
            const tokenKey = `${selectedNetwork}-${token.address}`;
            const balance = tokenBalances[tokenKey] || '0';
            return (
              <div key={tokenKey} className="card-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">{token.symbol.substring(0, 2)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{token.symbol}</p>
                      <p className="text-sm text-gray-500">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatBalance(balance)}</p>
                    <p className="text-sm text-gray-500">{token.symbol}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu Modal */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end animate-fadeIn"
          onClick={() => { setShowMenu(false); setActiveTab('assets'); }}>
          <div className="bg-white w-full rounded-t-3xl p-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            <div className="space-y-3">
              <button
                onClick={() => { setShowMenu(false); setActiveTab('assets'); setShowExport(true); }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl text-gray-900 font-medium flex items-center gap-3"
              >
                <Download className="w-5 h-5 text-blue-600" />
                Export Wallet
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowChangePassword(true);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl text-gray-900 font-medium flex items-center gap-3"
              >
                <Lock className="w-5 h-5 text-orange-600" />
                Change Password
              </button>

              {/* LOCK — RAM clear, storage intact */}
              <button
                onClick={() => { setShowMenu(false); onLock(); }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl text-gray-900 font-medium flex items-center gap-3"
              >
                <Lock className="w-5 h-5 text-gray-600" />
                Lock Wallet
              </button>

              {/* REMOVE — permanent delete, with confirmation */}
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl text-red-600 font-medium flex items-center gap-3"
                >
                  <span className="text-xl">⚠️</span>
                  Remove Wallet
                </button>
              ) : (
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-red-700 text-sm font-medium mb-3">
                    ⚠️ This will permanently delete your wallet from this device. Are you sure you have your recovery phrase saved?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 text-sm">
                      Cancel
                    </button>
                    <button onClick={handleRemoveWallet}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-40">
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <button onClick={() => setActiveTab('assets')}
            className={`flex flex-col items-center gap-1 py-2 transition-colors ${activeTab === 'assets' ? 'text-trust-blue' : 'text-gray-500'}`}>
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Assets</span>
          </button>
          <button onClick={() => { setActiveTab('history'); setShowHistory(true); }}
            className={`flex flex-col items-center gap-1 py-2 transition-colors ${activeTab === 'history' ? 'text-trust-blue' : 'text-gray-500'}`}>
            <Clock className="w-6 h-6" />
            <span className="text-xs font-medium">History</span>
          </button>
          <button onClick={() => { setActiveTab('account'); setShowMenu(true); }}
            className={`flex flex-col items-center gap-1 py-2 transition-colors ${activeTab === 'account' ? 'text-trust-blue' : 'text-gray-500'}`}>
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}