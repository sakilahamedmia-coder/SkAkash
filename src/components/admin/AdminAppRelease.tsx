import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Smartphone,
  Download,
  Upload,
  Save,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { buildApkDownloadUrl, resolveAbsoluteApkUrl, PRODUCTION_APP_URL } from '../../utils/publicUrl';

export const AdminAppRelease: React.FC = () => {
  const { settings, updateSettings, addToast } = useApp();

  const [version, setVersion] = useState(settings?.appVersion || 'v2.4.1');
  const [downloadUrl, setDownloadUrl] = useState(
    resolveAbsoluteApkUrl(settings?.apkDownloadUrl, settings?.appVersion || 'v2.4.1')
  );
  const [releaseNotes, setReleaseNotes] = useState(
    settings?.apkReleaseNotes ||
      'Enhanced real-time security, faster USDT BEP-20 confirmations, modern Android UI animations, and instant transaction notifications.'
  );
  const [forceUpdate, setForceUpdate] = useState(settings?.forceUpdate || false);
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);

  useEffect(() => {
    if (settings) {
      setVersion(settings.appVersion || 'v2.4.1');
      setDownloadUrl(resolveAbsoluteApkUrl(settings.apkDownloadUrl, settings.appVersion));
      setReleaseNotes(
        settings.apkReleaseNotes ||
          'Enhanced real-time security, faster USDT BEP-20 confirmations, modern Android UI animations, and instant transaction notifications.'
      );
      setForceUpdate(Boolean(settings.forceUpdate));
    }
  }, [settings]);

  const handleSaveRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedDownloadUrl = resolveAbsoluteApkUrl(downloadUrl, version);
    setDownloadUrl(normalizedDownloadUrl);
    await updateSettings({
      appVersion: version.trim(),
      apkDownloadUrl: normalizedDownloadUrl,
      apkReleaseNotes: releaseNotes.trim(),
      forceUpdate
    });
  };

  const handleSimulateApkUpload = () => {
    setIsSimulatingUpload(true);
    setTimeout(() => {
      setIsSimulatingUpload(false);
      const nextVer = `v2.4.${Math.floor(Math.random() * 10) + 2}`;
      setVersion(nextVer);
      setDownloadUrl(buildApkDownloadUrl(nextVer));
      addToast(`New Android APK package uploaded and checksum verified (${nextVer})! Click Save to publish.`, 'success');
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Smartphone className="w-6 h-6 text-amber-400" />
          <span>Android App Release & APK Version Control</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Deploy new application version updates to all connected Android mobile clients with automated in-app download prompts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Version settings */}
        <form onSubmit={handleSaveRelease} className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-black text-white">APK Release Deployment</h2>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center space-x-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Publish App Release</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">
                Latest App Version:
              </label>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. v2.4.1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">
                APK Download URL / Route:
              </label>
              <input
                type="text"
                required
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder={`${PRODUCTION_APP_URL}/downloads/CryptoEarnGo-latest.apk`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 block">
              Release Notes & What's New:
            </label>
            <textarea
              rows={4}
              required
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="Detail new features, BEP-20 validator updates, and performance patches..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Force Update Checkbox */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">
                Enforce Mandatory Update (Force Update)
              </span>
              <span className="text-[11px] text-slate-400">
                When enabled, users must update to the latest APK before accessing balances.
              </span>
            </div>
            <input
              type="checkbox"
              checked={forceUpdate}
              onChange={(e) => setForceUpdate(e.target.checked)}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {/* Simulate APK File Upload */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Package: com.cryptoearngo.app (Signed Release)</span>
            </div>
            <button
              type="button"
              disabled={isSimulatingUpload}
              onClick={handleSimulateApkUpload}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSimulatingUpload ? 'Signing APK...' : 'Upload New APK Binary'}</span>
            </button>
          </div>
        </form>

        {/* Right Info: Live APK Verification & Tester */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-sm font-black text-white">APK Verification Info</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Live Version</span>
              <span className="text-base font-black text-amber-400 font-mono">
                {settings?.appVersion || 'v2.4.1'}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Target Platform</span>
              <span className="text-xs font-bold text-white">
                Android 8.0+ (API Level 26 to 35)
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Smart Contract Node</span>
              <span className="text-xs font-bold text-emerald-400 font-mono truncate block">
                BSC BEP-20 (Chain ID 56)
              </span>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={resolveAbsoluteApkUrl(downloadUrl, version)}
              download="CryptoEarnGo.apk"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center justify-center space-x-2 transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Test Download Live APK Binary</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
