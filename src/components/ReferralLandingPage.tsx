import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  ArrowRight,
  Check,
  Copy,
  ShieldCheck,
  Smartphone,
  UserPlus,
  CheckCircle2,
  MousePointerClick,
  Users,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReferralTrackingStats } from '../types';
import { apiFetch } from '../utils/apiTransport';
import {
  buildReferralUrl,
  buildTrackedApkDownloadUrl,
  normalizeReferralCodeInput,
  resolveAbsoluteApkUrl
} from '../utils/publicUrl';
import { VerifiedBadge } from './VerifiedBadge';

interface ValidateReferralResponse {
  valid: boolean;
  publicAppUrl?: string;
  referrerName: string | null;
  referrerAvatar: string | null;
  referrerVerified: boolean;
  referralCode: string | null;
  firstTaskBonusPercent: number;
  commissionPercent: number;
  appVersion: string;
  apkDownloadUrl: string;
  apkReleaseNotes?: string;
  tracking: ReferralTrackingStats | null;
}

interface ReferralLandingPageProps {
  code: string;
}

export const ReferralLandingPage: React.FC<ReferralLandingPageProps> = ({ code }) => {
  const { settings, closeReferralLanding, trackReferralEvent, addToast } = useApp();
  const cleanCode = normalizeReferralCodeInput(code);

  const [loading, setLoading] = useState<boolean>(true);
  const [info, setInfo] = useState<ValidateReferralResponse | null>(null);
  const [tracking, setTracking] = useState<ReferralTrackingStats | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [downloadStarted, setDownloadStarted] = useState<boolean>(false);
  const trackedClickRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadReferralLanding = async () => {
      if (!cleanCode) {
        if (active) setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let res = await apiFetch(`/api/referrals/validate/${encodeURIComponent(cleanCode)}`);
        if (!res.ok) {
          await new Promise((r) => setTimeout(r, 250));
          res = await apiFetch(`/api/referrals/validate/${encodeURIComponent(cleanCode)}`);
        }
        if (res.ok && active) {
          const data: ValidateReferralResponse = await res.json();
          setInfo(data);
          if (data.tracking) {
            setTracking(data.tracking);
          }

          if (data.valid && trackedClickRef.current !== cleanCode) {
            trackedClickRef.current = cleanCode;
            const sessionKey = `ceg_ref_click_${cleanCode}`;
            const alreadyRecorded =
              typeof window !== 'undefined' && window.sessionStorage.getItem(sessionKey) === '1';

            if (!alreadyRecorded) {
              if (typeof window !== 'undefined') {
                window.sessionStorage.setItem(sessionKey, '1');
              }
              const updated = await trackReferralEvent(cleanCode, 'click', 'landing_visit');
              if (active && updated) {
                setTracking(updated);
              }
            }
          }
        }
      } catch {
        // Resilient fallback to official APK download card without error signs
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReferralLanding();
    return () => {
      active = false;
    };
  }, [cleanCode, trackReferralEvent]);

  const appVersion = info?.appVersion || settings?.appVersion || 'v2.4.1';
  const rawApkUrl = info?.apkDownloadUrl || settings?.apkDownloadUrl;
  const baseTrackedApkUrl = buildTrackedApkDownloadUrl(
    rawApkUrl,
    appVersion,
    cleanCode,
    info?.publicAppUrl
  );
  const directApkHref = (() => {
    try {
      const parsed = new URL(baseTrackedApkUrl);
      parsed.searchParams.set('tracked', '1');
      return parsed.toString();
    } catch {
      return resolveAbsoluteApkUrl(rawApkUrl, appVersion, info?.publicAppUrl);
    }
  })();

  const firstTaskBonusPercent = info?.firstTaskBonusPercent ?? settings?.firstTaskBonusPercent ?? 20;
  const commissionPercent = info?.commissionPercent ?? settings?.referralCommissionPercent ?? 10;
  const isValidInvite = info?.valid ?? true;
  const referrerName = info?.referrerName || 'Verified Member';
  const apkFileName = `CryptoEarnGo-${appVersion.replace(/[^a-zA-Z0-9._-]/g, '') || 'v2.4.1'}.apk`;
  const shareUrl = buildReferralUrl(cleanCode, info?.publicAppUrl);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopiedCode(true);
      addToast(`Invite code "${cleanCode}" copied!`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      addToast('Copy your invite code manually: ' + cleanCode, 'info');
    }
  };

  const handleApkDownloadClick = async () => {
    setDownloadStarted(true);
    if (isValidInvite) {
      const updated = await trackReferralEvent(cleanCode, 'apk_download', 'landing_cta');
      if (updated) {
        setTracking(updated);
      }
    }
    addToast('Starting signed Crypto Earn Go APK download...', 'success');
  };

  return (
    <div className="min-h-[100dvh] bg-[#0B0E11] text-[#EAECEF] flex flex-col">
      {/* 1. CLEAN 3-ZONE NAVIGATION BAR */}
      <header className="sticky top-0 z-30 border-b border-[#2B3139] bg-[#0B0E11]/95 backdrop-blur pt-safe">
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <a
            href="#overview"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F0B90B] flex items-center justify-center text-[#0B0E11] font-black text-sm tracking-tight">
              CE
            </div>
            <span className="text-base font-black tracking-tight text-white">Crypto Earn Go</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#848E9C]">
            <a href="#overview" className="hover:text-white transition-colors whitespace-nowrap">
              Overview
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors whitespace-nowrap">
              How It Works
            </a>
            <a href="#referral-proof" className="hover:text-white transition-colors whitespace-nowrap">
              Referral Proof
            </a>
          </nav>

          <button
            type="button"
            onClick={() => closeReferralLanding(false)}
            className="px-4 py-2 rounded-lg border border-[#2B3139] bg-[#181A20] hover:border-[#F0B90B]/60 hover:text-white text-xs sm:text-sm font-semibold text-[#EAECEF] transition-colors whitespace-nowrap shrink-0"
          >
            Open Web App
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. HERO SECTION: DIRECT APK DOWNLOAD + INVITE ATTRIBUTION */}
        <section id="overview" className="border-b border-[#2B3139]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left 7 columns: Primary Message & Dominant APK Download CTA */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm font-medium text-[#848E9C]">
                  {isValidInvite ? (
                    <>
                      <span>Invited by</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-white">
                        <span>{referrerName}</span>
                        {info?.referrerVerified && <VerifiedBadge size="sm" variant="colorful" />}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[#F0B90B]">Code {cleanCode}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#0ECB81] font-semibold">$1.00 USDT Welcome Bonus</span>
                    </>
                  ) : (
                    <>
                      <span>Official Android Release</span>
                      <span aria-hidden="true">·</span>
                      <span>Version {appVersion}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#0ECB81] font-semibold">$1.00 USDT Welcome Bonus</span>
                    </>
                  )}
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.08] text-balance">
                  Download Crypto Earn Go APK &amp; Claim Your Invite Bonus
                </h1>

                <p className="text-base sm:text-lg text-[#848E9C] leading-relaxed max-w-2xl">
                  Install the official Android app directly to access daily reward tasks, USDT earning nodes, and instant BEP-20 payouts. Your invite code is pre-bound when you register.
                </p>

                {/* Primary Hero Action: Direct APK Download */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                  <a
                    href={directApkHref}
                    download={apkFileName}
                    onClick={handleApkDownloadClick}
                    className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[#F0B90B] hover:bg-[#FCD535] text-[#0B0E11] font-black text-base transition-colors shadow-lg shadow-[#F0B90B]/15"
                  >
                    <Download className="w-5 h-5 shrink-0" />
                    <span>Download Android APK</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => closeReferralLanding(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-[#2B3139] bg-[#181A20] hover:border-[#F0B90B]/60 text-white font-bold text-sm transition-colors"
                  >
                    <span>Create Account in Web App</span>
                    <ArrowRight className="w-4 h-4 text-[#F0B90B]" />
                  </button>
                </div>

                {/* Unboxed File Specification Row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#848E9C]">
                  <span className="inline-flex items-center gap-1.5 text-[#EAECEF]">
                    <ShieldCheck className="w-4 h-4 text-[#0ECB81]" />
                    Signed Release {appVersion}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Android 8.0+</span>
                  <span aria-hidden="true">·</span>
                  <span>Direct Installer (.apk)</span>
                  {downloadStarted && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#0ECB81] font-semibold">Download started</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right 5 columns: Clean Invite Attribution Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-[#2B3139] bg-[#181A20] p-6 space-y-5">
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#2B3139]">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          info?.referrerAvatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanCode)}`
                        }
                        alt={referrerName}
                        className="w-11 h-11 rounded-full border border-[#2B3139] bg-[#0B0E11] shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] uppercase tracking-wider text-[#848E9C] font-semibold block">
                          Referral Partner
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-bold text-white truncate">
                            {isValidInvite ? referrerName : 'Crypto Earn Go Official'}
                          </span>
                          {info?.referrerVerified && <VerifiedBadge size="sm" variant="colorful" />}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] uppercase tracking-wider text-[#848E9C] font-semibold block">
                        Welcome Gift
                      </span>
                      <span className="text-base font-black text-[#0ECB81] tabular-nums">+$1.00 USDT</span>
                    </div>
                  </div>

                  {/* Personal Invite Code Copy Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#848E9C] font-medium">Bound Referral Code</span>
                      <span className="text-[#0ECB81] font-semibold">Auto-applied at sign-up</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#2B3139] bg-[#0B0E11] font-mono text-base font-black text-[#F0B90B] tracking-widest">
                        {cleanCode}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-3.5 py-2.5 rounded-lg border border-[#2B3139] bg-[#0B0E11] hover:border-[#F0B90B]/60 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        {copiedCode ? (
                          <Check className="w-4 h-4 text-[#0ECB81]" />
                        ) : (
                          <Copy className="w-4 h-4 text-[#848E9C]" />
                        )}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Rewards Breakdown */}
                  <div className="divide-y divide-[#2B3139] border-t border-[#2B3139] pt-1 text-sm">
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-[#848E9C]">Sign-Up Bonus</span>
                      <span className="font-bold text-white tabular-nums">$1.00 USDT</span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-[#848E9C]">1st Task Referral Reward</span>
                      <span className="font-bold text-[#0ECB81] tabular-nums">
                        +{firstTaskBonusPercent}% Partner Bonus
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-[#848E9C]">Lifetime Task &amp; Order Rate</span>
                      <span className="font-bold text-[#F0B90B] tabular-nums">{commissionPercent}%</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#848E9C] leading-relaxed pt-1 border-t border-[#2B3139]">
                    Direct Share URL:{' '}
                    <span className="font-mono text-[#EAECEF] break-all">{shareUrl}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. REAL-TIME REFERRAL TRACKING PROOF STRIP */}
        <section id="referral-proof" className="border-b border-[#2B3139] bg-[#181A20]/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#F0B90B]">
                  Live Attribution Ledger
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Verified Referral Funnel Metrics
                </h2>
              </div>
              <span className="text-xs text-[#848E9C] tabular-nums">
                Conversion Rate:{' '}
                <strong className="text-white">{tracking?.conversionRate ?? 0}%</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[#2B3139] bg-[#0B0E11] p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#848E9C]">
                  <span>Link Clicks</span>
                  <MousePointerClick className="w-4 h-4 text-[#F0B90B]" />
                </div>
                <div className="text-2xl font-black text-white tabular-nums">
                  {loading ? '—' : (tracking?.linkClicks ?? 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-[#848E9C]">Tracked invite visits</p>
              </div>

              <div className="rounded-xl border border-[#2B3139] bg-[#0B0E11] p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#848E9C]">
                  <span>APK Downloads</span>
                  <Download className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black text-white tabular-nums">
                  {loading ? '—' : (tracking?.apkDownloads ?? 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-[#848E9C]">Android package pulls</p>
              </div>

              <div className="rounded-xl border border-[#2B3139] bg-[#0B0E11] p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#848E9C]">
                  <span>Registered Users</span>
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white tabular-nums">
                  {loading ? '—' : (tracking?.totalSignups ?? 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-[#848E9C]">Bound to code {cleanCode}</p>
              </div>

              <div className="rounded-xl border border-[#2B3139] bg-[#0B0E11] p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#848E9C]">
                  <span>Successful Referrals</span>
                  <CheckCircle2 className="w-4 h-4 text-[#0ECB81]" />
                </div>
                <div className="text-2xl font-black text-[#0ECB81] tabular-nums">
                  {loading ? '—' : (tracking?.successfulReferrals ?? 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-[#848E9C]">Qualified via task or order</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS (3 STEPS) */}
        <section id="how-it-works">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="max-w-xl mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-[#F0B90B]">
                3-Step Onboarding
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1.5">
                From Download to Verified Earning
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-[#2B3139] bg-[#181A20] p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#F0B90B]">01.</span>
                  <Smartphone className="w-5 h-5 text-[#848E9C]" />
                </div>
                <h3 className="text-base font-bold text-white">Download &amp; Install APK</h3>
                <p className="text-sm text-[#848E9C] leading-relaxed">
                  Download the signed Android installer directly from this page and open Crypto Earn Go on your phone.
                </p>
              </div>

              <div className="rounded-2xl border border-[#2B3139] bg-[#181A20] p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#F0B90B]">02.</span>
                  <UserPlus className="w-5 h-5 text-[#848E9C]" />
                </div>
                <h3 className="text-base font-bold text-white">Register with Code {cleanCode}</h3>
                <p className="text-sm text-[#848E9C] leading-relaxed">
                  Create your account using invite code <strong className="text-white">{cleanCode}</strong> to receive an instant $1.00 USDT welcome bonus.
                </p>
              </div>

              <div className="rounded-2xl border border-[#2B3139] bg-[#181A20] p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#0ECB81]">03.</span>
                  <Sparkles className="w-5 h-5 text-[#0ECB81]" />
                </div>
                <h3 className="text-base font-bold text-white">Complete First Task</h3>
                <p className="text-sm text-[#848E9C] leading-relaxed">
                  Complete your first reward claim or verified order to unlock successful referral status and trigger bonus rewards.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 5. MINIMAL FOOTER */}
      <footer className="border-t border-[#2B3139] bg-[#0B0E11] pb-safe">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#848E9C]">
          <span>Crypto Earn Go · Official Android Distribution &amp; Referral Portal</span>
          <div className="flex items-center gap-4">
            <a
              href={directApkHref}
              download={apkFileName}
              onClick={handleApkDownloadClick}
              className="hover:text-white transition-colors"
            >
              Direct APK ({appVersion})
            </a>
            <button
              type="button"
              onClick={() => closeReferralLanding(false)}
              className="hover:text-white transition-colors"
            >
              Launch Web App
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
