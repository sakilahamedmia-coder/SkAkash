import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import QRCode from 'qrcode';
import {
  Users,
  Copy,
  Check,
  Share2,
  ShieldCheck,
  MessageCircle,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Link2,
  LogIn,
  ExternalLink,
  MousePointerClick,
  Download,
  BarChart3,
  Search,
  UserPlus,
  ChevronDown
} from 'lucide-react';
import { buildReferralUrl, normalizeReferralCodeInput } from '../../utils/publicUrl';

async function copyTextReliably(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export const MobileReferral: React.FC = () => {
  const {
    referralData,
    currentUser,
    settings,
    addToast,
    setIsAuthModalOpen,
    openReferralLanding,
    applyReferralCode,
    loadMoreReferrals
  } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);
  const [applyHint, setApplyHint] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(30);
  const [loadingMore, setLoadingMore] = useState(false);

  const refCode = currentUser?.referralCode || '';
  const refLink = buildReferralUrl(refCode);
  const commissionRate = settings?.referralCommissionPercent ?? 10;
  const firstTaskBonusRate = referralData?.firstTaskBonusPercent ?? settings?.firstTaskBonusPercent ?? 20;

  const history = referralData?.history || [];
  const totalRecords = referralData?.totalRecords ?? referralData?.referralCount ?? history.length ?? currentUser?.referralCount ?? 0;
  const tracking = referralData?.tracking;
  const qualifiedCount =
    tracking?.successfulReferrals ??
    history.filter((r: any) => Boolean(r.isQualified || r.firstTaskCompleted || (r.commissionEarned || 0) > 0)).length;
  const linkClicks = tracking?.linkClicks ?? 0;
  const apkDownloads = tracking?.apkDownloads ?? 0;
  const totalSignups = tracking?.totalSignups ?? totalRecords;
  const conversionRate =
    tracking?.conversionRate ??
    (linkClicks > 0
      ? Number(((qualifiedCount / linkClicks) * 100).toFixed(1))
      : totalSignups > 0
      ? Number(((qualifiedCount / totalSignups) * 100).toFixed(1))
      : 0);

  const normalizedSearch = historySearch.trim().toLowerCase();
  const filteredHistory = normalizedSearch
    ? history.filter(
        (r: any) =>
          String(r.referredUserName || '').toLowerCase().includes(normalizedSearch) ||
          String(r.referredUserId || '').toLowerCase().includes(normalizedSearch)
      )
    : history;
  const displayedHistory = filteredHistory.slice(0, visibleLimit);
  const canShowMoreLocal = visibleLimit < filteredHistory.length;
  const canFetchMoreServer = !normalizedSearch && Boolean(referralData?.hasMore);

  useEffect(() => {
    if (!refLink) {
      setQrCodeDataUrl('');
      return;
    }
    QRCode.toDataURL(refLink, {
      width: 180,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#f8fafc'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('QR code error:', err));
  }, [refLink]);

  const copyCode = async () => {
    if (!refCode) return;
    const ok = await copyTextReliably(refCode);
    setCopiedCode(true);
    addToast(
      ok ? `Referral code "${refCode}" copied!` : `Your code is ${refCode}`,
      ok ? 'success' : 'info'
    );
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = async () => {
    if (!refLink) return;
    const ok = await copyTextReliably(refLink);
    setCopiedLink(true);
    addToast(
      ok ? 'Unique invitation link copied to clipboard!' : 'Invitation link selected — tap Copy to share.',
      ok ? 'success' : 'info'
    );
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApplyFriendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyHint(null);
    const cleaned = normalizeReferralCodeInput(friendCodeInput);
    if (!cleaned || cleaned.length < 3) {
      setApplyHint('Enter a valid referral code or paste your friend’s invite link.');
      return;
    }
    setApplyingCode(true);
    try {
      const result = await applyReferralCode(cleaned);
      if (result.success) {
        setFriendCodeInput('');
        setApplyHint(null);
      } else if (result.error) {
        setApplyHint(result.error);
      }
    } finally {
      setApplyingCode(false);
    }
  };

  const handleShowMoreHistory = async () => {
    if (canShowMoreLocal) {
      setVisibleLimit((prev) => prev + 50);
      return;
    }
    if (canFetchMoreServer) {
      setLoadingMore(true);
      try {
        await loadMoreReferrals();
        setVisibleLimit((prev) => prev + 50);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  const shareNative = async () => {
    if (!refLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Crypto Earn Go',
          text: `Sign up with my unique invite link (${refCode}) for a $1.00 USDT welcome bonus & start completing tasks!`,
          url: refLink
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  if (!currentUser) {
    return (
      <div className="pb-24 px-3 pt-6">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Link2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-white">Unlock Your Unique Invitation Link</h3>
          <p className="text-xs text-slate-400">
            Sign in or create an account to generate your personal referral link and earn a{' '}
            <strong className="text-amber-400">{firstTaskBonusRate}% bonus</strong> when invited friends complete their first task.
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/20"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Register</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-4 px-3 pt-3">
      {/* 1. HERO BONUS BANNER */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/30 p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 tracking-wider">
              First-Task Bonus Program
            </span>
            <h2 className="text-lg font-black text-white mt-2 leading-tight">
              Earn {firstTaskBonusRate}% Bonus on Friend&apos;s 1st Task
            </h2>
            <p className="text-[11px] text-slate-300 mt-1">
              Plus <strong className="text-amber-400">{commissionRate}%</strong> lifetime commission on purchases &amp; verified deposits.
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 ml-3">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800">
          <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Signed Up</span>
            <span className="text-sm font-black text-white tabular-nums">
              {totalSignups.toLocaleString()} Users
            </span>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Successful</span>
            <span className="text-sm font-black text-emerald-400 tabular-nums">
              {qualifiedCount.toLocaleString()} Qualified
            </span>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Total Earned</span>
            <span className="text-sm font-black text-amber-400 tabular-nums">
              ${currentUser.referralEarnings ? currentUser.referralEarnings.toFixed(2) : '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* 1B. REAL-TIME CONVERSION TRACKING FUNNEL */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Referral Conversion Tracking</span>
          </h3>
          <span className="text-[10px] font-bold text-slate-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full tabular-nums">
            {conversionRate}% Conversion
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-center space-y-0.5">
            <MousePointerClick className="w-3.5 h-3.5 text-amber-400 mx-auto" />
            <span className="text-sm font-black text-white block tabular-nums">{linkClicks.toLocaleString()}</span>
            <span className="text-[9px] text-slate-400 block leading-tight">Link Clicks</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-center space-y-0.5">
            <Download className="w-3.5 h-3.5 text-sky-400 mx-auto" />
            <span className="text-sm font-black text-white block tabular-nums">{apkDownloads.toLocaleString()}</span>
            <span className="text-[9px] text-slate-400 block leading-tight">APK Pulls</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-center space-y-0.5">
            <Users className="w-3.5 h-3.5 text-purple-400 mx-auto" />
            <span className="text-sm font-black text-white block tabular-nums">{totalSignups.toLocaleString()}</span>
            <span className="text-[9px] text-slate-400 block leading-tight">Sign-Ups</span>
          </div>
          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-2 text-center space-y-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
            <span className="text-sm font-black text-emerald-400 block tabular-nums">{qualifiedCount.toLocaleString()}</span>
            <span className="text-[9px] text-emerald-300/80 block leading-tight">Successful</span>
          </div>
        </div>
      </div>

      {/* 2. UNIQUE INVITATION LINK & CODE CARD */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
            <Link2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Your Unique Invitation Link</span>
          </h3>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
            +{firstTaskBonusRate}% 1st Task Bonus
          </span>
        </div>

        {/* Link Box (Primary CTA) */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={refLink}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 select-all"
            />
            <button
              onClick={copyLink}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors flex items-center space-x-1.5 shadow-md shadow-amber-500/20 shrink-0"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Code Box */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            Personal Invite Code
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-black text-amber-400 tracking-wider">
              {refCode}
            </div>
            <button
              onClick={copyCode}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 border border-slate-700"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="pt-1 flex space-x-2">
          <button
            onClick={shareNative}
            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Share</span>
          </button>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Join me on Crypto Earn Go! Sign up with my unique invite link (${refCode}) to claim a $1.00 USDT welcome bonus and earn daily task rewards: ${refLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(`Join me on Crypto Earn Go! Use my invite link (${refCode}) to get $1.00 USDT and start completing tasks.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 rounded-xl bg-sky-600/30 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram</span>
          </a>
        </div>

        {/* Preview Referral APK Landing Page */}
        <button
          type="button"
          onClick={() => openReferralLanding(refCode)}
          className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Preview Referral APK Landing Page</span>
        </button>
      </div>

      {/* 3. HOW IT WORKS (3 STEPS) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5 shadow-lg">
        <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>How Referral Bonuses Work</span>
        </h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 space-y-1">
            <span className="inline-flex w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black items-center justify-center">
              1
            </span>
            <p className="text-[10px] font-semibold text-slate-200 leading-tight">
              Copy &amp; Share Link
            </p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 space-y-1">
            <span className="inline-flex w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-black items-center justify-center">
              2
            </span>
            <p className="text-[10px] font-semibold text-slate-200 leading-tight">
              Friend Signs Up
            </p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 space-y-1">
            <span className="inline-flex w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black items-center justify-center">
              3
            </span>
            <p className="text-[10px] font-semibold text-emerald-300 leading-tight">
              +{firstTaskBonusRate}% on 1st Task
            </p>
          </div>
        </div>
      </div>

      {/* 4. DYNAMIC QR CODE CARD */}
      {qrCodeDataUrl && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col items-center text-center space-y-2.5 shadow-lg">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Scan to Invite Friends
          </h4>
          <div className="p-3 bg-white rounded-2xl shadow-inner">
            <img src={qrCodeDataUrl} alt="Referral QR Code" className="w-36 h-36" />
          </div>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Show this QR code to open your unique invitation link directly on your friend&apos;s device.
          </p>
        </div>
      )}

      {/* 4B. APPLY A FRIEND'S REFERRAL CODE (FOR USERS WITHOUT A REFERRER YET) */}
      {!currentUser.referredBy ? (
        <form
          onSubmit={handleApplyFriendCode}
          className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2.5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Have a Friend&apos;s Referral Code?</span>
            </h4>
            <span className="text-[10px] text-slate-400">Optional</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={friendCodeInput}
              onChange={(e) => {
                setApplyHint(null);
                const v = e.target.value;
                if (v.includes('?') || v.includes('/') || v.startsWith('http')) {
                  setFriendCodeInput(normalizeReferralCodeInput(v));
                } else {
                  setFriendCodeInput(v.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24));
                }
              }}
              placeholder="Enter code or paste link"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 uppercase placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={applyingCode || friendCodeInput.trim().length < 3}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black transition-colors shrink-0"
            >
              {applyingCode ? 'Linking...' : 'Apply'}
            </button>
          </div>
          {applyHint && (
            <p className="text-[11px] text-amber-300/90 leading-snug">{applyHint}</p>
          )}
        </form>
      ) : (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Referral Partner Linked</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400/90">{currentUser.referredBy}</span>
        </div>
      )}

      {/* 5. INVITED USERS HISTORY */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Referral Activity History
          </h3>
          <span className="text-[10px] text-slate-400 tabular-nums">
            {totalRecords.toLocaleString()} records
          </span>
        </div>

        {history.length > 6 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Filter referrals by name or User ID..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

        {displayedHistory.length > 0 ? (
          <div className="space-y-2">
            {displayedHistory.map((record: any) => {
              const isSuccessful = Boolean(
                record.isQualified || record.firstTaskCompleted || Number(record.commissionEarned || 0) > 0
              );
              return (
                <div
                  key={record.id || record.referredUserId}
                  className="rounded-xl bg-slate-900 border border-slate-800 p-3 flex items-center justify-between text-xs shadow-md"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-white truncate">{record.referredUserName}</span>
                      {isSuccessful ? (
                        <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Successful</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Pending 1st Task</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      User: {record.referredUserId} • {new Date(record.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-amber-400 tabular-nums">
                      +${Number(record.commissionEarned || 0).toFixed(2)} USDT
                    </span>
                    <span className="text-[9px] text-emerald-400 block font-semibold">
                      {record.firstTaskBonusEarned > 0
                        ? `Includes +$${Number(record.firstTaskBonusEarned).toFixed(2)} 1st-task bonus`
                        : record.qualificationSource === 'deposit'
                        ? 'Qualified via Deposit'
                        : record.qualificationSource === 'purchase'
                        ? 'Qualified via Order'
                        : record.commissionEarned > 0
                        ? 'Commission Paid'
                        : 'Awaiting 1st Task'}
                    </span>
                  </div>
                </div>
              );
            })}

            {(canShowMoreLocal || canFetchMoreServer) && (
              <button
                type="button"
                disabled={loadingMore}
                onClick={handleShowMoreHistory}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-amber-400 flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>
                  {loadingMore
                    ? 'Loading more referrals...'
                    : `Show More Referrals (${displayedHistory.length.toLocaleString()} of ${totalRecords.toLocaleString()})`}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-900/40 rounded-xl border border-slate-800 p-4 text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-400">
              {normalizedSearch ? 'No Matching Referrals Found' : 'No Referrals Yet'}
            </p>
            <p>
              {normalizedSearch
                ? 'Try searching a different name or User ID.'
                : `Copy your unique invitation link above to earn a ${firstTaskBonusRate}% bonus when friends complete their first task.`}
            </p>
          </div>
        )}
      </div>

      {/* 6. TRANSPARENCY & ANTI-FRAUD NOTICE */}
      <div className="flex items-start space-x-2.5 rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-300">Anti-Fraud Protection:</strong> Self-referrals and duplicate accounts are automatically blocked. The {firstTaskBonusRate}% first-task bonus is credited once per referred user upon completing their first verified task.
        </p>
      </div>
    </div>
  );
};

