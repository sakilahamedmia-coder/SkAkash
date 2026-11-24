import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../utils/apiTransport';
import { VerifiedBadge } from '../VerifiedBadge';
import { VolumeVBadge } from '../VolumeVBadge';
import { CountryFlag, getCountryByCode } from '../CountrySelector';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Ban,
  PauseCircle,
  PlayCircle,
  Eye,
  FileText,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Clock,
  CheckCircle2,
  BadgeCheck,
  Sparkles,
  UserCheck,
  Edit3
} from 'lucide-react';
import { User } from '../../types';

export const AdminUsers: React.FC = () => {
  const { allUsers, updateUserStatus, toggleUserVerified, updateVerifiedUserId, addToast, adminToken, currentUser } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [selectedUserLedger, setSelectedUserLedger] = useState<any | null>(null);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  // Ban dialog state
  const [banUserTarget, setBanUserTarget] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('Violation of platform referral terms');

  // Edit Verified User ID dialog state
  const [editIdTarget, setEditIdTarget] = useState<User | null>(null);
  const [newUserIdInput, setNewUserIdInput] = useState('');
  const [isSavingUserId, setIsSavingUserId] = useState(false);

  const filteredUsers = allUsers.filter(u => {
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesVerified =
      verifiedFilter === 'all' ||
      (verifiedFilter === 'verified' && Boolean(u.isVerified)) ||
      (verifiedFilter === 'unverified' && !u.isVerified);

    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      u.id.toLowerCase().includes(term) ||
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.referralCode.toLowerCase().includes(term);

    return matchesStatus && matchesVerified && matchesSearch;
  });

  const handleOpenLedger = async (userId: string) => {
    setIsLoadingLedger(true);
    try {
      const headers: Record<string, string> = {};
      if (adminToken) headers['x-admin-token'] = adminToken;
      if (currentUser?.id) headers['x-user-id'] = currentUser.id;
      const res = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}/ledger`, {
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedUserLedger(data);
      } else {
        addToast('Failed to load user ledger', 'error');
      }
    } catch (e) {
      addToast('Error loading ledger', 'error');
    }
    setIsLoadingLedger(false);
  };

  const handleOpenEditId = (user: User) => {
    if (!user.isVerified) {
      addToast('Only verified accounts can edit their User ID.', 'warning');
      return;
    }
    setEditIdTarget(user);
    setNewUserIdInput(user.id);
  };

  const handleSaveUserId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editIdTarget) return;
    setIsSavingUserId(true);
    const ok = await updateVerifiedUserId(editIdTarget.id, newUserIdInput);
    setIsSavingUserId(false);
    if (ok) {
      setEditIdTarget(null);
    }
  };

  const handleConfirmBan = async () => {
    if (!banUserTarget) return;
    await updateUserStatus(banUserTarget.id, 'banned', banReason);
    setBanUserTarget(null);
  };

  const isExactIdMatch = allUsers.some(u => u.id.toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-400" />
            <span>User Management & Verification</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search users by Unique ID, toggle Verified Blue Badges in real-time, or manage account suspension & ban states.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Total Users: <strong className="text-white">{allUsers.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center space-x-1.5">
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>Verified: <strong>{allUsers.filter(u => u.isVerified).length}</strong></span>
          </span>
        </div>
      </div>

      {/* DEDICATED USER ID SEARCH BAR & FILTERS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          {/* Prominent Search Bar specifically for User ID & Profile */}
          <div className="relative w-full lg:w-96">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4 text-amber-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by User ID (e.g. CEG-882941) or name..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips: Status & Verification */}
          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
            {/* Status Pills */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'all', label: 'All Users' },
                { id: 'active', label: 'Active' },
                { id: 'suspended', label: 'Suspended' },
                { id: 'banned', label: 'Banned' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === f.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Verification Filter */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setVerifiedFilter('all')}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
                  verifiedFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVerifiedFilter('verified')}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                  verifiedFilter === 'verified'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BadgeCheck className="w-3.5 h-3.5 text-sky-300" />
                <span>Verified</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick User ID search shortcuts & matching indicator */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-400">Quick ID Search:</span>
          {allUsers.slice(0, 4).map((u) => (
            <button
              key={u.id}
              onClick={() => setSearch(u.id)}
              className={`px-2 py-0.5 rounded-lg font-mono font-bold transition-all border ${
                search.trim().toLowerCase() === u.id.toLowerCase()
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              {u.id}
            </button>
          ))}

          {search && isExactIdMatch && (
            <span className="ml-auto text-emerald-400 font-bold flex items-center space-x-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Exact User ID Found</span>
            </span>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User Profile & ID</th>
                <th className="py-3 px-4 text-center">Verified Status (Blue Badge)</th>
                <th className="py-3 px-4">USDT Balance</th>
                <th className="py-3 px-4">Deposited / Withdrawn</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* User Profile & ID */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                        />
                        {user.isVerified && (
                          <div className="absolute -bottom-1 -right-1">
                            <VerifiedBadge size="sm" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5 font-bold text-white text-sm">
                          <span>{user.name}</span>
                          {user.isVerified && <VerifiedBadge size="sm" />}
                          {user.isVerified && user.country && (
                            <span title={getCountryByCode(user.country)?.name || user.country}>
                              <CountryFlag code={user.country} className="w-5 h-3.5" />
                            </span>
                          )}
                          {user.hasVolumeVBadge && <VolumeVBadge size="sm" />}
                        </div>
                        <div className="text-[11px] text-slate-400">{user.email}</div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 inline-block">
                            {user.id}
                          </span>
                          {user.isVerified && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditId(user)}
                              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-[10px] font-bold transition-colors"
                              title="Edit Verified Account ID"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Edit ID</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* TOGGLE VERIFIED STATUS (Requested Feature) */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(user.isVerified)}
                          onChange={(e) => toggleUserVerified(user.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                      </label>
                      <span
                        className={`text-[10px] font-bold ${
                          user.isVerified ? 'text-blue-400 flex items-center space-x-1' : 'text-slate-500'
                        }`}
                      >
                        {user.isVerified ? (
                          <>
                            <VerifiedBadge size="sm" />
                            <span>Verified</span>
                          </>
                        ) : (
                          <span>Unverified</span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* USDT Balance */}
                  <td className="py-3.5 px-4 font-black text-amber-400 text-sm">
                    ${user.balance.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">USDT</span>
                  </td>

                  {/* Deposited / Withdrawn / Tx Volume */}
                  <td className="py-3.5 px-4 tabular-nums">
                    <span className="font-bold text-emerald-400">
                      +${user.totalDeposited.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Out: ${user.totalWithdrawn.toFixed(2)}
                    </span>
                    {typeof user.totalTransactionVolume === 'number' && (
                      <span className={`text-[10px] font-semibold block ${user.hasVolumeVBadge ? 'text-amber-400' : 'text-slate-400'}`}>
                        Vol: ${user.totalTransactionVolume.toFixed(2)}
                      </span>
                    )}
                  </td>

                  {/* Account Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase inline-flex items-center space-x-1 ${
                        user.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : user.status === 'suspended'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      <span>{user.status}</span>
                    </span>
                    {user.banReason && (
                      <span className="text-[10px] text-rose-400/80 block mt-1 truncate max-w-[140px]">
                        {user.banReason}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {user.isVerified && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditId(user)}
                          className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 transition-colors"
                          title="Edit Verified User ID"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {/* View Ledger */}
                      <button
                        onClick={() => handleOpenLedger(user.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="View Full Ledger"
                      >
                        <Eye className="w-4 h-4 text-sky-400" />
                      </button>

                      {/* Status controls */}
                      {user.status === 'active' ? (
                        <>
                          <button
                            onClick={() => updateUserStatus(user.id, 'suspended', 'Account temporarily suspended for verification')}
                            className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 transition-colors"
                            title="Suspend Account"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setBanUserTarget(user);
                              setBanReason('Submitting fraudulent transaction hashes');
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition-colors"
                            title="Ban Account"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => updateUserStatus(user.id, 'active')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold border border-emerald-500/30 transition-colors flex items-center space-x-1"
                          title="Restore & Activate Account"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Unban / Activate</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-slate-950/40 p-4 space-y-2">
            <Search className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No Users Found</h4>
            <p className="text-xs text-slate-500">
              No account matched User ID &quot;{search}&quot;. Please check the ID and search again.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setVerifiedFilter('all');
              }}
              className="text-xs text-amber-400 font-bold underline"
            >
              Reset Search & Filters
            </button>
          </div>
        )}
      </div>

      {/* BAN CONFIRMATION MODAL */}
      {banUserTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2.5 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-black text-white">
                Ban Account: {banUserTarget.name} ({banUserTarget.id})
              </h3>
            </div>

            <p className="text-xs text-slate-300">
              Banning this user will immediately disconnect their session and display a locked lockout screen on their Android app in real-time.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">
                Reason for Ban (Visible on user app):
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setBanUserTarget(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBan}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Confirm & Enforce Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER LEDGER MODAL */}
      {selectedUserLedger && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedUserLedger.user.avatar}
                  alt={selectedUserLedger.user.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-white">
                      Audit Ledger: {selectedUserLedger.user.name}
                    </h3>
                    {selectedUserLedger.user.isVerified && <VerifiedBadge size="sm" />}
                    {selectedUserLedger.user.hasVolumeVBadge && <VolumeVBadge size="sm" />}
                  </div>
                  <span className="text-[10px] font-mono text-amber-400">
                    ID: {selectedUserLedger.user.id} • Balance: ${selectedUserLedger.user.balance.toFixed(2)} USDT
                  </span>
                </div>
              </div>

              {/* Quick Toggle in Ledger Modal */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold">Verified:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedUserLedger.user.isVerified)}
                      onChange={(e) => {
                        toggleUserVerified(selectedUserLedger.user.id, e.target.checked);
                        setSelectedUserLedger((prev: any) => ({
                          ...prev,
                          user: { ...prev.user, isVerified: e.target.checked }
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <button
                  onClick={() => setSelectedUserLedger(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Transactions List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  All Financial Records ({selectedUserLedger.transactions?.length || 0})
                </h4>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {selectedUserLedger.transactions?.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{tx.description}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-black ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {tx.amount > 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} USDT
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Bal: ${tx.balanceAfter.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deposits & Withdrawals summary */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Deposits Submissions ({selectedUserLedger.deposits?.length || 0})
                  </span>
                  {selectedUserLedger.deposits?.map((d: any) => (
                    <div key={d.id} className="text-[11px] py-1 border-b border-slate-900 last:border-0 flex justify-between">
                      <span className="text-white">+${d.amount} USDT</span>
                      <span className={`text-[10px] font-bold uppercase ${d.status === 'approved' ? 'text-emerald-400' : d.status === 'pending' ? 'text-amber-400' : 'text-rose-400'}`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Withdrawal Requests ({selectedUserLedger.withdrawals?.length || 0})
                  </span>
                  {selectedUserLedger.withdrawals?.map((w: any) => (
                    <div key={w.id} className="text-[11px] py-1 border-b border-slate-900 last:border-0 flex justify-between">
                      <span className="text-white">-${w.amount} USDT</span>
                      <span className={`text-[10px] font-bold uppercase ${w.status === 'approved' ? 'text-emerald-400' : w.status === 'pending' ? 'text-amber-400' : 'text-rose-400'}`}>
                        {w.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT VERIFIED USER ID MODAL */}
      {editIdTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/35 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">
                  Edit Verified Account ID
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditIdTarget(null)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <img
                src={editIdTarget.avatar}
                alt={editIdTarget.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-700"
              />
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                  <span className="truncate">{editIdTarget.name}</span>
                  <VerifiedBadge size="sm" />
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Current ID: <span className="text-amber-400 font-bold">{editIdTarget.id}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveUserId} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 block">
                  New Verified User ID:
                </label>
                <input
                  type="text"
                  required
                  value={newUserIdInput}
                  onChange={(e) => setNewUserIdInput(e.target.value.toUpperCase())}
                  placeholder="e.g. CEG-VIP01 or CEG-900001"
                  className="w-full min-h-[44px] bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400 uppercase"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Use 3–24 alphanumeric characters or hyphens (-). All deposits, withdrawals, orders, and referral records for this user will automatically update to the new ID.
                </p>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditIdTarget(null)}
                  className="flex-1 min-h-[44px] py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUserId}
                  className="flex-1 min-h-[44px] py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
                >
                  {isSavingUserId ? 'Saving...' : 'Save New ID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
