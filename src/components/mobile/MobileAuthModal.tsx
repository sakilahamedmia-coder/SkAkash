import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../utils/apiTransport';
import { normalizeReferralCodeInput } from '../../utils/publicUrl';
import { X, Mail, Lock, User, ArrowRight, Gift, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

interface SavedGoogleAccount {
  email: string;
  name: string;
  avatar: string;
}

const SAVED_GOOGLE_STORAGE_KEY = 'ceg_saved_google_accounts';

const DEFAULT_GOOGLE_ACCOUNTS: SavedGoogleAccount[] = [
  {
    email: 'demo@cryptoearngo.com',
    name: 'Alex Morgan',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  }
];

function loadSavedGoogleAccounts(): SavedGoogleAccount[] {
  if (typeof window === 'undefined') return DEFAULT_GOOGLE_ACCOUNTS;
  try {
    const raw = localStorage.getItem(SAVED_GOOGLE_STORAGE_KEY);
    if (!raw) return DEFAULT_GOOGLE_ACCOUNTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore parse error
  }
  return DEFAULT_GOOGLE_ACCOUNTS;
}

function saveGoogleAccount(account: SavedGoogleAccount) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadSavedGoogleAccounts();
    const cleanEmail = account.email.trim().toLowerCase();
    const filtered = current.filter((a) => a.email.trim().toLowerCase() !== cleanEmail);
    const updated = [{ ...account, email: cleanEmail }, ...filtered].slice(0, 5);
    localStorage.setItem(SAVED_GOOGLE_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage failure
  }
}

