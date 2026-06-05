'use client';

import { useEffect, useState } from 'react';
import Welcome from '@/components/Welcome';
import CreateWallet from '@/components/CreateWallet';
import WalletDashboard from '@/components/WalletDashboard';
import UnlockWallet from '@/components/UnlockWallet';
import { StorageService } from '@/services/storageService';
import { MultiChainWallet } from '@/types';

type Screen = 'welcome' | 'create' | 'unlock' | 'dashboard';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [unlockedWallet, setUnlockedWallet] = useState<MultiChainWallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasWallet = StorageService.hasWallet();
    if (hasWallet) {
      setCurrentScreen('unlock');
    }
    setLoading(false);
  }, []);

  const handleUnlock = async (password: string): Promise<boolean> => {
    const wallet = await StorageService.unlockWallet(password);
    if (wallet) {
      setUnlockedWallet(wallet);
      setCurrentScreen('dashboard');
      return true;
    }
    return false;
  };

  // After a new wallet is created and saved, unlock it immediately — no second password prompt
  const handleWalletCreated = (wallet: MultiChainWallet) => {
    setUnlockedWallet(wallet);
    setCurrentScreen('dashboard');
  };

  const handleLock = () => {
    setUnlockedWallet(null);
    setCurrentScreen('unlock');
  };

  const handleDeleteWallet = async () => {
    await StorageService.deleteWallet();
    setUnlockedWallet(null);
    setCurrentScreen('welcome');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="spinner" />
      </div>
    );
  }

  if (currentScreen === 'welcome') {
    return <Welcome onGetStarted={() => setCurrentScreen('create')} />;
  }

  if (currentScreen === 'create') {
    return (
      <CreateWallet
        onWalletCreated={handleWalletCreated}
        onBack={() => setCurrentScreen('welcome')}
      />
    );
  }

  if (currentScreen === 'unlock') {
    return (
      <UnlockWallet
        onUnlock={handleUnlock}
        onDeleteWallet={handleDeleteWallet}
      />
    );
  }

  if (currentScreen === 'dashboard' && unlockedWallet) {
    return (
      <WalletDashboard
        wallet={unlockedWallet}
        onLock={handleLock}
      />
    );
  }

  return null;
}