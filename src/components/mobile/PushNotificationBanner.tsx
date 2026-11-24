import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowDownLeft, ArrowUpRight, BellRing, CheckCircle2, X } from 'lucide-react';

export const PushNotificationBanner: React.FC = () => {
  const { activePushBanner, dismissPushBanner, setActiveMobileTab, markNotificationsRead } = useApp();

  if (!activePushBanner) return null;

  const isDeposit = activePushBanner.transactionType === 'deposit';
  const isWithdrawal = activePushBanner.transactionType === 'withdrawal';

  const handleBannerClick = () => {
    if (isDeposit || isWithdrawal) {
      setActiveMobileTab('wallet');
    } else {
      setActiveMobileTab('profile');
    }
    markNotificationsRead();
    dismissPushBanner();
  };

  return (
    <div className="absolute top-11 inset-x-2.5 z-50 animate-in slide-in-from-top-3 duration-300">
      <div
        onClick={handleBannerClick}
        className={`cursor-pointer rounded-2xl border p-3 shadow-2xl backdrop-blur-xl flex items-start space-x-2.5 transition-all hover:scale-[1.01] ${
          isDeposit
            ? 'bg-slate-900/95 border-emerald-500/50 shadow-emerald-950/60'
            : isWithdrawal
            ? 'bg-slate-900/95 border-amber-500/50 shadow-amber-950/60'
            : 'bg-slate-900/95 border-sky-500/40 shadow-slate-950/60'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            isDeposit
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : isWithdrawal
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
          }`}
        >
          {isDeposit ? (
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
          ) : isWithdrawal ? (
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <BellRing className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 inline-flex items-center space-x-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>LIVE PUSH</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Just now</span>
          </div>

          <h4 className="text-xs font-extrabold text-white truncate mt-0.5">
            {activePushBanner.title}
          </h4>
          <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 mt-0.5">
            {activePushBanner.message}
          </p>
          <span className="text-[9px] text-amber-400 font-bold mt-1 inline-block">
            {isDeposit || isWithdrawal ? 'Tap to view Wallet →' : 'View details →'}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismissPushBanner();
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
