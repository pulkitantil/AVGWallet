'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-react';
import { StorageService } from '@/services/storageService';

interface Props {
  onBack: () => void;
}

export default function ChangePassword({ onBack }: Props) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    setMessage('');

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);

    const result = await StorageService.changePassword(
      oldPassword,
      newPassword
    );

    setLoading(false);

    if (result) {
      setSuccess(true);
      setMessage('Password updated successfully');

      setTimeout(() => {
        onBack();
      }, 1500);
    } else {
      setMessage('Current password is incorrect');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F] flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">

        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F] p-4 rounded-2xl">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Change Password
        </h1>

        <p className="text-center text-gray-500 text-sm mb-8">
          Update your wallet security password
        </p>

        {/* Current Password */}

        <div className="relative mb-4">
          <input
            type={showOld ? 'text' : 'password'}
            placeholder="Current Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl pr-12 focus:outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={() => setShowOld(!showOld)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showOld ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* New Password */}

        <div className="relative mb-4">
          <input
            type={showNew ? 'text' : 'password'}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl pr-12 focus:outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showNew ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Confirm Password */}

        <div className="relative mb-4">
          <input
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl pr-12 focus:outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showConfirm ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-sm ${
              success
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {message}
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={loading}
          className="w-full bg-gradient-to-br from-[#0B1220] via-[#1A2B4C] to-[#1E3A5F]
                     text-white py-3 rounded-xl font-semibold
                     hover:opacity-95 active:scale-95 transition-all
                     disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>

        {success && (
          <div className="flex justify-center mt-4 text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}