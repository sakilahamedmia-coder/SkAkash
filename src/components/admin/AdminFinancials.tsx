import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DepositNetworkConfig } from '../../types';
import {
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings,
  ExternalLink,
  Save,
  Network,
  Plus,
  Trash2,
  Power,
  X,
  Copy,
  Check,
  Search,
  Wallet,
  ShoppingBag
} from 'lucide-react';
import { DepositMarketLogo, DEPOSIT_LOGO_PRESETS } from '../DepositMarketLogo';

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

const DEFAULT_ADMIN_DEPOSIT_NETWORKS: DepositNetworkConfig[] = [
  {
    id: 'BEP20',
    code: 'BSC (BEP20)',
    name: 'BNB Smart Chain (BEP20)',
    shortLabel: 'USDT BEP-20',
    walletAddress: '0x71C8A3297a760bF1c0678F45a1fA723c3B08bF49',
    minDeposit: 10,
    estimatedTime: '~2 min',
    confirmations: '15 Block Confirmations',
    feeLabel: '0 USDT',
    explorerTxBase: 'https://bscscan.com/tx/',
    enabled: true
  },
  {
    id: 'TRC20',
    code: 'TRX (TRC20)',
    name: 'TRON (TRC20)',
    shortLabel: 'USDT TRC-20',
    walletAddress: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
    minDeposit: 10,
    estimatedTime: '~1 min',
    confirmations: '1 Block Confirmation',
    feeLabel: '0 USDT',
    explorerTxBase: 'https://tronscan.org/#/transaction/',
    enabled: true
  },
  {
    id: 'SOL',
    code: 'SOL',
    name: 'Solana',
    shortLabel: 'USDT Solana',
    walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    minDeposit: 5,
    estimatedTime: '~1 min',
    confirmations: '1 Confirmation',
    feeLabel: '0 USDT',
    explorerTxBase: 'https://solscan.io/tx/',
    enabled: true
  },
  {
    id: 'POLYGON',
    code: 'MATIC (Polygon)',
    name: 'Polygon POS',
    shortLabel: 'USDT Polygon',
    walletAddress: '0x71C8A3297a760bF1c0678F45a1fA723c3B08bF49',
    minDeposit: 5,
    estimatedTime: '~3 min',
    confirmations: '128 Block Confirmations',
    feeLabel: '0 USDT',
    explorerTxBase: 'https://polygonscan.com/tx/',
    enabled: true
  },
  {
    id: 'ERC20',
    code: 'ETH (ERC20)',
    name: 'Ethereum (ERC20)',
    shortLabel: 'USDT ERC-20',
    walletAddress: '0x71C8A3297a760bF1c0678F45a1fA723c3B08bF49',
    minDeposit: 20,
    estimatedTime: '~5 min',
    confirmations: '6 Block Confirmations',
    feeLabel: '0 USDT',
    explorerTxBase: 'https://etherscan.io/tx/',
    enabled: true
  }
];

function getExplorerUrl(networkName: string | undefined, txHash: string): string {
  const lower = (networkName || '').toLowerCase();
  if (lower.includes('trc')) return `https://tronscan.org/#/transaction/${txHash}`;
  if (lower.includes('sol')) return `https://solscan.io/tx/${txHash}`;
  if (lower.includes('polygon') || lower.includes('matic')) return `https://polygonscan.com/tx/${txHash}`;
  if (lower.includes('erc') || lower.includes('eth')) return `https://etherscan.io/tx/${txHash}`;
  return `https://bscscan.com/tx/${txHash}`;
}

