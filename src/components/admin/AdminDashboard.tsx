import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminProducts } from './AdminProducts';
import { AdminFinancials } from './AdminFinancials';
import { AdminContent } from './AdminContent';
import { AdminAppRelease } from './AdminAppRelease';
import { AdminAudit } from './AdminAudit';
import { AdminSecurity } from './AdminSecurity';
import { VerifiedBadge } from '../VerifiedBadge';
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  LogOut,
  LayoutDashboard,
  CreditCard,
  Users,
  ShoppingBag,
  Image,
  Smartphone,
  Activity,
  KeyRound,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { PullToRefresh } from '../mobile/PullToRefresh';

interface AdminDashboardProps {
  inApp?: boolean;
  onClose?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ inApp = false, onClose }) => {
  const {
    isAdmin,
    adminLogin,
    adminLogout,
    currentUser,
    realtimeConnected,
    adminStats,
    refreshAllData,
    addToast
  } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleAdminRefresh = async () => {
    setIsManualRefreshing(true);
    await refreshAllData();
    setIsManualRefreshing(false);
    addToast('Admin panel data refreshed successfully!', 'success');
  };

  // Login form states
  const [email, setEmail] = useState('admin@cryptoearngo.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pendingQueueCount =
    (adminStats?.pendingDepositsCount || 0) + (adminStats?.pendingWithdrawalsCount || 0);

  const navItems: Array<{
    id: AdminTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'overview', label: 'Executive Overview', shortLabel: 'Overview', icon: LayoutDashboard },
    {
      id: 'financials',
      label: 'Financials & Queues',
      shortLabel: 'Finance',
      icon: CreditCard,
      badge: pendingQueueCount > 0 ? `${pendingQueueCount}` : undefined
    },
    {
      id: 'users',
      label: 'User Management',
      shortLabel: 'Users',
      icon: Users,
      badge: adminStats ? `${adminStats.totalUsers}` : undefined
    },
    { id: 'products', label: 'Product Catalog', shortLabel: 'Products', icon: ShoppingBag },
    { id: 'content', label: 'Banners & Media', shortLabel: 'Media', icon: Image },
    { id: 'app', label: 'APK & App Releases', shortLabel: 'App Release', icon: Smartphone },
    { id: 'audit', label: 'Live Audit Log', shortLabel: 'Audit Log', icon: Activity },
    { id: 'security', label: 'Security & Password', shortLabel: 'Security', icon: KeyRound }
  ];

  // STRICT VERIFIED-ACCOUNT GUARD
  if (!currentUser || !currentUser.isVerified) {
    return (
      <div
        className={`${
          inApp ? 'min-h-full py-8 px-4' : 'min-h-screen p-4'
        } flex flex-col items-center justify-center bg-slate-950 text-white`}
      >
        <div className="w-full max-w-sm bg-slate-900 border border-rose-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-black text-white">
              Verified Account Required
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Admin Panel is secured inside this Android app&apos;s Profile section and can only be accessed by <span className="text-amber-400 font-bold">Verified</span> accounts.
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center space-x-2 border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Back to Profile</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    const ok = await adminLogin(password, email);
    if (!ok) {
      setAuthError('Incorrect password or your account is not verified!');
    }
    setIsLoading(false);
  };

  // Password Gateway (inside Android App Profile Section)
  if (!isAdmin) {
    return (
      <div
        className={`${
          inApp ? 'min-h-full py-5 px-3.5' : 'min-h-screen p-4'
        } flex flex-col items-center justify-center bg-slate-950 text-white`}
      >
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-bold inline-flex items-center space-x-1.5 border border-slate-700/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Back to Profile</span>
            </button>
          )}

          <div className="text-center space-y-2">
            <img
              src="/assets/aistudio/file_00000000b1a881fa9f8249d48e315dcc_d0d81d28.png"
              alt="CryptoEarnGo Logo"
              className="w-16 h-16 rounded-2xl object-cover mx-auto border border-amber-500/40 shadow-lg shadow-amber-500/15"
            />
            <h2 className="text-lg font-black text-white tracking-tight">
              In-App Admin Panel
            </h2>
            <p className="text-xs text-slate-400">
              Sign in with your admin password from a verified account.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-200">
              <span>{currentUser.name}</span>
              <VerifiedBadge variant="colorful" size="sm" />
              <span className="text-amber-400 font-mono">({currentUser.id})</span>
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-xs text-rose-300 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminAuth} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Admin Email
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-11 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[46px] py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Verifying...' : 'Enter Admin Panel'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              Verified-Only Android In-App Console
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Logged in as Admin inside Android Software
  return (
    <div className={`flex ${inApp ? 'flex-col min-h-full' : 'h-screen overflow-hidden'} bg-slate-950 text-slate-100`}>
      {/* Desktop Sidebar fallback only when not embedded in Android in-app shell */}
      {!inApp && (
        <div className="hidden lg:flex h-full">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      )}

      {/* Android In-App Sticky Admin Top Bar & Horizontal Tab Strip */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center space-x-1 border border-slate-700 shrink-0 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Profile</span>
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <img
                  src="/assets/aistudio/file_00000000b1a881fa9f8249d48e315dcc_d0d81d28.png"
                  alt="CryptoEarnGo Logo"
                  className="w-5 h-5 rounded-md object-cover border border-amber-500/40 shrink-0"
                />
                <span className="text-xs font-black text-white truncate">
                  Admin Panel
                </span>
                <VerifiedBadge variant="colorful" size="sm" />
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    realtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="truncate">
                  {realtimeConnected ? 'Live Sync Active' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={handleAdminRefresh}
              disabled={isManualRefreshing}
              className="min-w-[40px] min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-[11px] font-bold flex items-center justify-center transition-colors disabled:opacity-50"
              title="Refresh Admin Data"
              aria-label="Refresh Admin Panel"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={adminLogout}
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center space-x-1 shrink-0 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </div>

        {/* Scrollable Android Section Tabs */}
        <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 whitespace-nowrap min-h-[40px] px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{item.shortLabel}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold tabular-nums ${
                      isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {inApp ? (
        <main className="flex-1 bg-slate-950 pb-8">
          {activeTab === 'overview' && <AdminOverview setActiveTab={setActiveTab} />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'financials' && <AdminFinancials />}
          {activeTab === 'content' && <AdminContent />}
          {activeTab === 'app' && <AdminAppRelease />}
          {activeTab === 'audit' && <AdminAudit />}
          {activeTab === 'security' && <AdminSecurity />}
        </main>
      ) : (
        <PullToRefresh
          onRefresh={handleAdminRefresh}
          className="flex-1 bg-slate-950 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800"
        >
          {activeTab === 'overview' && <AdminOverview setActiveTab={setActiveTab} />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'financials' && <AdminFinancials />}
          {activeTab === 'content' && <AdminContent />}
          {activeTab === 'app' && <AdminAppRelease />}
          {activeTab === 'audit' && <AdminAudit />}
          {activeTab === 'security' && <AdminSecurity />}
        </PullToRefresh>
      )}
    </div>
  );
};
