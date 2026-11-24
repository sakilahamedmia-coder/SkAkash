import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VerifiedBadge } from './VerifiedBadge';
import { VolumeVBadge } from './VolumeVBadge';
import {
  Smartphone,
  LayoutDashboard,
  Columns,
  Radio,
  Moon,
  Sun,
  Download,
  Users,
  ChevronDown,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { resolveAbsoluteApkUrl } from '../utils/publicUrl';

export const TopNav: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    realtimeConnected,
    theme,
    setTheme,
    currentUser,
    allUsers,
    switchDemoUser,
    settings,
    setIsAuthModalOpen
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-40 select-none shrink-0 shadow-md">
      {/* Brand & Live Connection Indicator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <img
            src="/assets/aistudio/file_00000000b1a881fa9f8249d48e315dcc_d0d81d28.png"
            alt="Crypto Earn Go Logo"
            className="w-8 h-8 rounded-xl object-cover border border-amber-500/40 shadow-md shadow-amber-500/20 shrink-0"
          />
          <div className="hidden sm:block">
            <div className="text-xs font-black text-white flex items-center space-x-1.5 leading-tight">
              <span>Crypto Earn Go</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold">
                BEP-20
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Android App & Admin Dashboard
            </div>
          </div>
        </div>

        {/* Real-time sync badge */}
        <div className="hidden md:flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-[10px]">
          <span
            className={`w-2 h-2 rounded-full ${
              realtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-300 font-medium">
            {realtimeConnected ? 'Connected Cloud DB' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Center: View Switcher (Android Mobile vs Web Admin vs Split View) */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
        <button
          onClick={() => setViewMode('mobile')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'mobile'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android App</span>
        </button>

        <button
          onClick={() => setViewMode('admin')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'admin'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Admin Dashboard</span>
        </button>

        <button
          onClick={() => setViewMode('split')}
          className={`hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'split'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
          title="See Android App & Admin side-by-side with real-time updates!"
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Live Sync Demo</span>
        </button>
      </div>

      {/* Right Controls: User Switcher, Theme, APK Download */}
      <div className="flex items-center space-x-2">
        {/* Active Demo Account Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs transition-colors"
          >
            {currentUser ? (
              <>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="font-bold text-white max-w-[90px] truncate hidden sm:inline flex items-center space-x-1">
                  <span>{currentUser.name}</span>
                </span>
                {currentUser.isVerified && <VerifiedBadge size="sm" />}
                {currentUser.hasVolumeVBadge && <VolumeVBadge size="sm" />}
                <span className="text-[10px] text-amber-400 font-mono hidden sm:inline">
                  ${currentUser.balance.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-slate-400 font-medium">Guest User</span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 space-y-1">
              {(currentUser?.isVerified || currentUser?.role === 'admin') && (
                <>
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Test Account:
                  </div>

                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchDemoUser(u.id);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left flex items-center justify-between text-xs transition-colors ${
                        currentUser?.id === u.id ? 'bg-amber-500/15 text-amber-300' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-lg object-cover" />
                        <div className="truncate">
                          <div className="font-bold text-white truncate text-[11px] flex items-center space-x-1">
                            <span>{u.name}</span>
                            {u.isVerified && <VerifiedBadge size="sm" />}
                            {u.hasVolumeVBadge && <VolumeVBadge size="sm" />}
                          </div>
                          <div className="text-[10px] text-slate-400">{u.id}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : u.status === 'suspended'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {u.status}
                      </span>
                    </button>
                  ))}
                </>
              )}

              <div className="pt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setShowUserDropdown(false);
                  }}
                  className="w-full py-1.5 text-center text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  Sign In with Another Email / Google
                </button>
              </div>
            </div>
          )}
        </div>

        {/* APK Download Button */}
        <a
          href={resolveAbsoluteApkUrl(settings?.apkDownloadUrl, settings?.appVersion)}
          download="CryptoEarnGo.apk"
          className="hidden sm:flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-700 transition-colors"
          title="Download Production Android APK"
        >
          <Download className="w-3.5 h-3.5" />
          <span>APK</span>
        </a>
      </div>
    </header>
  );
};