export const MobileAuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, loginUser, registerUser, googleSignIn, pendingReferralCode } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'google'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [savedAccounts, setSavedAccounts] = useState<SavedGoogleAccount[]>(DEFAULT_GOOGLE_ACCOUNTS);
  const [referralCode, setReferralCode] = useState('');
  const [referrerInfo, setReferrerInfo] = useState<{ valid: boolean; referrerName: string | null; bonusPercent: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      setSavedAccounts(loadSavedGoogleAccounts());
      setFormError(null);
      if (pendingReferralCode) {
        setMode('register');
        setReferralCode(pendingReferralCode);
      }
    }
  }, [isAuthModalOpen, pendingReferralCode]);

  useEffect(() => {
    const clean = normalizeReferralCodeInput(referralCode);
    if (clean.length < 3) {
      setReferrerInfo(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      apiFetch(`/api/referrals/validate/${encodeURIComponent(clean)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!cancelled && data) {
            setReferrerInfo({
              valid: Boolean(data.valid),
              referrerName: data.referrerName,
              bonusPercent: data.firstTaskBonusPercent ?? 20
            });
          }
        })
        .catch(() => {});
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [referralCode]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const success = await loginUser(cleanEmail, password);
        if (success) {
          setIsAuthModalOpen(false);
        } else {
          setFormError('Unable to sign in. Verify your email/password or use Register / Google Sign-In.');
        }
      } else {
        const cleanName = name.trim();
        if (!cleanName) {
          setFormError('Please enter your full name.');
          setIsLoading(false);
          return;
        }
        const cleanRef = normalizeReferralCodeInput(referralCode) || undefined;
        const success = await registerUser({
          name: cleanName,
          email: cleanEmail,
          password,
          referralCode: cleanRef
        });
        if (success) {
          setIsAuthModalOpen(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenGoogleChooser = () => {
    setFormError(null);
    setSavedAccounts(loadSavedGoogleAccounts());
    if (email.trim() && email.includes('@')) {
      setGoogleEmail(email.trim());
    }
    if (name.trim()) {
      setGoogleName(name.trim());
    }
    setMode('google');
  };

  const completeGoogleSignIn = async (account: SavedGoogleAccount) => {
    setFormError(null);
    setIsLoading(true);
    try {
      const cleanRef = normalizeReferralCodeInput(referralCode) || undefined;
      const success = await googleSignIn({
        email: account.email.trim().toLowerCase(),
        name: account.name.trim() || account.email.split('@')[0],
        avatar: account.avatar,
        referralCode: cleanRef
      });
      if (success) {
        saveGoogleAccount(account);
        setSavedAccounts(loadSavedGoogleAccounts());
        setIsAuthModalOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Please enter a valid Google / Gmail address.');
      return;
    }
    const cleanName = googleName.trim() || cleanEmail.split('@')[0];
    await completeGoogleSignIn({
      email: cleanEmail,
      name: cleanName,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    });
  };

  const handleQuickDemoSignIn = async () => {
    setFormError(null);
    setEmail('demo@cryptoearngo.com');
    setPassword('password123');
    setMode('login');
    setIsLoading(true);
    try {
      const ok = await loginUser('demo@cryptoearngo.com', 'password123');
      if (ok) {
        setIsAuthModalOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const GoogleLogoSvg = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 p-safe">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-5 pb-3 text-center border-b border-slate-800/80">
          <img
            src="/assets/aistudio/file_00000000b1a881fa9f8249d48e315dcc_d0d81d28.png"
            alt="CryptoEarnGo Logo"
            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-2.5 border border-amber-500/40 shadow-lg shadow-amber-500/20"
          />
          <h2 className="text-base font-black text-white">CryptoEarnGo</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {mode === 'google'
              ? 'Choose an account to continue to CryptoEarnGo'
              : mode === 'login'
              ? 'Sign in to access your BEP-20 wallet'
              : 'Create an account & get $1.00 USDT Bonus'}
          </p>
        </div>

        {/* Inline Error Message */}
        {formError && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-[11px] text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {mode === 'google' ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setMode('login');
                }}
                className="inline-flex items-center space-x-1 text-xs font-bold text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-white">
                <GoogleLogoSvg />
                <span>Google Account</span>
              </div>
            </div>

            {/* Saved 1-Tap Google Accounts */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Tap an Account for Instant Sign-In
              </span>
              <div className="space-y-2">
                {savedAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={isLoading}
                    onClick={() => completeGoogleSignIn(acc)}
                    className="w-full p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between text-left transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{acc.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{acc.email}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Or Enter Any Gmail */}
            <form onSubmit={handleCustomGoogleSubmit} className="pt-3 border-t border-slate-800 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Or Sign In With Another Google Email
              </span>
              <div>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Display Name (Optional)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50"
              >
                <GoogleLogoSvg />
                <span>{isLoading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Tab switch */}
            <div className="flex px-5 pt-4 space-x-2">
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setMode('login');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setMode('register');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'register'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Referral Code or Invite Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.includes('?') || val.includes('/') || val.startsWith('http')) {
                        setReferralCode(normalizeReferralCodeInput(val));
                      } else {
                        setReferralCode(val.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24));
                      }
                    }}
                    placeholder="e.g. CEG882 or paste invite link"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 uppercase placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  {referrerInfo?.valid && (
                    <div className="mt-1.5 flex items-center space-x-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2.5 py-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Invited by <strong>{referrerInfo.referrerName}</strong> • Complete your 1st task to trigger their{' '}
                        {referrerInfo.bonusPercent}% referral bonus!
                      </span>
                    </div>
                  )}
                  {referralCode.trim().length >= 5 && referrerInfo && !referrerInfo.valid && (
                    <div className="mt-1 flex items-center space-x-1 text-[10px] text-slate-400">
                      <Gift className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Optional code not matched — you can still create your account normally.</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 mt-1"
              >
                <span>{isLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Free Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* OR Divider */}
              <div className="flex items-center space-x-2 my-2">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] text-slate-500 font-bold uppercase">Or Continue With</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Google Sign-In Account Picker */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleOpenGoogleChooser}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 flex items-center justify-center space-x-2 transition-all shadow-sm disabled:opacity-50"
              >
                <GoogleLogoSvg />
                <span>Google Sign-In</span>
              </button>

              {/* Quick Demo Credentials */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleQuickDemoSignIn}
                  className="text-[11px] text-amber-400/90 hover:text-amber-300 font-semibold underline underline-offset-2 disabled:opacity-50"
                >
                  Instant Sign In as Demo User (Alex Morgan)
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
