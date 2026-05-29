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
    // Wallet exist karta hai → unlock screen, dashboard nahi
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
    return false; // Wrong password
  };

  // Lock = sirf RAM clear karo, localStorage intact rehta hai
  const handleLock = () => {
    setUnlockedWallet(null);
    setCurrentScreen('unlock');
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
        onWalletCreated={() => setCurrentScreen('unlock')}
        onBack={() => setCurrentScreen('welcome')}
      />
    );
  }

  if (currentScreen === 'unlock') {
    return (
      <UnlockWallet
        onUnlock={handleUnlock}
        onDeleteWallet={() => {
          StorageService.deleteWallet();
          setCurrentScreen('welcome');
        }}
      />
    );
  }

  // Dashboard sirf tab dikhega jab wallet RAM mein ho
  if (currentScreen === 'dashboard' && unlockedWallet) {
    return (
      <WalletDashboard
        wallet={unlockedWallet}
        onLock={handleLock}
      />
    );
  }

  // Fallback — kabhi nahi aana chahiye
  return null;
}