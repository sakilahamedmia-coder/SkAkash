import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  CreditCard,
  Image,
  Smartphone,
  Activity,
  LogOut,
  ExternalLink,
  KeyRound,
  Radio
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'products'
  | 'financials'
  | 'content'
  | 'app'
  | 'audit'
  | 'security';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  const { adminLogout, adminStats, realtimeConnected } = useApp();

  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    {
      id: 'financials',
      label: 'Financials & Queues',
      icon: CreditCard,
      badge:
        adminStats && (adminStats.pendingDepositsCount > 0 || adminStats.pendingWithdrawalsCount > 0)
          ? `${adminStats.pendingDepositsCount + adminStats.pendingWithdrawalsCount}`
          : undefined
    },
    { id: 'users', label: 'User Management', icon: Users, badge: adminStats ? `${adminStats.totalUsers}` : undefined },
    { id: 'products', label: 'Product Catalog', icon: ShoppingBag },
    { id: 'content', label: 'Banners & Media', icon: Image },
    { id: 'app', label: 'APK & App Releases', icon: Smartphone },
    { id: 'audit', label: 'Live Audit Log', icon: Activity },
    { id: 'security', label: 'Security & Password', icon: KeyRound }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-full">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img
              src="/assets/aistudio/file_00000000b1a881fa9f8249d48e315dcc_d0d81d28.png"
              alt="Crypto Earn Go Logo"
              className="w-9 h-9 rounded-xl object-cover border border-amber-500/40 shadow-lg shadow-amber-500/20 shrink-0"
            />
            <div>
              <div className="text-sm font-black text-white flex items-center space-x-1.5">
                <span>Crypto Earn Go</span>
              </div>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Admin Console
              </div>
            </div>
          </div>
        </div>

        {/* Real-time sync badge */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                realtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] font-medium text-slate-300">
              {realtimeConnected ? 'Real-Time Sync Active' : 'Connecting Stream...'}
            </span>
          </div>
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
        </div>

        {/* Nav Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      isActive
                        ? 'bg-slate-950 text-amber-400'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/40">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center space-x-2 transition-colors border border-slate-700"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          <span>Open User App</span>
        </a>

        <button
          onClick={adminLogout}
          className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Admin Session</span>
        </button>
      </div>
    </aside>
  );
};
