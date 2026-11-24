import React from 'react';
import { useApp } from '../../context/AppContext';
import { Download, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { resolveAbsoluteApkUrl } from '../../utils/publicUrl';

export const AppUpdateModal: React.FC = () => {
  const { isUpdateModalOpen, setIsUpdateModalOpen, settings } = useApp();

  if (!isUpdateModalOpen || !settings) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 p-safe">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative p-5 space-y-4">
        {/* Always provide Close Button */}
        <button
          onClick={() => setIsUpdateModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <img
            src="/assets/aistudio/file_00000000b1a881fa9f8249d48e315dcc_d0d81d28.png"
            alt="Crypto Earn Go Logo"
            className="w-14 h-14 rounded-2xl object-cover mx-auto mb-2 border border-amber-500/40 shadow-lg shadow-amber-500/15"
          />
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Android APK Version {settings.appVersion}
          </span>
          <h2 className="text-base font-extrabold text-white">
            CryptoEarnGo Release
          </h2>
        </div>

        <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs space-y-1.5 text-slate-300">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Release Notes:</span>
          <p className="leading-relaxed text-slate-300">
            {settings.apkReleaseNotes ||
              'Enhanced real-time security, faster USDT BEP-20 confirmations, and modern Android UI optimizations.'}
          </p>
        </div>

        <div className="space-y-2">
          <a
            href={resolveAbsoluteApkUrl(settings.apkDownloadUrl, settings.appVersion)}
            download="CryptoEarnGo.apk"
            onClick={() => setIsUpdateModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download APK</span>
          </a>

          <button
            onClick={() => setIsUpdateModalOpen(false)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
