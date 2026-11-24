import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="w-full p-3.5 flex items-center justify-between text-left bg-emerald-500/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-300">Android App Installed</div>
            <div className="text-[10px] text-slate-400">Standalone Android Mode Active</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuide(true);
          }
        }}
        className="w-full p-3.5 min-h-[52px] flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              Install Android App
            </div>
            <div className="text-[10px] text-emerald-400">
              {isInstallable
                ? 'Tap to install directly to your home screen'
                : 'Use your browser menu to Add to Home Screen'}
            </div>
          </div>
        </div>
        <Download className="w-4 h-4 text-emerald-400 shrink-0" />
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>How to Install on Your Phone</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {isIOS ? (
              <p className="text-xs text-slate-300 leading-relaxed">
                1. Tap the <strong>Share</strong> button at the bottom of Safari.<br />
                2. Scroll down and select <strong>Add to Home Screen</strong>.
              </p>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed">
                1. Tap the <strong>⋮ (Menu)</strong> button at the top right of Chrome.<br />
                2. Tap <strong>Install App</strong> or <strong>Add to Home screen</strong> to install this software as an Android app.
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
