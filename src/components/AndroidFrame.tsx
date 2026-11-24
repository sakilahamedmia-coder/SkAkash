import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useApp } from '../context/AppContext';
import { MobileHeader } from './mobile/MobileHeader';
import { MobileHome } from './mobile/MobileHome';
import { MobileProducts } from './mobile/MobileProducts';
import { MobileReferral } from './mobile/MobileReferral';
import { MobileWallet } from './mobile/MobileWallet';
import { MobileProfile } from './mobile/MobileProfile';
import { MobileAuthModal } from './mobile/MobileAuthModal';
import { MobileBannedScreen } from './mobile/MobileBannedScreen';
import { AppUpdateModal } from './mobile/AppUpdateModal';
import { PushNotificationBanner } from './mobile/PushNotificationBanner';
import { OfflineIndicator } from './mobile/OfflineIndicator';
import { PullToRefresh } from './mobile/PullToRefresh';
import { AdminDashboard } from './admin/AdminDashboard';
import {
  Home,
  ShoppingBag,
  Share2,
  Wallet,
  User,
  Wifi,
  Signal,
  Battery,
  Maximize2,
  Minimize2,
  Smartphone
} from 'lucide-react';

export const AndroidFrame: React.FC = () => {
  const {
    activeMobileTab,
    setActiveMobileTab,
    isProfileAdminOpen,
    setIsProfileAdminOpen,
    currentUser,
    deviceFrame,
    setDeviceFrame,
    settings,
    userNotifications,
    refreshAllData,
    addToast
  } = useApp();

  const handlePullRefresh = async () => {
    await refreshAllData();
    addToast('Latest data refreshed successfully!', 'success');
  };

  const hasUnreadWalletPush = userNotifications.some(
    (n) => !n.isRead && (n.transactionType === 'deposit' || n.transactionType === 'withdrawal')
  );

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const isNativeApp = Capacitor.isNativePlatform();
  const isBannedOrSuspended = currentUser && (currentUser.status === 'banned' || currentUser.status === 'suspended');
  const showMobileHeader = !isBannedOrSuspended && !(isProfileAdminOpen && activeMobileTab === 'profile');

  const renderActiveScreen = () => {
    if (isBannedOrSuspended) {
      return <MobileBannedScreen />;
    }

    switch (activeMobileTab) {
      case 'home':
        return <MobileHome />;
      case 'products':
        return <MobileProducts />;
      case 'referrals':
        return <MobileReferral />;
      case 'wallet':
        return <MobileWallet />;
      case 'profile':
        if (isProfileAdminOpen && currentUser?.isVerified) {
          return (
            <AdminDashboard
              inApp
              onClose={() => setIsProfileAdminOpen(false)}
            />
          );
        }
        return <MobileProfile />;
      default:
        return <MobileHome />;
    }
  };

  return (
    <div
      className={`w-full flex flex-col items-center justify-center select-none ${
        isNativeApp ? 'p-0 h-[100dvh]' : 'p-0 sm:p-4'
      }`}
    >
      {/* Frame Mode Switch Button (Desktop preview helper only) */}
      {!isNativeApp && (
        <div className="mb-2 hidden sm:flex items-center space-x-2 text-xs text-slate-400">
          <button
            onClick={() => setDeviceFrame(!deviceFrame)}
            className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800/80 hover:bg-slate-700/80 rounded-full border border-slate-700 text-slate-300 font-semibold transition-colors"
          >
            {deviceFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            <span>{deviceFrame ? 'Expand Tablet / Wide Android View' : 'Show Android Phone Frame'}</span>
          </button>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-[11px] text-amber-400">
            Android App v{settings?.appVersion || '2.4.1'}
          </span>
        </div>
      )}

      {/* The Android App Shell */}
      <div
        className={`w-full transition-all duration-300 flex flex-col bg-slate-950 relative overflow-hidden ${
          isNativeApp
            ? 'h-[100dvh] px-safe'
            : deviceFrame
              ? 'h-[100dvh] px-safe sm:px-0 sm:max-w-[412px] sm:h-[860px] sm:rounded-[48px] sm:border-[10px] sm:border-slate-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] sm:ring-1 sm:ring-slate-700/60'
              : 'h-[100dvh] px-safe sm:px-0 sm:max-w-5xl sm:h-[92vh] sm:rounded-3xl sm:border sm:border-slate-800 sm:shadow-2xl'
        }`}
      >
        {/* REAL SYSTEM STATUS BAR SAFE-AREA INSET (Native APK + Mobile Web/PWA) */}
        <div
          className={`shrink-0 w-full pt-safe ${
            showMobileHeader ? 'bg-slate-900/90' : 'bg-slate-950'
          } ${isNativeApp ? '' : 'sm:hidden'}`}
        />

        {/* SIMULATED ANDROID NOTCH & STATUS BAR (Desktop Preview Only) */}
        {!isNativeApp && (
          <div className="hidden sm:flex h-10 bg-slate-950 text-white px-6 items-center justify-between text-xs font-semibold z-40 select-none shrink-0 border-b border-slate-900/40">
            {/* Clock */}
            <span className="font-medium tracking-tight text-[11px] text-slate-300 tabular-nums">
              {currentTime || '09:41'}
            </span>

            {/* Front Camera Punch-hole */}
            <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-800 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            </div>

            {/* System Icons (5G, Wi-Fi, Battery) */}
            <div className="flex items-center space-x-1.5 text-slate-300">
              <span className="text-[10px] font-bold text-emerald-400">5G</span>
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        )}

        {/* OFFLINE MODE INDICATOR */}
        <OfflineIndicator />

        {/* REAL-TIME HEADS-UP PUSH NOTIFICATION BANNER */}
        {!isBannedOrSuspended && <PushNotificationBanner />}

        {/* APP HEADER */}
        {showMobileHeader && <MobileHeader />}

        {/* SCROLLABLE SCREEN CONTENT WITH ANDROID PULL-TO-REFRESH */}
        <PullToRefresh
          onRefresh={handlePullRefresh}
          className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 scrollbar-thin scrollbar-thumb-slate-800"
        >
          {renderActiveScreen()}
        </PullToRefresh>

        {/* BOTTOM ANDROID TAB NAVIGATION (5 Tabs) */}
        {!isBannedOrSuspended ? (
          <nav className="shrink-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 pt-1.5 pb-[max(0.375rem,var(--app-inset-bottom))] flex items-center justify-around z-30 shadow-lg">
            {/* Home */}
            <button
              onClick={() => setActiveMobileTab('home')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                activeMobileTab === 'home'
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Home</span>
            </button>

            {/* Products */}
            <button
              onClick={() => setActiveMobileTab('products')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition-all ${
                activeMobileTab === 'products'
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Products</span>
            </button>

            {/* Referral */}
            <button
              onClick={() => setActiveMobileTab('referrals')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition-all ${
                activeMobileTab === 'referrals'
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Referral</span>
            </button>

            {/* Wallet */}
            <button
              onClick={() => setActiveMobileTab('wallet')}
              className={`relative flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                activeMobileTab === 'wallet'
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {hasUnreadWalletPush && (
                <span className="absolute top-0.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              )}
              <Wallet className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Wallet</span>
            </button>

            {/* Profile */}
            <button
              onClick={() => {
                setActiveMobileTab('profile');
                if (activeMobileTab === 'profile' && isProfileAdminOpen) {
                  setIsProfileAdminOpen(false);
                }
              }}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                activeMobileTab === 'profile'
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Profile</span>
            </button>
          </nav>
        ) : (
          <div className="shrink-0 w-full bg-slate-950 pb-safe" />
        )}

        {/* SIMULATED BOTTOM ANDROID GESTURE PILL BAR (Desktop Preview Only) */}
        {!isNativeApp && (
          <div className="hidden sm:flex h-4 bg-slate-950 items-center justify-center shrink-0">
            <div className="w-32 h-1 bg-slate-700 rounded-full" />
          </div>
        )}

        {/* MODALS */}
        <MobileAuthModal />
        <AppUpdateModal />
      </div>
    </div>
  );
};
