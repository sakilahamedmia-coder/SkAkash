import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../utils/apiTransport';
import { PublicUserProfile } from '../../types';
import { VerifiedBadge } from '../VerifiedBadge';
import { VolumeVBadge } from '../VolumeVBadge';
import { PaymentBadgeChip, VerifiedContactChips } from '../PaymentMethodLogos';
import { CountryFlag, getCountryByCode } from '../CountrySelector';
import {
  Zap,
  Play,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Activity,
  Search,
  Award,
  Layers,
  ListChecks,
  Wallet,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const MobileHome: React.FC = () => {
  const {
    banners,
    videoBanners,
    settings,
    publicFeed
  } = useApp();

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [activeTickerIdx, setActiveTickerIdx] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  // Strict User ID Search States
  const [searchUserId, setSearchUserId] = useState('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedProfile, setSearchedProfile] = useState<PublicUserProfile | null>(null);

  const handleUserIdSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = searchUserId.trim();
    if (!cleaned) {
      setSearchError('Please enter a User ID (e.g. CEG-882941).');
      return;
    }
    if (cleaned.includes('@')) {
      setSearchError('Search is strictly by User ID only (email addresses are not allowed).');
      return;
    }

    setIsSearchingUser(true);
    setSearchError(null);
    try {
      const res = await apiFetch(`/api/users/search?userId=${encodeURIComponent(cleaned)}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data?.error || 'No profile found for this User ID.');
        setSearchedProfile(null);
      } else if (data?.profile) {
        setSearchedProfile(data.profile);
      }
    } catch {
      setSearchError('Could not connect to server. Please try again.');
    } finally {
      setIsSearchingUser(false);
    }
  };

  // Auto slide banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Continuous live highlight rotation across real approved deposits & withdrawals
  useEffect(() => {
    if (!publicFeed || publicFeed.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTickerIdx(prev => (prev + 1) % publicFeed.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [publicFeed]);

  const currentHighlight =
    publicFeed && publicFeed.length > 0
      ? publicFeed[activeTickerIdx % publicFeed.length]
      : null;

  // Duplicate list for seamless continuous vertical scroll loop when items exist
  const loopingFeed =
    publicFeed && publicFeed.length > 0
      ? [...publicFeed, ...publicFeed]
      : [];

  return (
    <div className="pb-24 space-y-4 px-3 pt-3">
      {/* 1. ANNOUNCEMENT TICKER (Updated live from admin) */}
      {settings?.announcement && (
        <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center space-x-2 text-xs text-amber-300">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          <div className="overflow-hidden whitespace-nowrap text-ellipsis flex-1 text-[11px] font-medium">
            {settings.announcement}
          </div>
        </div>
      )}

      {/* 1B. STRICT USER ID SEARCH BAR & BUTTON */}
      <div className="rounded-2xl bg-slate-900/95 border border-slate-800 p-3 shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-200 flex items-center space-x-1.5">
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>User ID Search</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">Example: CEG-882941</span>
        </div>

        <form onSubmit={handleUserIdSearch} className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={searchUserId}
              onChange={(e) => {
                setSearchUserId(e.target.value);
                if (searchError) setSearchError(null);
              }}
              placeholder="Enter User ID only..."
              aria-label="Search by User ID"
              className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-9 py-2 text-xs font-mono text-white placeholder:font-sans placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchUserId && (
              <button
                type="button"
                onClick={() => {
                  setSearchUserId('');
                  setSearchError(null);
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearchingUser}
            className="min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-1.5 shrink-0 shadow-md shadow-amber-500/15 disabled:opacity-60 transition-all"
          >
            {isSearchingUser ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Search</span>
          </button>
        </form>

        {searchError && (
          <div className="flex items-center space-x-1.5 text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-xl px-2.5 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* 2. PROMOTIONAL IMAGE BANNERS CAROUSEL (Admin dynamic) */}
      {banners.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-800 bg-slate-900 group">
          <div className="relative h-44 sm:h-48 w-full overflow-hidden">
            <img
              src={banners[activeBannerIdx]?.imageUrl}
              alt={banners[activeBannerIdx]?.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex flex-col justify-end p-4">
              {banners[activeBannerIdx]?.badge && (
                <span className="self-start text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase tracking-wider mb-1.5 shadow-md">
                  {banners[activeBannerIdx]?.badge}
                </span>
              )}
              <h3 className="text-white font-black text-base sm:text-lg leading-tight drop-shadow">
                {banners[activeBannerIdx]?.title}
              </h3>
              {banners[activeBannerIdx]?.subtitle && (
                <p className="text-slate-300 text-xs mt-1 drop-shadow line-clamp-1">
                  {banners[activeBannerIdx]?.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="absolute bottom-2 right-4 flex space-x-1.5 z-10">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBannerIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeBannerIdx === i ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. PROMOTIONAL VIDEO BANNERS (Admin configurable without APK update) */}
      {videoBanners.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-1.5">
              <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Video Guides & Explanations
              </h2>
            </div>
            <span className="text-[10px] text-slate-400">Streamed from Cloud</span>
          </div>

          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none snap-x">
            {videoBanners.map((video) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="shrink-0 w-64 snap-start rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group shadow-lg"
              >
                <div className="relative h-32 w-full bg-slate-950">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 flex items-center justify-center transition-colors">
                    <div className="w-10 h-10 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                    </div>
                  </div>
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 text-[10px] bg-slate-950/80 text-white px-1.5 py-0.5 rounded font-mono">
                      {video.duration}
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                    {video.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {video.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CONTINUOUS LIVE SUCCESSFUL DEPOSITS & WITHDRAWALS FEED (Bottom of Home Screen) */}
      <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/90 shadow-xl overflow-hidden">
        {/* Section Header */}
        <div className="px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-xs font-extrabold text-white tracking-tight flex items-center space-x-1.5">
              <span>Live Deposits & Withdrawals</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                Live Success
              </span>
            </h2>
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-slate-400">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>BEP-20 Verified</span>
          </div>
        </div>

        {/* Live Spotlight Ticker Pill */}
        {currentHighlight && (
          <div className="px-3 py-2 bg-emerald-950/25 border-b border-emerald-500/15 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-200 font-semibold truncate">
                {currentHighlight.userName} ({currentHighlight.userIdMasked})
              </span>
              {currentHighlight.hasVolumeVBadge && <VolumeVBadge size="xs" />}
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                  currentHighlight.type === 'deposit'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {currentHighlight.type === 'deposit' ? 'Deposit Success' : 'Withdrawal Success'}
              </span>
            </div>
            <span className="font-black text-emerald-400 shrink-0 ml-2">
              ${currentHighlight.amount.toFixed(2)} USDT
            </span>
          </div>
        )}

        {/* Continuous Vertical Auto-Scrolling Stream */}
        {loopingFeed.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No approved deposit or withdrawal records found yet.
          </div>
        ) : (
          <div className="relative h-52 overflow-hidden bg-slate-950/40">
            <div className="animate-marquee-y divide-y divide-slate-800/50">
              {loopingFeed.map((item, idx) => {
                const isDeposit = item.type === 'deposit';
                const formattedTime = new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const formattedDate = new Date(item.timestamp).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className="px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          isDeposit
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                        }`}
                      >
                        {isDeposit ? (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            {item.userName}
                          </span>
                          {item.isVerified && <VerifiedBadge variant="colorful" size="sm" />}
                          {item.hasVolumeVBadge && <VolumeVBadge size="xs" />}
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                            {item.userIdMasked}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span
                            className={`font-semibold ${
                              isDeposit ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {isDeposit ? 'Deposit' : 'Withdrawal'}
                          </span>
                          <span>•</span>
                          <span>{item.network}</span>
                          <span>•</span>
                          <span>{formattedDate}, {formattedTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className="text-xs font-black text-white">
                        ${item.amount.toFixed(2)} <span className="text-[9px] text-slate-400 font-semibold">USDT</span>
                      </div>
                      <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded-full border border-emerald-500/30 mt-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Success</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtle Top & Bottom Fade Gradients */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-slate-950/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-slate-950/90 to-transparent" />
          </div>
        )}
      </div>

      {/* VIDEO MODAL PLAYER */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 p-safe">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white truncate max-w-[200px]">
                {selectedVideo.title}
              </span>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-video bg-black">
              <video
                src={selectedVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-3 text-xs text-slate-300">
              <p>{selectedVideo.description}</p>
            </div>
          </div>
        </div>
      )}
      {/* PUBLIC USER PROFILE VIEW MODAL (Strict User ID Search Result) */}
      {searchedProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center pt-safe px-safe sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[88vh] flex flex-col shadow-2xl overflow-hidden pb-safe sm:pb-0">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white">User Profile View</h3>
              </div>
              <button
                type="button"
                onClick={() => setSearchedProfile(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                aria-label="Close Profile View"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Identity Header (Only ONE Verified Badge beside Name) */}
              <div className="flex items-center space-x-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                <img
                  src={searchedProfile.avatar}
                  alt={searchedProfile.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <h4 className="text-base font-extrabold text-white truncate max-w-[165px]">
                      {searchedProfile.name}
                    </h4>
                    {searchedProfile.isVerified && (
                      <VerifiedBadge variant="colorful" size="md" />
                    )}
                    {searchedProfile.isVerified && searchedProfile.country && (
                      <span title={getCountryByCode(searchedProfile.country)?.name || searchedProfile.country}>
                        <CountryFlag code={searchedProfile.country} className="w-6 h-4" />
                      </span>
                    )}
                    {searchedProfile.hasVolumeVBadge && (
                      <VolumeVBadge size="md" />
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                    <span className="text-[11px] font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {searchedProfile.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        searchedProfile.status === 'active'
                          ? 'text-emerald-400'
                          : searchedProfile.status === 'suspended'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      · {searchedProfile.status}
                    </span>
                    {searchedProfile.isVerified && searchedProfile.country && (
                      <span className="text-[11px] font-semibold text-slate-300">
                        · {getCountryByCode(searchedProfile.country)?.name || searchedProfile.country}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Level & Badge Summary */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1">
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase">
                    <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Level</span>
                  </div>
                  <div className="text-sm font-black text-white tabular-nums">
                    Level {searchedProfile.level}
                  </div>
                  <div className="text-[11px] font-bold text-sky-400">
                    {searchedProfile.levelTitle}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1">
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Badge</span>
                  </div>
                  <div className="text-xs font-extrabold text-amber-300 leading-snug pt-0.5 flex items-center space-x-1.5">
                    <span>{searchedProfile.badgeTitle}</span>
                    {searchedProfile.hasVolumeVBadge && <VolumeVBadge size="sm" />}
                  </div>
                  <div className="text-[10px] text-slate-400 tabular-nums">
                    {searchedProfile.hasVolumeVBadge
                      ? `Colorful V-Badge ($${searchedProfile.totalTransactionVolume.toFixed(0)}+ Volume)`
                      : `Total Volume: $${searchedProfile.totalTransactionVolume.toFixed(2)}`}
                  </div>
                </div>
              </div>

              {/* Colorful V-Badge Showcase Banner when Unlocked (>$2,000 Transaction Volume) */}
              {searchedProfile.hasVolumeVBadge && (
                <div className="rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-emerald-500/15 border border-amber-500/35 p-3 flex items-center space-x-3">
                  <VolumeVBadge size="lg" showTooltip={false} />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-amber-300">
                      $2,000+ Volume Colorful V-Badge
                    </div>
                    <div className="text-[11px] text-slate-300 tabular-nums">
                      Total Volume: ${searchedProfile.totalTransactionVolume.toFixed(2)} USDT
                    </div>
                  </div>
                </div>
              )}

              {/* Verified User Wallet Logos & Direct Contact (Shown ONLY if Verified) */}
              {searchedProfile.isVerified &&
                (searchedProfile.paymentBadges.length > 0 ||
                  searchedProfile.whatsappNumber ||
                  searchedProfile.telegramLink) && (
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2.5">
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-300">
                      <Wallet className="w-3.5 h-3.5 text-amber-400" />
                      <span>Payment Methods & Direct Contact</span>
                    </div>
                    {searchedProfile.paymentBadges.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {searchedProfile.paymentBadges.map((method) => (
                          <PaymentBadgeChip key={method} method={method} compact />
                        ))}
                      </div>
                    )}
                    {(searchedProfile.whatsappNumber || searchedProfile.telegramLink) && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[10px] font-bold text-slate-400">
                          Tap logo to message directly:
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <VerifiedContactChips
                            whatsappNumber={searchedProfile.whatsappNumber}
                            telegramLink={searchedProfile.telegramLink}
                            showMessageHint
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* Financial & Tasks Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-2.5 text-center">
                  <div className="text-[10px] font-bold text-emerald-300">Total Deposit</div>
                  <div className="text-sm font-black text-white tabular-nums mt-1">
                    ${searchedProfile.totalDeposited.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-emerald-400/80 font-mono">USDT</div>
                </div>

                <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-2.5 text-center">
                  <div className="text-[10px] font-bold text-amber-300">Total Withdrawn</div>
                  <div className="text-sm font-black text-white tabular-nums mt-1">
                    ${searchedProfile.totalWithdrawn.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-amber-400/80 font-mono">USDT</div>
                </div>

                <div className="rounded-xl bg-sky-500/10 border border-sky-500/25 p-2.5 text-center">
                  <div className="text-[10px] font-bold text-sky-300">Tasks Done</div>
                  <div className="text-sm font-black text-white tabular-nums mt-1">
                    {searchedProfile.completedTasksCount}
                  </div>
                  <div className="text-[9px] text-sky-400/80">Claims Completed</div>
                </div>
              </div>

              {/* Completed Tasks List */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                    <ListChecks className="w-4 h-4 text-emerald-400" />
                    <span>Completed Tasks</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 tabular-nums">
                    Total {searchedProfile.completedTasksCount}
                  </span>
                </div>

                {searchedProfile.recentCompletedTasks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    This user has not completed any tasks yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/70 max-h-48 overflow-y-auto">
                    {searchedProfile.recentCompletedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="px-3 py-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate">
                            {task.title}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(task.completedAt).toLocaleString()}
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg tabular-nums">
                          +${task.rewardAmount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