export const AdminFinancials: React.FC = () => {
  const {
    allDeposits,
    allWithdrawals,
    allOrders,
    allUsers,
    settings,
    approveDeposit,
    rejectDeposit,
    approveWithdrawal,
    rejectWithdrawal,
    updateSettings,
    addDepositMarket,
    updateDepositMarket,
    deleteDepositMarket,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'orders' | 'settings'>('deposits');

  // Form states for system financial settings
  const [walletAddress, setWalletAddress] = useState(settings?.usdtBep20Address || '');
  const [minDeposit, setMinDeposit] = useState(settings?.minDeposit?.toString() || '10');
  const [minWithdrawal, setMinWithdrawal] = useState(settings?.minWithdrawal?.toString() || '2');
  const [feePercent, setFeePercent] = useState(settings?.withdrawalFeePercent?.toString() || '1.0');
  const [referralPercent, setReferralPercent] = useState(settings?.referralCommissionPercent?.toString() || '10');
  const [firstTaskBonusPercent, setFirstTaskBonusPercent] = useState(settings?.firstTaskBonusPercent?.toString() || '20');
  const [depositNetworks, setDepositNetworks] = useState<DepositNetworkConfig[]>(
    Array.isArray(settings?.depositNetworks)
      ? settings.depositNetworks
      : DEFAULT_ADMIN_DEPOSIT_NETWORKS
  );

  // Add New Market Form State
  const [showAddMarketForm, setShowAddMarketForm] = useState(false);
  const [newMarketLogoKey, setNewMarketLogoKey] = useState('binance');
  const [newMarketId, setNewMarketId] = useState('BINANCE_PAY');
  const [newMarketCode, setNewMarketCode] = useState('Binance Pay');
  const [newMarketName, setNewMarketName] = useState('Binance Pay (UID / Pay ID)');
  const [newMarketShortLabel, setNewMarketShortLabel] = useState('Binance Pay');
  const [newMarketAddress, setNewMarketAddress] = useState('');
  const [newMarketMinDeposit, setNewMarketMinDeposit] = useState('5');
  const [newMarketEstimatedTime, setNewMarketEstimatedTime] = useState('Instant (~30 sec)');
  const [newMarketConfirmations, setNewMarketConfirmations] = useState('Instant Internal Transfer');
  const [newMarketFeeLabel, setNewMarketFeeLabel] = useState('0 USDT');
  const [newMarketExplorerBase, setNewMarketExplorerBase] = useState('https://www.binance.com/');
  const [isAddingMarket, setIsAddingMarket] = useState(false);
  const [savingMarketId, setSavingMarketId] = useState<string | null>(null);
  const [confirmDeleteMarketId, setConfirmDeleteMarketId] = useState<string | null>(null);

  // Withdrawal address copy & filter states
  const [copiedAddressKey, setCopiedAddressKey] = useState<string | null>(null);
  const [withdrawalAddressSearch, setWithdrawalAddressSearch] = useState('');
  const [withdrawalAddressStatus, setWithdrawalAddressStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (settings) {
      setWalletAddress(settings.usdtBep20Address || '');
      setMinDeposit(settings.minDeposit?.toString() || '10');
      setMinWithdrawal(settings.minWithdrawal?.toString() || '2');
      setFeePercent(settings.withdrawalFeePercent?.toString() || '1.0');
      setReferralPercent(settings.referralCommissionPercent?.toString() || '10');
      setFirstTaskBonusPercent(settings.firstTaskBonusPercent?.toString() || '20');
      if (Array.isArray(settings.depositNetworks)) {
        setDepositNetworks(settings.depositNetworks);
      }
    }
  }, [settings]);

  const handleCopyWithdrawalAddress = async (key: string, address: string) => {
    const ok = await copyTextReliably(address);
    if (ok) {
      setCopiedAddressKey(key);
      addToast('User withdrawal address copied to clipboard!', 'success');
      setTimeout(() => setCopiedAddressKey((prev) => (prev === key ? null : prev)), 2000);
    } else {
      addToast('Unable to copy automatically. Please copy manually.', 'warning');
    }
  };

  // Modal / reject note states
  const [rejectDepId, setRejectDepId] = useState<string | null>(null);
  const [rejectDepReason, setRejectDepReason] = useState('Invalid transaction hash or zero blockchain confirmations');

  const [approveWthId, setApproveWthId] = useState<string | null>(null);
  const [customTxHash, setCustomTxHash] = useState('');

  const [rejectWthId, setRejectWthId] = useState<string | null>(null);
  const [rejectWthReason, setRejectWthReason] = useState('Suspicious multi-account activity');

  const updateNetworkRow = (id: string, patch: Partial<DepositNetworkConfig>) => {
    setDepositNetworks((prev) =>
      prev.map((net) => (net.id === id ? { ...net, ...patch } : net))
    );
  };

  const applyNewMarketPreset = (presetKey: string) => {
    const preset = DEPOSIT_LOGO_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    setNewMarketLogoKey(preset.key);
    setNewMarketId(preset.defaultId);
    setNewMarketCode(preset.defaultCode);
    setNewMarketName(preset.defaultName);
    setNewMarketShortLabel(preset.defaultShortLabel);
    setNewMarketMinDeposit(String(preset.defaultMinDeposit));
    setNewMarketEstimatedTime(preset.defaultEstimatedTime);
    setNewMarketConfirmations(preset.defaultConfirmations);
    setNewMarketFeeLabel(preset.defaultFeeLabel);
    setNewMarketExplorerBase(preset.defaultExplorerTxBase);
  };

  const handleAddNewMarket = async () => {
    if (!newMarketId.trim() || !newMarketName.trim()) {
      addToast('Market ID and name are required.', 'error');
      return;
    }
    if (!newMarketAddress.trim() || newMarketAddress.trim().length < 4) {
      addToast('Please enter a deposit address or account number for the market.', 'error');
      return;
    }
    setIsAddingMarket(true);
    const ok = await addDepositMarket({
      id: newMarketId.trim().toUpperCase(),
      code: newMarketCode.trim() || newMarketId.trim().toUpperCase(),
      name: newMarketName.trim(),
      shortLabel: newMarketShortLabel.trim() || newMarketCode.trim() || newMarketId.trim(),
      logoKey: newMarketLogoKey,
      walletAddress: newMarketAddress.trim(),
      minDeposit: Math.max(0.1, parseFloat(newMarketMinDeposit) || 5),
      estimatedTime: newMarketEstimatedTime.trim() || '~2 min',
      confirmations: newMarketConfirmations.trim() || '1 Confirmation',
      feeLabel: newMarketFeeLabel.trim() || '0 USDT',
      explorerTxBase: newMarketExplorerBase.trim() || 'https://bscscan.com/tx/',
      enabled: true
    });
    setIsAddingMarket(false);
    if (ok) {
      setNewMarketAddress('');
      setShowAddMarketForm(false);
    }
  };

  const handleSaveSingleMarket = async (net: DepositNetworkConfig) => {
    setSavingMarketId(net.id);
    const addr = net.id === 'BEP20' ? walletAddress.trim() : net.walletAddress.trim();
    const minDep = net.id === 'BEP20' ? (parseFloat(minDeposit) || net.minDeposit) : net.minDeposit;
    await updateDepositMarket(net.id, {
      code: net.code,
      name: net.name,
      shortLabel: net.shortLabel,
      logoKey: net.logoKey,
      walletAddress: addr,
      minDeposit: minDep,
      estimatedTime: net.estimatedTime,
      confirmations: net.confirmations,
      feeLabel: net.feeLabel,
      enabled: net.enabled
    });
    setSavingMarketId(null);
  };

  const handleToggleMarketEnabled = async (net: DepositNetworkConfig) => {
    setSavingMarketId(net.id);
    await updateDepositMarket(net.id, { enabled: !net.enabled });
    setSavingMarketId(null);
  };

  const handleDeleteMarket = async (marketId: string) => {
    setSavingMarketId(marketId);
    const ok = await deleteDepositMarket(marketId);
    setSavingMarketId(null);
    if (ok) {
      setConfirmDeleteMarketId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const syncedNetworks = depositNetworks.map((net) =>
      net.id === 'BEP20'
        ? {
            ...net,
            walletAddress: walletAddress.trim() || net.walletAddress,
            minDeposit: parseFloat(minDeposit) || net.minDeposit
          }
        : net
    );
    await updateSettings({
      usdtBep20Address: walletAddress.trim(),
      minDeposit: parseFloat(minDeposit) || 10,
      depositNetworks: syncedNetworks,
      minWithdrawal: parseFloat(minWithdrawal) || 2, // strictly minimum $2
      withdrawalFeePercent: parseFloat(feePercent) || 1.0,
      referralCommissionPercent: parseFloat(referralPercent) || 10,
      firstTaskBonusPercent: parseFloat(firstTaskBonusPercent) || 20
    });
  };

  const handleConfirmRejectDeposit = async () => {
    if (!rejectDepId) return;
    await rejectDeposit(rejectDepId, rejectDepReason);
    setRejectDepId(null);
  };

  const handleConfirmApproveWithdrawal = async () => {
    if (!approveWthId) return;
    await approveWithdrawal(approveWthId, customTxHash.trim() || undefined);
    setApproveWthId(null);
    setCustomTxHash('');
  };

  const handleConfirmRejectWithdrawal = async () => {
    if (!rejectWthId) return;
    await rejectWithdrawal(rejectWthId, rejectWthReason);
    setRejectWthId(null);
  };

  const pendingDeposits = allDeposits.filter(d => d.status === 'pending');
  const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'pending');
  const selectedApproveWithdrawal = approveWthId
    ? allWithdrawals.find((w) => w.id === approveWthId) || null
    : null;

  const filteredWithdrawalAddresses = allWithdrawals.filter((w) => {
    const matchesStatus =
      withdrawalAddressStatus === 'all' || w.status === withdrawalAddressStatus;
    const term = withdrawalAddressSearch.trim().toLowerCase();
    const matchesSearch =
      !term ||
      w.userId.toLowerCase().includes(term) ||
      w.userName.toLowerCase().includes(term) ||
      w.toAddress.toLowerCase().includes(term) ||
      w.id.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <span>Financials & Blockchain Gateway</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Validate BEP-20 transaction hashes, approve withdrawals, and manage global deposit wallet addresses.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex flex-wrap bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto gap-1">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'deposits'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Deposits ({pendingDeposits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'withdrawals'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            <span>Withdrawals ({pendingWithdrawals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders ({allOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'settings'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Markets & Rules</span>
          </button>
        </div>
      </div>

      {/* 1. DEPOSITS QUEUE & HISTORY */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span>Multi-Network USDT Deposits Ledger & Approval Queue</span>
              </h2>
              <span className="text-xs text-amber-400 font-bold tabular-nums">
                {pendingDeposits.length} pending review
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Amount & Network</th>
                    <th className="py-3 px-4">Submitted TxHash (TxID)</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {allDeposits.map((dep) => (
                    <tr key={dep.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{dep.userName}</div>
                        <div className="text-[10px] text-slate-400">{dep.userEmail}</div>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {dep.userId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-black text-emerald-400 text-sm tabular-nums">
                          +${dep.amount.toFixed(2)} USDT
                        </div>
                        <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-amber-300 mt-0.5">
                          <DepositMarketLogo network={dep.network} className="w-3.5 h-3.5 shrink-0" />
                          <span>{dep.network || 'USDT BEP-20'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        <div className="flex items-center space-x-2 bg-slate-950 px-2 py-1 rounded border border-slate-800 max-w-xs truncate">
                          <span className="truncate">{dep.txHash}</span>
                          <a
                            href={getExplorerUrl(dep.network, dep.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:text-amber-300 shrink-0"
                            title="Verify on Explorer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(dep.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                            dep.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : dep.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {dep.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {dep.status === 'pending' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setRejectDepId(dep.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold border border-rose-500/30"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => approveDeposit(dep.id, 'Verified via BscScan')}
                              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. WITHDRAWALS QUEUE & ADDRESS COPY CENTER */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-5">
          {/* DEDICATED USER WITHDRAWAL ADDRESSES COPY SECTION */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-black text-white flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>User Withdrawal Addresses</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Copy any user&apos;s submitted payout wallet address with one tap before releasing funds.
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 self-start sm:self-auto tabular-nums">
                {filteredWithdrawalAddresses.length} address{filteredWithdrawalAddresses.length === 1 ? '' : 'es'}
              </span>
            </div>

            {/* Search & Status Filter */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={withdrawalAddressSearch}
                  onChange={(e) => setWithdrawalAddressSearch(e.target.value)}
                  placeholder="Search by User ID, name, or withdrawal address..."
                  className="w-full min-h-[40px] bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                {withdrawalAddressSearch && (
                  <button
                    type="button"
                    onClick={() => setWithdrawalAddressSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Clear address search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((statusKey) => (
                  <button
                    key={statusKey}
                    type="button"
                    onClick={() => setWithdrawalAddressStatus(statusKey)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all whitespace-nowrap ${
                      withdrawalAddressStatus === statusKey
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {statusKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Address Cards List */}
            {filteredWithdrawalAddresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredWithdrawalAddresses.map((wth) => {
                  const copyKey = `card-${wth.id}`;
                  const isCopied = copiedAddressKey === copyKey;
                  return (
                    <div
                      key={copyKey}
                      className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-2.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-white truncate">{wth.userName}</span>
                            <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0">
                              {wth.userId}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                            Net Payout: <strong className="text-emerald-400">${wth.finalAmount.toFixed(2)} USDT</strong>
                            <span className="text-slate-600 mx-1.5">·</span>
                            <span>{wth.network}</span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase shrink-0 ${
                            wth.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : wth.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {wth.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2">
                        <span className="font-mono text-[11px] text-slate-200 break-all select-all leading-snug">
                          {wth.toAddress}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyWithdrawalAddress(copyKey, wth.toAddress)}
                          className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 shrink-0 transition-colors ${
                            isCopied
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                No user withdrawal addresses match your search.
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span>Withdrawal Requests & Payout Queue</span>
              </h2>
              <span className="text-xs text-emerald-400 font-bold">
                {pendingWithdrawals.length} pending payouts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Gross Amount</th>
                    <th className="py-3 px-4">Fee & Net</th>
                    <th className="py-3 px-4">Target BEP-20 Address</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {allWithdrawals.map((wth) => (
                    <tr key={wth.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{wth.userName}</div>
                        <div className="text-[10px] text-slate-400">{wth.userEmail}</div>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {wth.userId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-rose-400 text-sm">
                        ${wth.amount.toFixed(2)} USDT
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-emerald-400 block">
                          Net: ${wth.finalAmount.toFixed(2)} USDT
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Fee: ${wth.fee.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        <div className="flex items-center space-x-2 bg-slate-950 px-2 py-1 rounded border border-slate-800 max-w-xs">
                          <span className="truncate select-all">{wth.toAddress}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyWithdrawalAddress(`row-${wth.id}`, wth.toAddress)}
                            className={`shrink-0 px-2 py-0.5 rounded font-sans text-[10px] font-bold flex items-center space-x-1 transition-colors ${
                              copiedAddressKey === `row-${wth.id}`
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                            }`}
                            title="Copy withdrawal address"
                          >
                            {copiedAddressKey === `row-${wth.id}` ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedAddressKey === `row-${wth.id}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(wth.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                            wth.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : wth.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {wth.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {wth.status === 'pending' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setRejectWthId(wth.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold border border-rose-500/30"
                            >
                              Reject & Refund
                            </button>
                            <button
                              onClick={() => {
                                setApproveWthId(wth.id);
                                setCustomTxHash(`0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`);
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md"
                            >
                              Approve Payout
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-emerald-400 truncate max-w-[120px]">
                            {wth.txHash ? `Tx: ${wth.txHash.slice(0, 8)}...` : 'Completed'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. PRODUCT ORDERS LEDGER */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
                <span>Live Product Orders & Mining Plans Ledger</span>
              </h2>
              <span className="text-xs text-cyan-400 font-bold tabular-nums">
                {allOrders.length} total order{allOrders.length === 1 ? '' : 's'}
              </span>
            </div>

            {allOrders.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                No product orders have been placed yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Buyer</th>
                      <th className="py-3 px-4">Product & Price</th>
                      <th className="py-3 px-4">Daily Yield & Progress</th>
                      <th className="py-3 px-4">Total Earned</th>
                      <th className="py-3 px-4">Purchased At</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {allOrders.map((ord) => {
                      const buyer = allUsers.find((u) => u.id === ord.userId);
                      return (
                        <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-400 font-bold">
                            {ord.id}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{buyer?.name || 'Member'}</div>
                            <div className="text-[10px] text-slate-400">{ord.userEmail}</div>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">
                              {ord.userId}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{ord.productTitle}</div>
                            <div className="text-[11px] font-black text-amber-400 tabular-nums mt-0.5">
                              ${ord.productPrice.toFixed(2)} USDT
                            </div>
                          </td>

                          <td className="py-3.5 px-4 tabular-nums">
                            <div className="text-emerald-400 font-bold">
                              +${ord.dailyRewardAmount.toFixed(2)} / day
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {ord.daysClaimed} / {ord.durationDays} days claimed
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-black text-emerald-400 tabular-nums">
                            +${ord.totalEarnedFromOrder.toFixed(2)} USDT
                          </td>

                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {new Date(ord.createdAt).toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                                ord.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : ord.status === 'processing'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SETTINGS & RULES CONFIGURATION */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  Blockchain & Deposit Wallet Configuration
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Changing the wallet address automatically updates all user mobile deposit screens and dynamic QR codes in real-time.
                </p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save All Financial Rules</span>
              </button>
            </div>

            {/* Wallet Address */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                USDT Receiving Address (BNB Smart Chain BEP-20)
              </label>
              <input
                type="text"
                required
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Thresholds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">
                  Minimum Deposit (USDT)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={minDeposit}
                  onChange={(e) => setMinDeposit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">
                  Minimum Withdrawal ($2 default)
                </label>
                <input
                  type="number"
                  min="2"
                  step="0.01"
                  required
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">
                  Withdrawal Fee (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  step="0.1"
                  required
                  value={feePercent}
                  onChange={(e) => setFeePercent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">
                  Referral Commission (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.5"
                  required
                  value={referralPercent}
                  onChange={(e) => setReferralPercent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-purple-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Referral Bonus Rules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">
                  First-Task Referral Bonus (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  required
                  value={firstTaskBonusPercent}
                  onChange={(e) => setFirstTaskBonusPercent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Multi-Market Deposit Configuration (Add, Toggle On/Off, Edit Address & Logo, Delete) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <Network className="w-4 h-4 text-amber-400" />
                  <span>Deposit Markets & Address Control</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Add new markets, enable or disable any market, and update addresses and logos.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowAddMarketForm((prev) => !prev)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center space-x-1.5 transition-colors whitespace-nowrap"
                >
                  {showAddMarketForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{showAddMarketForm ? 'Close Form' : 'Add New Market'}</span>
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg flex items-center space-x-1.5 transition-colors whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All</span>
                </button>
              </div>
            </div>

            {/* ADD NEW MARKET FORM */}
            {showAddMarketForm && (
              <div className="rounded-xl bg-slate-950 border border-amber-500/40 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2.5">
                    <DepositMarketLogo logoKey={newMarketLogoKey} className="w-7 h-7 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-amber-400">Add New Deposit Market</h4>
                      <p className="text-[11px] text-slate-400">
                        Choose a preset or enter custom market details and address
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick 1-Click Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Popular Market Presets (1-Click Preset)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DEPOSIT_LOGO_PRESETS.filter(
                      (p) => !depositNetworks.some((existing) => existing.id === p.defaultId)
                    )
                      .slice(0, 10)
                      .map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => applyNewMarketPreset(preset.key)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center space-x-1.5 transition-colors ${
                            newMarketLogoKey === preset.key && newMarketId === preset.defaultId
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <DepositMarketLogo logoKey={preset.key} className="w-4 h-4 shrink-0" />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">
                      Market Logo
                    </label>
                    <div className="flex items-center space-x-2">
                      <DepositMarketLogo logoKey={newMarketLogoKey} className="w-7 h-7 shrink-0" />
                      <select
                        value={newMarketLogoKey}
                        onChange={(e) => setNewMarketLogoKey(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                      >
                        {DEPOSIT_LOGO_PRESETS.map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">
                      Market ID (Unique ID, e.g. TON, BKASH)
                    </label>
                    <input
                      type="text"
                      value={newMarketId}
                      onChange={(e) => setNewMarketId(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                      placeholder="BINANCE_PAY"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">
                      Market Code (Short Code)
                    </label>
                    <input
                      type="text"
                      value={newMarketCode}
                      onChange={(e) => setNewMarketCode(e.target.value)}
                      placeholder="Binance Pay"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">
                      Market Display Name
                    </label>
                    <input
                      type="text"
                      value={newMarketName}
                      onChange={(e) => setNewMarketName(e.target.value)}
                      placeholder="Binance Pay (UID / Pay ID)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">
                      Deposit Wallet Address / Account Number
                    </label>
                    <input
                      type="text"
                      value={newMarketAddress}
                      onChange={(e) => setNewMarketAddress(e.target.value)}
                      placeholder="0x... / T... / Binance Pay ID / 01XXXXXXXXX"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">
                      Minimum Deposit (USDT)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={newMarketMinDeposit}
                      onChange={(e) => setNewMarketMinDeposit(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-white tabular-nums focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">
                      Estimated Time
                    </label>
                    <input
                      type="text"
                      value={newMarketEstimatedTime}
                      onChange={(e) => setNewMarketEstimatedTime(e.target.value)}
                      placeholder="~2 min"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">
                      Fee / Confirmation Label
                    </label>
                    <input
                      type="text"
                      value={newMarketConfirmations}
                      onChange={(e) => setNewMarketConfirmations(e.target.value)}
                      placeholder="1 Confirmation"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddMarketForm(false)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isAddingMarket}
                    onClick={handleAddNewMarket}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingMarket ? 'Adding...' : 'Add Market'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* EXISTING MARKETS LIST */}
            {depositNetworks.length === 0 ? (
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 text-center space-y-2">
                <p className="text-xs font-bold text-slate-300">No deposit markets added yet.</p>
                <p className="text-[11px] text-slate-500">
                  Click the &quot;Add New Market&quot; button above to create a new market.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {depositNetworks.map((net) => {
                  const isBusy = savingMarketId === net.id;
                  return (
                    <div
                      key={net.id}
                      className={`rounded-xl bg-slate-950 border p-4 space-y-3 transition-colors ${
                        net.enabled ? 'border-slate-800' : 'border-rose-500/30 opacity-85'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <DepositMarketLogo network={net} className="w-7 h-7 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-black text-white truncate">{net.name}</span>
                              <span className="text-[11px] text-slate-400 font-mono">({net.id})</span>
                            </div>
                            <span
                              className={`text-[10px] font-bold ${
                                net.enabled ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {net.enabled ? 'Active for Users' : 'Disabled'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleMarketEnabled(net)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 transition-colors ${
                              net.enabled
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{net.enabled ? 'Disable Market' : 'Enable Market'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleSaveSingleMarket(net)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isBusy ? 'Saving...' : 'Save'}</span>
                          </button>

                          {confirmDeleteMarketId === net.id ? (
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleDeleteMarket(net.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteMarketId(null)}
                                className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteMarketId(net.id)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                              title="Delete Market"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">
                            Deposit Address / Account ({net.id})
                          </label>
                          <input
                            type="text"
                            value={net.id === 'BEP20' ? walletAddress : net.walletAddress}
                            onChange={(e) => {
                              if (net.id === 'BEP20') setWalletAddress(e.target.value);
                              updateNetworkRow(net.id, { walletAddress: e.target.value });
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">
                            Market Logo
                          </label>
                          <select
                            value={net.logoKey || ''}
                            onChange={(e) => updateNetworkRow(net.id, { logoKey: e.target.value || undefined })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-[11px] font-bold text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value="">Auto ({net.id})</option>
                            {DEPOSIT_LOGO_PRESETS.map((p) => (
                              <option key={p.key} value={p.key}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">
                            Market Name
                          </label>
                          <input
                            type="text"
                            value={net.name}
                            onChange={(e) => updateNetworkRow(net.id, { name: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">
                            Minimum (USDT)
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={net.id === 'BEP20' ? minDeposit : net.minDeposit}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (net.id === 'BEP20') setMinDeposit(e.target.value);
                              updateNetworkRow(net.id, { minDeposit: val });
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-white tabular-nums focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">
                            Est. Time
                          </label>
                          <input
                            type="text"
                            value={net.estimatedTime}
                            onChange={(e) => updateNetworkRow(net.id, { estimatedTime: e.target.value })}
                            placeholder="~2 min"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      )}

      {/* REJECT DEPOSIT MODAL */}
      {rejectDepId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-rose-400">Reject Deposit Request #{rejectDepId}</h3>
            <p className="text-xs text-slate-300">
              Provide a reason for rejection. This will be visible on the user's mobile deposit ledger.
            </p>
            <textarea
              value={rejectDepReason}
              onChange={(e) => setRejectDepReason(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setRejectDepId(null)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectDeposit}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE WITHDRAWAL MODAL */}
      {approveWthId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-emerald-400">Approve & Release BEP-20 Payout</h3>
            <p className="text-xs text-slate-300">
              Enter the blockchain transaction hash from your wallet, or use the auto-generated BEP-20 transaction hash.
            </p>
            {selectedApproveWithdrawal && (
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-400">User Target Address</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    Net: ${selectedApproveWithdrawal.finalAmount.toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-amber-300 break-all select-all">
                    {selectedApproveWithdrawal.toAddress}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyWithdrawalAddress(
                        `modal-${selectedApproveWithdrawal.id}`,
                        selectedApproveWithdrawal.toAddress
                      )
                    }
                    className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1 transition-colors ${
                      copiedAddressKey === `modal-${selectedApproveWithdrawal.id}`
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    {copiedAddressKey === `modal-${selectedApproveWithdrawal.id}` ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {copiedAddressKey === `modal-${selectedApproveWithdrawal.id}` ? 'Copied' : 'Copy'}
                    </span>
                  </button>
                </div>
              </div>
            )}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Broadcast TxHash:
              </label>
              <input
                type="text"
                value={customTxHash}
                onChange={(e) => setCustomTxHash(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setApproveWthId(null)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproveWithdrawal}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT WITHDRAWAL MODAL */}
      {rejectWthId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-rose-400">Reject Withdrawal & Refund Balance</h3>
            <p className="text-xs text-slate-300">
              Rejecting this request will automatically refund the locked funds back into the user's USDT wallet balance immediately.
            </p>
            <textarea
              value={rejectWthReason}
              onChange={(e) => setRejectWthReason(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setRejectWthId(null)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectWithdrawal}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Confirm & Refund User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
