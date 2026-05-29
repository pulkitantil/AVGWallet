'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, Trash2 } from 'lucide-react';

interface UnlockWalletProps {
  onUnlock: (password: string) => Promise<boolean>;
  onDeleteWallet: () => void;
}

export default function UnlockWallet({ onUnlock, onDeleteWallet }: UnlockWalletProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUnlock = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setLoading(true);
    setError('');
    const success = await onUnlock(password);
    if (!success) {
      setError('Incorrect password. Please try again.');
    }
    setPassword('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F]">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl">

        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F] p-4 rounded-2xl">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Unlock Wallet
        </h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          Enter your password to continue
        </p>

        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="Enter password"
            autoFocus
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl pr-12
                       focus:border-blue-500 focus:outline-none text-gray-900"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleUnlock}
          disabled={loading || !password}
          className="w-full bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F]
                     text-white py-3 rounded-xl font-semibold mb-6
                     disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {loading && <div className="spinner" />}
          Unlock
        </button>

        <div className="border-t border-gray-100 pt-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-red-500 text-sm py-2 flex items-center justify-center gap-2
                         hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove wallet from this device
            </button>
          ) : (
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-red-700 text-sm font-medium mb-3 text-center">
                ⚠️ This will permanently delete your wallet. Make sure you have your recovery phrase saved.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={onDeleteWallet}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}