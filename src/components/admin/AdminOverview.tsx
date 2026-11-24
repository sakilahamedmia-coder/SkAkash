import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  CreditCard,
  Users,
  ShoppingBag,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  Copy,
  Check,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import { AdminTab } from './AdminSidebar';

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

interface AdminOverviewProps {
  setActiveTab: (tab: AdminTab) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ setActiveTab }) => {
  const {
    adminStats,
    allDeposits,
    allWithdrawals,
    allUsers,
    allOrders,
    refreshAllData,
    approveDeposit,
    rejectDeposit,
    approveWithdrawal,
    rejectWithdrawal,
    settings,
    addToast
  } = useApp();

  const [copiedWthId, setCopiedWthId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshAllData();
    setIsRefreshing(false);
    addToast('Admin records synchronized with server.', 'success');
  };

  const handleCopyAddress = async (wthId: string, address: string) => {
    const ok = await copyTextReliably(address);
    if (ok) {
      setCopiedWthId(wthId);
      addToast('Withdrawal address copied to clipboard!', 'success');
      setTimeout(() => setCopiedWthId((prev) => (prev === wthId ? null : prev)), 2000);
    } else {
      addToast('Could not copy automatically. Please copy manually.', 'warning');
    }
  };

  const pendingDeposits = allDeposits.filter(d => d.status === 'pending');
  const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'pending');
  const recentUsers = [...allUsers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Crypto Earn Go Executive Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time synchronization console connected to Android production instances & Binance Smart Chain BEP-20.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Sync Active</span>
          </span>
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold">
            App Release: {settings?.appVersion || 'v2.4.1'}
          </span>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total BEP-20 Volume
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              ${adminStats?.totalVolume.toFixed(2) || '0.00'}{' '}
              <span className="text-xs font-semibold text-amber-400">USDT</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>Processed from real blockchain deposits</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Deposits */}
        <div
          onClick={() => setActiveTab('financials')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between cursor-pointer transition-colors"
        >
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Pending Deposits
            </span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">
              {adminStats?.pendingDepositsCount || 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Volume: ${adminStats?.pendingDepositsAmount.toFixed(2) || '0.00'} USDT
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <ArrowDownToLine className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div
          onClick={() => setActiveTab('financials')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between cursor-pointer transition-colors"
        >
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Pending Withdrawals
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {adminStats?.pendingWithdrawalsCount || 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Required: ${adminStats?.pendingWithdrawalsAmount.toFixed(2) || '0.00'} USDT
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ArrowUpFromLine className="w-6 h-6" />
          </div>
        </div>

        {/* Registered Users */}
        <div
          onClick={() => setActiveTab('users')}
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between cursor-pointer transition-colors"
        >
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Registered Accounts
            </span>
            <span className="text-2xl font-black text-purple-400 mt-1 block">
              {adminStats?.totalUsers || 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Active: {adminStats?.activeUsers || 0} • Banned: {adminStats?.bannedUsers || 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* IMMEDIATE APPROVAL ACTION QUEUES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Deposits Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowDownToLine className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Pending Deposits Verification ({pendingDeposits.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('financials')}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              View All
            </button>
          </div>

          {pendingDeposits.length > 0 ? (
            <div className="space-y-3">
              {pendingDeposits.slice(0, 3).map((dep) => (
                <div
                  key={dep.id}
                  className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm">
                        +${dep.amount.toFixed(2)} USDT
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        from {dep.userName} ({dep.userId})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                      PENDING REVIEW
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 truncate bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                    TxHash: {dep.txHash}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">
                      {new Date(dep.createdAt).toLocaleString()}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => rejectDeposit(dep.id, 'Invalid TxHash or zero confirmation on BSC')}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-bold text-xs border border-rose-500/30 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approveDeposit(dep.id, 'Verified on BscScan')}
                        className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-colors"
                      >
                        Approve & Credit Balance
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-500">
              <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
              All deposit requests have been processed.
            </div>
          )}
        </div>

        {/* Pending Withdrawals Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowUpFromLine className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Pending Withdrawals Payout ({pendingWithdrawals.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('financials')}
              className="text-xs text-emerald-400 hover:underline font-bold"
            >
              View All
            </button>
          </div>

          {pendingWithdrawals.length > 0 ? (
            <div className="space-y-3">
              {pendingWithdrawals.slice(0, 3).map((wth) => (
                <div
                  key={wth.id}
                  className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm">
                        ${wth.amount.toFixed(2)} USDT
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        Payout to {wth.userName} ({wth.userId})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      NET: ${wth.finalAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-300 bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                    <span className="truncate select-all">To Address: {wth.toAddress}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(wth.id, wth.toAddress)}
                      className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-sans font-bold flex items-center space-x-1 transition-colors ${
                        copiedWthId === wth.id
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                      }`}
                    >
                      {copiedWthId === wth.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWthId === wth.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">
                      {new Date(wth.createdAt).toLocaleString()}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => rejectWithdrawal(wth.id, 'Account under compliance review')}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-bold text-xs border border-rose-500/30 transition-colors"
                      >
                        Reject & Refund
                      </button>
                      <button
                        onClick={() => approveWithdrawal(wth.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-colors"
                      >
                        Approve & Send BEP-20
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-500">
              <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
              All withdrawal requests have been settled.
            </div>
          )}
        </div>
      </div>

      {/* LIVE REGISTRATIONS & ORDERS FEEDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest User Registrations */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Latest User Registrations ({allUsers.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('users')}
              className="text-xs text-purple-400 hover:underline font-bold"
            >
              View All Users
            </button>
          </div>

          {recentUsers.length > 0 ? (
            <div className="space-y-2.5">
              {recentUsers.map((usr) => (
                <div
                  key={usr.id}
                  className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={usr.avatar}
                      alt={usr.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-white truncate">{usr.name}</span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0">
                          {usr.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{usr.email}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-bold text-emerald-400 tabular-nums">
                      ${usr.balance.toFixed(2)} USDT
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(usr.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-500">
              No registered users recorded yet.
            </div>
          )}
        </div>

        {/* Latest Product Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Latest Product Orders ({allOrders.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('financials')}
              className="text-xs text-cyan-400 hover:underline font-bold"
            >
              View Orders Ledger
            </button>
          </div>

          {recentOrders.length > 0 ? (
            <div className="space-y-2.5">
              {recentOrders.map((ord) => {
                const buyer = allUsers.find((u) => u.id === ord.userId);
                return (
                  <div
                    key={ord.id}
                    className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white truncate">{ord.productTitle}</span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0">
                          {ord.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        Buyer: {buyer?.name || ord.userEmail} ({ord.userId})
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-black text-amber-400 tabular-nums">
                        ${ord.productPrice.toFixed(2)} USDT
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(ord.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-500">
              No product orders placed yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
