import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { VerifiedBadge } from '../VerifiedBadge';
import { VolumeVBadge, VOLUME_VBADGE_THRESHOLD } from '../VolumeVBadge';
import {
  PAYMENT_METHOD_OPTIONS,
  WALLET_REGIONS,
  PaymentBadgeChip,
  PaymentMethodSvg,
  WhatsappOfficialSvg,
  TelegramOfficialSvg,
  VerifiedContactChips
} from '../PaymentMethodLogos';
import { PaymentMethodBadge, CompanyLicenseDocument } from '../../types';
import { CountrySelector, CountryFlag, getCountryByCode } from '../CountrySelector';
import {
  User as UserIcon,
  Moon,
  Sun,
  LogOut,
  ExternalLink,
  MessageCircle,
  Send,
  Package,
  Users,
  Copy,
  Check,
  ChevronRight,
  Edit3,
  Camera,
  Upload,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  History,
  Calendar,
  SlidersHorizontal,
  Wallet,
  Shield,
  Building2,
  FileCheck2,
  Globe,
  Mail,
  MapPin,
  ShieldCheck,
  ZoomIn
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'
];

export const MobileProfile: React.FC = () => {
  const {
    currentUser,
    setActiveMobileTab,
    logoutUser,
    settings,
    theme,
    setTheme,
    setIsAuthModalOpen,
    demoUsers,
    switchDemoUser,
    updateProfile,
    addToast,
    userDeposits,
    userWithdrawals,
    userTransactions,
    userOrders,
    refreshAllData,
    openProfileAdminPanel
  } = useApp();

  const [copiedId, setCopiedId] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // Financial Dashboard (Income & Expense Tracker) States
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'income' | 'expense' | 'deposit' | 'withdrawal'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'month'>('all');
  const [isRefreshingFinances, setIsRefreshingFinances] = useState(false);
  const [showFinancialDetails, setShowFinancialDetails] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCompanyInfoModal, setShowCompanyInfoModal] = useState(false);
  const [zoomedLicense, setZoomedLicense] = useState<CompanyLicenseDocument | null>(null);

  // Edit Profile States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');
  const [editCountry, setEditCountry] = useState(currentUser?.country || '');
  const [editPaymentBadges, setEditPaymentBadges] = useState<PaymentMethodBadge[]>(
    currentUser?.paymentBadges || []
  );
  const [editWhatsapp, setEditWhatsapp] = useState(currentUser?.whatsappNumber || '');
  const [editTelegram, setEditTelegram] = useState(currentUser?.telegramLink || '');
  const [inlineWhatsapp, setInlineWhatsapp] = useState(currentUser?.whatsappNumber || '');
  const [inlineTelegram, setInlineTelegram] = useState(currentUser?.telegramLink || '');
  const [showInlineBadgePicker, setShowInlineBadgePicker] = useState(false);
  const [isSavingCountry, setIsSavingCountry] = useState(false);
  const [isSavingPaymentBadges, setIsSavingPaymentBadges] = useState(false);
  const [isSavingContactLinks, setIsSavingContactLinks] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyUserId = () => {
    if (currentUser?.id) {
      navigator.clipboard.writeText(currentUser.id);
      setCopiedId(true);
      addToast('User ID copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleOpenEdit = () => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditAvatar(currentUser.avatar);
      setEditCountry(currentUser.country || '');
      setEditPaymentBadges(currentUser.paymentBadges || []);
      setEditWhatsapp(currentUser.whatsappNumber || '');
      setEditTelegram(currentUser.telegramLink || '');
      setShowEditModal(true);
    }
  };

  const handleSelectCountry = async (countryCode: string) => {
    if (!currentUser || !currentUser.isVerified) {
      addToast('Only verified accounts can select a country.', 'warning');
      return;
    }
    setIsSavingCountry(true);
    await updateProfile({ country: countryCode });
    setEditCountry(countryCode);
    setIsSavingCountry(false);
  };

  const handleSaveInlineContactLinks = async () => {
    if (!currentUser || !currentUser.isVerified) {
      addToast('Only verified accounts can link WhatsApp and Telegram.', 'warning');
      return;
    }
    setIsSavingContactLinks(true);
    await updateProfile({
      whatsappNumber: inlineWhatsapp.trim(),
      telegramLink: inlineTelegram.trim()
    });
    setIsSavingContactLinks(false);
  };

  const handleToggleInlinePaymentBadge = async (method: PaymentMethodBadge) => {
    if (!currentUser || !currentUser.isVerified) {
      addToast('Your account must be verified to display payment method logos.', 'warning');
      return;
    }
    const currentList = currentUser.paymentBadges || [];
    const nextList = currentList.includes(method)
      ? currentList.filter((m) => m !== method)
      : [...currentList, method];

    setIsSavingPaymentBadges(true);
    await updateProfile({ paymentBadges: nextList });
    setIsSavingPaymentBadges(false);
  };

  const handleToggleModalPaymentBadge = (method: PaymentMethodBadge) => {
    setEditPaymentBadges((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEditAvatar(result);
        addToast('Photo uploaded successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      addToast('Please provide your name', 'error');
      return;
    }

    setIsSavingProfile(true);
    const success = await updateProfile({
      name: editName.trim(),
      avatar: editAvatar.trim() || currentUser?.avatar || PRESET_AVATARS[0],
      ...(currentUser?.isVerified
        ? {
            country: editCountry,
            paymentBadges: editPaymentBadges,
            whatsappNumber: editWhatsapp.trim(),
            telegramLink: editTelegram.trim()
          }
        : {})
    });
    setIsSavingProfile(false);

    if (success) {
      setShowEditModal(false);
    }
  };

  // ==========================================
  // FINANCIAL LEDGER (Money In & Out Tracker)
  // ==========================================
  // 1. Calculate Inflow (Income)
  const approvedDepositsTotal = (userDeposits || [])
    .filter(d => d.status === 'approved')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const referralEarningsTotal = currentUser?.referralEarnings || 0;
  const taskRewardsTotal = (userTransactions || [])
    .filter(t => (t.type === 'reward_claim' || t.type === 'daily_checkin') && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  // Total Money In
  const totalMoneyIn = approvedDepositsTotal + referralEarningsTotal + taskRewardsTotal;

  // 2. Calculate Outflow (Expenses)
  const approvedWithdrawalsTotal = (userWithdrawals || [])
    .filter(w => w.status === 'approved')
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  const purchasesTotal = (userOrders || [])
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.productPrice || 0), 0);

  // Total Money Out
  const totalMoneyOut = approvedWithdrawalsTotal + purchasesTotal;

  // Net Cash Flow
  const netFlow = totalMoneyIn - totalMoneyOut;

  // $2,000+ Transaction Volume V-Badge Milestone (authoritative from server or computed floor)
  const completedTxVolume = (userTransactions || [])
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  const currentTxVolume = Number(
    Math.max(
      currentUser?.totalTransactionVolume || 0,
      completedTxVolume,
      (currentUser?.totalDeposited || 0) + (currentUser?.totalWithdrawn || 0)
    ).toFixed(2)
  );
  const hasVolumeVBadge = Boolean(currentUser?.hasVolumeVBadge) || currentTxVolume > VOLUME_VBADGE_THRESHOLD;
  const vBadgeProgressPct = Math.min(100, (currentTxVolume / VOLUME_VBADGE_THRESHOLD) * 100);
  const vBadgeRemaining = Math.max(0, Number((VOLUME_VBADGE_THRESHOLD - currentTxVolume).toFixed(2)));

  // Filtered Ledger History
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredTransactions = (userTransactions || []).filter(tx => {
    const txTime = new Date(tx.createdAt).getTime();

    // Time filter
    if (timeFilter === 'today' && txTime < startOfToday) return false;
    if (timeFilter === 'month' && txTime < startOfMonth) return false;

    // Type filter (All, Income, Expense, Deposit, Withdrawal)
    const isIncome = tx.amount > 0 || tx.type === 'deposit' || tx.type === 'referral_commission' || tx.type === 'reward_claim';
    if (ledgerFilter === 'income' && !isIncome) return false;
    if (ledgerFilter === 'expense' && isIncome) return false;
    if (ledgerFilter === 'deposit' && tx.type !== 'deposit') return false;
    if (ledgerFilter === 'withdrawal' && tx.type !== 'withdrawal') return false;

    return true;
  });

  const handleRefreshFinances = async () => {
    setIsRefreshingFinances(true);
    await refreshAllData();
    setTimeout(() => {
      setIsRefreshingFinances(false);
      addToast('Financial data synced successfully!', 'success');
    }, 400);
  };

  return (
    <div className="pb-24 space-y-4 px-3 pt-3">
      {/* 1. USER PROFILE IDENTITY CARD */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-4 shadow-xl space-y-4">
        {currentUser ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3.5">
              {/* Avatar Column with Colorful Verified Badge Icon (no text) */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative group cursor-pointer" onClick={handleOpenEdit}>
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 shadow-lg group-hover:opacity-85 transition-opacity"
                  />
                  {/* Online indicator */}
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                      currentUser.status === 'active'
                        ? 'bg-emerald-400'
                        : currentUser.status === 'suspended'
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                  />
                  {/* Camera quick edit hover overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {/* Name + Colorful Badge Icon + Country Flag + Small Pen Icon + Status */}
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <h2 className="text-base font-extrabold text-white truncate max-w-[140px]">
                    {currentUser.name}
                  </h2>
                  {currentUser.isVerified && <VerifiedBadge variant="colorful" size="md" />}
                  {currentUser.isVerified && currentUser.country && (
                    <CountryFlag code={currentUser.country} className="w-5 h-3.5" />
                  )}
                  {hasVolumeVBadge && <VolumeVBadge size="md" />}
                  <button
                    onClick={handleOpenEdit}
                    className="p-1 rounded-md text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 transition-colors shrink-0"
                    title="Edit Profile"
                    aria-label="Edit Profile"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      currentUser.status === 'active'
                        ? 'text-emerald-400'
                        : currentUser.status === 'suspended'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    · {currentUser.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {currentUser.email}
                </p>

                {/* Unique User ID & Verified Country Name */}
                <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mt-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">ID:</span>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {currentUser.id}
                    </span>
                    <button
                      onClick={copyUserId}
                      className="text-slate-400 hover:text-white p-1"
                      title="Copy ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {currentUser.isVerified && currentUser.country && (() => {
                    const selectedCountry = getCountryByCode(currentUser.country);
                    return (
                      <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-200">
                        <CountryFlag code={currentUser.country} className="w-5 h-3.5" />
                        <span>{selectedCountry?.name || currentUser.country}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Country Selector Dropdown (Exclusive to Verified Users) */}
            {currentUser.isVerified && (
              <div className="pt-1">
                <CountrySelector
                  value={currentUser.country}
                  onChange={handleSelectCountry}
                  disabled={isSavingCountry}
                  label="Country / Region"
                  compact
                />
              </div>
            )}

            {/* $2,000+ Transaction Milestone Colorful V-Badge Card */}
            <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3 flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                <VolumeVBadge size="lg" showTooltip={false} className={hasVolumeVBadge ? '' : 'opacity-45 grayscale-[35%]'} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold text-white truncate">
                    Colorful V-Badge ($2,000+ Volume)
                  </span>
                  <span className={`text-[10px] font-bold shrink-0 ${hasVolumeVBadge ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {hasVolumeVBadge ? 'Unlocked' : 'Auto-Locked'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-300"
                    style={{ width: `${vBadgeProgressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
                  <span>Total Volume: ${currentTxVolume.toFixed(2)}</span>
                  <span>
                    {hasVolumeVBadge
                      ? 'Auto-attached next to name'
                      : `$${vBadgeRemaining.toFixed(2)} remaining`}
                  </span>
                </div>
              </div>
            </div>

            {/* Verified Payment Method & Direct Contact Showcase (Exclusive to Verified Users) */}
            {currentUser.isVerified && (
              <div className="pt-2.5 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Payment Methods & Contact Links</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!showInlineBadgePicker) {
                        setInlineWhatsapp(currentUser.whatsappNumber || '');
                        setInlineTelegram(currentUser.telegramLink || '');
                      }
                      setShowInlineBadgePicker((v) => !v);
                    }}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-bold flex items-center space-x-1 transition-colors"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>{showInlineBadgePicker ? 'Done' : 'Customize'}</span>
                  </button>
                </div>

                {/* Displayed Selected Wallet Logos + WhatsApp/Telegram Direct Message Logos */}
                {(currentUser.paymentBadges || []).length > 0 ||
                currentUser.whatsappNumber ||
                currentUser.telegramLink ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(currentUser.paymentBadges || []).map((method) => (
                      <PaymentBadgeChip key={method} method={method} compact />
                    ))}
                    <VerifiedContactChips
                      whatsappNumber={currentUser.whatsappNumber}
                      telegramLink={currentUser.telegramLink}
                      compact
                      showMessageHint={false}
                    />
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    Tap &ldquo;Customize&rdquo; to display bKash, Nagad, Crypto logos and WhatsApp / Telegram direct message links.
                  </p>
                )}

                {/* 1-Tap Region-Grouped Inline Toggle Picker + WhatsApp/Telegram Inputs */}
                {showInlineBadgePicker && (
                  <div className="space-y-3 pt-1.5">
                    {WALLET_REGIONS.map((region) => {
                      const items = PAYMENT_METHOD_OPTIONS.filter((o) => o.region === region.key);
                      if (items.length === 0) return null;
                      return (
                        <div key={region.key} className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 px-0.5">
                            {region.label}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {items.map((opt) => {
                              const active = (currentUser.paymentBadges || []).includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  disabled={isSavingPaymentBadges}
                                  onClick={() => handleToggleInlinePaymentBadge(opt.id)}
                                  className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                                    active
                                      ? `${opt.accentBg} ${opt.accentBorder}`
                                      : 'bg-slate-950 border-slate-800 opacity-80 hover:opacity-100'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <PaymentMethodSvg method={opt.id} className="w-5 h-5 shrink-0" />
                                    <span className={`text-[11px] font-bold truncate ${active ? opt.accentText : 'text-slate-300'}`}>
                                      {opt.name}
                                    </span>
                                  </div>
                                  {active && <Check className={`w-3.5 h-3.5 shrink-0 ${opt.accentText}`} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Verified WhatsApp & Telegram Direct Contact Setup */}
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2.5">
                      <div className="text-[11px] font-extrabold text-white">
                        WhatsApp & Telegram Links (Direct Messaging)
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        Once linked, any user can tap the WhatsApp or Telegram logo on your profile to message you directly.
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <WhatsappOfficialSvg className="w-6 h-6 shrink-0" />
                          <input
                            type="text"
                            value={inlineWhatsapp}
                            onChange={(e) => setInlineWhatsapp(e.target.value)}
                            placeholder="WhatsApp number (e.g. +88017XXXXXXXX)"
                            className="flex-1 min-h-[40px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <TelegramOfficialSvg className="w-6 h-6 shrink-0" />
                          <input
                            type="text"
                            value={inlineTelegram}
                            onChange={(e) => setInlineTelegram(e.target.value)}
                            placeholder="Telegram (@username or https://t.me/...)"
                            className="flex-1 min-h-[40px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isSavingContactLinks}
                        onClick={handleSaveInlineContactLinks}
                        className="w-full min-h-[42px] rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold transition-colors disabled:opacity-50"
                      >
                        {isSavingContactLinks ? 'Saving...' : 'Save WhatsApp & Telegram Links'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 space-y-2">
            <UserIcon className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">Not Signed In</h3>
            <p className="text-xs text-slate-400">
              Sign in with Google or your account credentials to view your profile and balances.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="mt-2 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {/* FINANCIAL SUMMARY METRICS */}
        {currentUser && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
            <div className="bg-slate-950/80 rounded-xl p-2 text-center border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Available</span>
              <span className="text-xs font-black text-amber-400">
                ${currentUser.balance.toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-2 text-center border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Earned</span>
              <span className="text-xs font-black text-emerald-400">
                ${currentUser.totalEarned.toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-2 text-center border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Referrals</span>
              <span className="text-xs font-black text-purple-400">
                {currentUser.referralCount || 0}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. COMPACT FINANCIAL SUMMARY & TRANSACTION HISTORY BUTTON */}
      {/* ======================================================== */}
      {currentUser && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-3.5 shadow-xl space-y-3">
          {/* Minimal 2-column In/Out pill */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Total In */}
            <div
              onClick={() => {
                setLedgerFilter('income');
                setShowHistoryModal(true);
              }}
              className="p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/25 flex items-center justify-between cursor-pointer hover:bg-emerald-950/40 hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Total In</span>
                  <span className="text-xs font-black text-emerald-400">
                    +${totalMoneyIn.toFixed(2)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400/50 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Total Out */}
            <div
              onClick={() => {
                setLedgerFilter('expense');
                setShowHistoryModal(true);
              }}
              className="p-2.5 rounded-xl bg-rose-950/25 border border-rose-500/25 flex items-center justify-between cursor-pointer hover:bg-rose-950/40 hover:border-rose-500/40 transition-all group"
            >
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Total Out</span>
                  <span className="text-xs font-black text-rose-400">
                    -${totalMoneyOut.toFixed(2)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-rose-400/50 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Clean 'Transaction History' Action Button */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-850 hover:from-amber-500/20 hover:to-amber-500/10 border border-slate-700/80 hover:border-amber-500/50 text-white flex items-center justify-between transition-all group shadow-sm"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <History className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                  Transaction History
                </div>
                <div className="text-[10px] text-slate-400">
                  View detailed list of deposits, withdrawals, and expenses
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-amber-400 text-[11px] font-bold">
              <span>Open</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* IN-APP ADMIN PANEL ACCESS (VISIBLE ONLY TO VERIFIED)     */}
      {/* ======================================================== */}
      {currentUser?.isVerified && (
        <button
          type="button"
          onClick={openProfileAdminPanel}
          className="w-full min-h-[58px] rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-emerald-500/15 hover:from-amber-500/30 hover:to-emerald-500/25 border border-amber-500/40 p-3.5 flex items-center justify-between text-left shadow-lg shadow-amber-500/10 transition-all group"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black text-white truncate">
                  Admin Panel
                </span>
                <VerifiedBadge variant="colorful" size="sm" />
              </div>
              <div className="text-[10px] text-amber-300 font-medium truncate">
                Verified Account — Manage directly inside the app
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* 2. ACCOUNT NAVIGATION SHORTCUTS */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden divide-y divide-slate-800/80 shadow-md">
        <button
          onClick={() => setActiveMobileTab('products')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">My Purchased Orders</div>
              <div className="text-[10px] text-slate-400">Manage cloud nodes & digital products</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => setActiveMobileTab('referrals')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Referral Network & Links</div>
              <div className="text-[10px] text-slate-400">Earn {settings?.referralCommissionPercent || 10}% commission per friend</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          type="button"
          onClick={() => setShowCompanyInfoModal(true)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-white truncate">Company License &amp; Info</span>
                {(settings?.companyInfo?.licenses?.length || 0) > 0 && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    {settings?.companyInfo?.licenses?.length} Docs
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Registration details, corporate credentials &amp; licenses
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
        </button>
      </div>

      {/* 3. APPLICATION & COMMUNITY SUPPORT */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden divide-y divide-slate-800/80 shadow-md">
        <a
          href={settings?.whatsappLink || 'https://wa.me/15557892345'}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Official WhatsApp Support</div>
              <div className="text-[10px] text-emerald-400">Connect with customer support agent</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-500" />
        </a>

        <a
          href={settings?.telegramLink || 'https://t.me/CryptoEarnGo_Official'}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Send className="w-4 h-4 -rotate-12" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Official Telegram Community</div>
              <div className="text-[10px] text-sky-400">Global discussion & announcement channel</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-500" />
        </a>
      </div>

      {/* 4. SETTINGS & ADMIN ACCOUNT SWITCHER */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>Interface Theme</span>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-3 py-1 bg-slate-800 text-xs font-bold rounded-lg text-slate-300 hover:text-white"
          >
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>

        {(currentUser?.isVerified || currentUser?.role === 'admin') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Quick Switch Test User:</span>
            <button
              onClick={() => setShowSwitchModal(true)}
              className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700"
            >
              Select Demo Account
            </button>
          </div>
        )}

        {currentUser && (
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={logoutUser}
              className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out of Mobile App</span>
            </button>
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL (Requested Feature) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 p-safe">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">
                  Edit Profile
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Photo Preview & Upload Controls */}
              <div className="flex flex-col items-center space-y-2.5">
                <div className="relative">
                  <img
                    src={editAvatar}
                    alt={editName}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500 shadow-xl"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                    title="Upload Photo from Device"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-center">
                  <span className="text-[11px] font-bold text-white block">
                    Change Profile Photo
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Upload a photo from your device or choose an avatar below
                  </span>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload Photo from Gallery / Device</span>
                </button>
              </div>

              {/* Preset Avatars Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Or choose a preset avatar:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => setEditAvatar(preset)}
                      className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all p-0.5 ${
                        editAvatar === preset
                          ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img src={preset} alt={`Avatar ${idx}`} className="w-full h-11 object-cover rounded-lg" />
                      {editAvatar === preset && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center text-slate-950">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your full name..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Country Selector inside Edit Profile Modal (Verified Users Only) */}
              {currentUser?.isVerified && (
                <CountrySelector
                  value={editCountry}
                  onChange={setEditCountry}
                  label="Country / Region"
                  compact
                />
              )}

              {/* Custom Image URL fallback */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">
                  Direct Image URL:
                </label>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Payment Method Logos Selector for Verified Users */}
              {currentUser?.isVerified && (
                <div className="space-y-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white flex items-center space-x-1.5">
                      <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Show Payment Method Logos on Profile</span>
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {WALLET_REGIONS.map((region) => {
                      const items = PAYMENT_METHOD_OPTIONS.filter((o) => o.region === region.key);
                      if (items.length === 0) return null;
                      return (
                        <div key={region.key} className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-400">
                            {region.label}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {items.map((opt) => {
                              const selected = editPaymentBadges.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleToggleModalPaymentBadge(opt.id)}
                                  className={`min-h-[44px] px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-left transition-all ${
                                    selected
                                      ? `${opt.accentBg} ${opt.accentBorder}`
                                      : 'bg-slate-900 border-slate-800 text-slate-400'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <PaymentMethodSvg method={opt.id} className="w-5 h-5 shrink-0" />
                                    <span className={`text-[11px] font-bold truncate ${selected ? opt.accentText : 'text-slate-300'}`}>
                                      {opt.name}
                                    </span>
                                  </div>
                                  {selected && <Check className={`w-3.5 h-3.5 shrink-0 ${opt.accentText}`} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* WhatsApp & Telegram Direct Contact Inputs */}
                  <div className="pt-2.5 border-t border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-white block">
                      WhatsApp & Telegram Links (Direct Messaging)
                    </span>
                    <div className="flex items-center space-x-2">
                      <WhatsappOfficialSvg className="w-6 h-6 shrink-0" />
                      <input
                        type="text"
                        value={editWhatsapp}
                        onChange={(e) => setEditWhatsapp(e.target.value)}
                        placeholder="WhatsApp number (+88017XXXXXXXX)"
                        className="flex-1 min-h-[40px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <TelegramOfficialSvg className="w-6 h-6 shrink-0" />
                      <input
                        type="text"
                        value={editTelegram}
                        onChange={(e) => setEditTelegram(e.target.value)}
                        placeholder="Telegram (@username or https://t.me/...)"
                        className="flex-1 min-h-[40px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEMO USER SWITCH MODAL (VERIFIED/ADMIN ONLY) */}
      {showSwitchModal && (currentUser?.isVerified || currentUser?.role === 'admin') && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 p-safe">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Select Test User Account
              </h3>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {demoUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    switchDemoUser(user.id);
                    setShowSwitchModal(false);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    currentUser?.id === user.id
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="relative">
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-lg object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-xs font-bold leading-tight">
                        <span>{user.name}</span>
                        {user.isVerified && <VerifiedBadge variant="colorful" size="sm" />}
                        {user.hasVolumeVBadge && <VolumeVBadge size="sm" />}
                        {user.isVerified &&
                          ((user.paymentBadges || []).length > 0 || user.whatsappNumber || user.telegramLink) && (
                            <div className="flex items-center space-x-0.5 ml-1">
                              {(user.paymentBadges || []).map((m) => (
                                <PaymentMethodSvg key={m} method={m} className="w-3.5 h-3.5" />
                              ))}
                              {user.whatsappNumber && <WhatsappOfficialSvg className="w-3.5 h-3.5" />}
                              {user.telegramLink && <TelegramOfficialSvg className="w-3.5 h-3.5" />}
                            </div>
                          )}
                      </div>
                      <div className="text-[10px] text-slate-400">{user.id} • ${user.balance.toFixed(2)} USDT</div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      user.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : user.status === 'suspended'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* 5. TRANSACTION HISTORY MODAL                             */}
      {/* ======================================================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center pt-safe px-safe sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250 pb-safe sm:pb-0">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <span>Transaction History</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {filteredTransactions.length}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Complete ledger of deposits, withdrawals, and expenses</p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleRefreshFinances}
                  className={`p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all ${
                    isRefreshingFinances ? 'animate-spin text-amber-400' : ''
                  }`}
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Summary Pill Bar inside Modal */}
            <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-3 gap-2 shrink-0">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 block font-medium">Total In</span>
                <span className="text-xs font-black text-emerald-400">+${totalMoneyIn.toFixed(2)}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 block font-medium">Total Out</span>
                <span className="text-xs font-black text-rose-400">-${totalMoneyOut.toFixed(2)}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 block font-medium">Net Cash Flow</span>
                <span className={`text-xs font-black ${netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netFlow >= 0 ? `+$${netFlow.toFixed(2)}` : `-$${Math.abs(netFlow).toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Filter Tabs Header */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2 shrink-0">
              {/* Category Filter */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setLedgerFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    ledgerFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({userTransactions?.length || 0})
                </button>
                <button
                  onClick={() => setLedgerFilter('deposit')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    ledgerFilter === 'deposit'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  Deposits ({userDeposits?.length || 0})
                </button>
                <button
                  onClick={() => setLedgerFilter('withdrawal')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    ledgerFilter === 'withdrawal'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-rose-400'
                  }`}
                >
                  Withdrawals ({userWithdrawals?.length || 0})
                </button>
                <button
                  onClick={() => setLedgerFilter('income')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    ledgerFilter === 'income'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  Income
                </button>
                <button
                  onClick={() => setLedgerFilter('expense')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    ledgerFilter === 'expense'
                      ? 'bg-rose-900/60 text-rose-300 border border-rose-500/50'
                      : 'bg-slate-800 text-slate-400 hover:text-rose-400'
                  }`}
                >
                  Expense
                </button>
              </div>

              {/* Time Period Filter */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>Time Range:</span>
                </span>
                <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setTimeFilter('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      timeFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Time
                  </button>
                  <button
                    onClick={() => setTimeFilter('today')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      timeFilter === 'today'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setTimeFilter('month')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      timeFilter === 'month'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    This Month
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Transaction List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/40">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <History className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">
                    No transaction records found for this filter.
                  </p>
                  <button
                    onClick={() => {
                      setLedgerFilter('all');
                      setTimeFilter('all');
                    }}
                    className="text-[11px] text-amber-400 hover:underline font-bold"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const isCredit =
                    tx.amount > 0 ||
                    tx.type === 'deposit' ||
                    tx.type === 'referral_commission' ||
                    tx.type === 'reward_claim';

                  const dateObj = new Date(tx.createdAt);
                  const formattedDate = dateObj.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const formattedTime = dateObj.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={tx.id}
                      className="pt-2.5 first:pt-0 flex items-center justify-between hover:bg-slate-850/40 p-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                            isCredit
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {tx.description || tx.type.replace('_', ' ').toUpperCase()}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-medium text-slate-300">{formattedDate}</span>
                            <span>•</span>
                            <span>{formattedTime}</span>
                            <span>•</span>
                            <span
                              className={`font-semibold capitalize px-1.5 py-0.2 rounded ${
                                tx.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : tx.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <span
                          className={`text-sm font-black block tracking-tight ${
                            isCredit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCredit ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Bal: ${tx.balanceAfter?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
              <span className="text-[10px] text-slate-500">
                Showing: {filteredTransactions.length} {filteredTransactions.length === 1 ? 'record' : 'records'}
              </span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. COMPANY INFORMATION & LICENSE DOCUMENTS MODAL         */}
      {/* ======================================================== */}
      {showCompanyInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center pt-safe px-safe sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden pb-safe sm:pb-0">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white flex items-center space-x-1.5 truncate">
                    <span className="truncate">
                      {settings?.companyInfo?.companyName || 'CryptoEarnGo Global Technologies Ltd.'}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate">
                    Official Corporate Information &amp; Verified Licenses
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCompanyInfoModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                aria-label="Close Company Info"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Overview & Description */}
              {settings?.companyInfo?.description && (
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    About the Company
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {settings.companyInfo.description}
                  </p>
                </div>
              )}

              {/* Corporate Metadata Grid */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800 divide-y divide-slate-800/80 text-xs">
                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="text-slate-400">Company Name</span>
                  <span className="font-bold text-white text-right">
                    {settings?.companyInfo?.companyName || 'CryptoEarnGo Global Technologies Ltd.'}
                  </span>
                </div>

                {settings?.companyInfo?.registrationNumber && (
                  <div className="p-3 flex items-center justify-between gap-2">
                    <span className="text-slate-400">Registration No.</span>
                    <span className="font-mono font-bold text-amber-400 text-right">
                      {settings.companyInfo.registrationNumber}
                    </span>
                  </div>
                )}

                {settings?.companyInfo?.jurisdiction && (
                  <div className="p-3 flex items-center justify-between gap-2">
                    <span className="text-slate-400">Jurisdiction</span>
                    <span className="font-semibold text-emerald-400 text-right">
                      {settings.companyInfo.jurisdiction}
                    </span>
                  </div>
                )}

                {settings?.companyInfo?.foundedYear && (
                  <div className="p-3 flex items-center justify-between gap-2">
                    <span className="text-slate-400">Founded</span>
                    <span className="font-semibold text-white text-right">
                      {settings.companyInfo.foundedYear}
                    </span>
                  </div>
                )}

                {settings?.companyInfo?.headquarters && (
                  <div className="p-3 flex items-start justify-between gap-3">
                    <span className="text-slate-400 flex items-center space-x-1 shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>Headquarters</span>
                    </span>
                    <span className="font-medium text-slate-200 text-right">
                      {settings.companyInfo.headquarters}
                    </span>
                  </div>
                )}

                {settings?.companyInfo?.officialEmail && (
                  <div className="p-3 flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center space-x-1 shrink-0">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      <span>Official Email</span>
                    </span>
                    <a
                      href={`mailto:${settings.companyInfo.officialEmail}`}
                      className="font-mono text-sky-400 hover:underline text-right truncate"
                    >
                      {settings.companyInfo.officialEmail}
                    </a>
                  </div>
                )}

                {settings?.companyInfo?.officialWebsite && (
                  <div className="p-3 flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center space-x-1 shrink-0">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Website</span>
                    </span>
                    <a
                      href={settings.companyInfo.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-emerald-400 hover:underline text-right truncate"
                    >
                      {settings.companyInfo.officialWebsite}
                    </a>
                  </div>
                )}
              </div>

              {/* Uploaded License Document Pictures Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                    <span>License &amp; Registration Documents</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {settings?.companyInfo?.licenses?.length || 0} Uploaded
                  </span>
                </div>

                {(settings?.companyInfo?.licenses?.length || 0) > 0 ? (
                  <div className="space-y-3">
                    {settings!.companyInfo!.licenses.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-md"
                      >
                        <button
                          type="button"
                          onClick={() => setZoomedLicense(doc)}
                          className="relative w-full h-44 bg-slate-900 block group focus:outline-none"
                        >
                          <img
                            src={doc.imageUrl}
                            alt={doc.title}
                            className="w-full h-full object-contain p-1"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 text-white text-[10px] font-bold flex items-center space-x-1 opacity-90 border border-slate-700">
                              <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                              <span>Tap to View Full Image</span>
                            </span>
                          </div>
                        </button>
                        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{doc.title}</div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {doc.issuingAuthority || 'Verified Authority'}
                              {doc.documentNumber ? ` • No: ${doc.documentNumber}` : ''}
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                            Verified
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-center space-y-1.5">
                    <FileCheck2 className="w-7 h-7 text-slate-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">No License Pictures Uploaded Yet</p>
                    <p className="text-[11px] text-slate-500">
                      Administrators can upload official license certificates from the Admin Panel &rarr; Media tab.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowCompanyInfoModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LICENSE IMAGE LIGHTBOX */}
      {zoomedLicense && (
        <div
          onClick={() => setZoomedLicense(null)}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 p-safe"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <h4 className="text-xs font-bold text-white truncate">{zoomedLicense.title}</h4>
                {zoomedLicense.documentNumber && (
                  <p className="text-[10px] font-mono text-amber-400 truncate">
                    No: {zoomedLicense.documentNumber}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setZoomedLicense(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-950 p-2 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={zoomedLicense.imageUrl}
                alt={zoomedLicense.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
