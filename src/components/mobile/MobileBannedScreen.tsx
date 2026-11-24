import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, AlertTriangle, MessageCircle, Send, LogOut, RefreshCw } from 'lucide-react';

export const MobileBannedScreen: React.FC = () => {
  const { currentUser, logoutUser, settings, refreshAllData } = useApp();

  const isBanned = currentUser?.status === 'banned';

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white space-y-5">
      <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 flex items-center justify-center text-rose-500 shadow-2xl shadow-rose-500/20">
        <ShieldAlert className="w-10 h-10 animate-bounce" />
      </div>

      <div className="space-y-2 max-w-xs">
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-500 text-slate-950 tracking-wider">
          {isBanned ? 'Account Terminated' : 'Account Suspended'}
        </span>
        <h2 className="text-xl font-black text-white">
          Access Restricted by Administration
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {currentUser?.banReason ||
            'Your account activity has been flagged for violation of Crypto Earn Go platform terms (invalid transactions or duplicate referral abuse).'}
        </p>
      </div>

      {/* Account Info Box */}
      <div className="w-full max-w-xs rounded-xl bg-slate-900 border border-slate-800 p-3 text-left space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Account ID:</span>
          <span className="font-mono text-white font-bold">{currentUser?.id}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Account Name:</span>
          <span className="text-white font-bold">{currentUser?.name}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Locked Balance:</span>
          <span className="text-rose-400 font-bold">${currentUser?.balance.toFixed(2)} USDT</span>
        </div>
      </div>

      {/* Action / Appeal Buttons */}
      <div className="w-full max-w-xs space-y-2 pt-2">
        <p className="text-[11px] text-slate-400">
          If you believe this is an error, submit an appeal to the administration team:
        </p>

        {settings?.whatsappLink && (
          <a
            href={settings.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-colors shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Appeal via WhatsApp Support</span>
          </a>
        )}

        {settings?.telegramLink && (
          <a
            href={settings.telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-colors shadow-md"
          >
            <Send className="w-4 h-4 -rotate-12" />
            <span>Appeal via Telegram Admin</span>
          </a>
        )}

        <button
          onClick={logoutUser}
          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors mt-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Switch Account / Log Out</span>
        </button>
      </div>
    </div>
  );
};
