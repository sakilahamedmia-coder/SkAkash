import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import QRCode from 'qrcode';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Info,
  DollarSign,
  ChevronDown,
  X,
  AlertTriangle,
  Network,
  UserCheck,
  Search,
  RefreshCw
} from 'lucide-react';
import { DepositNetworkConfig } from '../../types';
import { DepositMarketLogo } from '../DepositMarketLogo';
import { VerifiedBadge } from '../VerifiedBadge';
import { VolumeVBadge } from '../VolumeVBadge';
import { PaymentBadgeChip, VerifiedContactChips } from '../PaymentMethodLogos';
import { CountryFlag, getCountryByCode } from '../CountrySelector';

const FALLBACK_DEPOSIT_NETWORKS: DepositNetworkConfig[] = [
  {
    id: 'BEP20',
    code: 'BSC (BEP20)',
    name: 'BNB Smart Chain (BEP20)',
    shortLabel: 'USDT BEP-20',
    walletAddress: '0x71C8A3297a760bF1c0678F45a1fA723c3B08bF49',
    minDeposit: 10,
    estimatedTime: '~2 mins',
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
    estimatedTime: '~3 mins',
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
    estimatedTime: '~5 mins',
    confirmations: '6 Block Confirmations',
    feeLabel: '0 USDT',
    explorerTxBase: 'https://etherscan.io/tx/',
    enabled: true
  }
];

const UsdtLogo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="USDT Tether Logo"
  >
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path
      d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"
      fill="#FFFFFF"
    />
  </svg>
);

export const MobileWallet: React.FC = () => {
  const {
    currentUser,
    settings,
    userDeposits,
    userWithdrawals,
    verifiedAgents,
    fetchVerifiedAgents,
    markNotificationsRead,
    submitDeposit,
    submitWithdrawal,
    addToast,
    setIsAuthModalOpen
  } = useApp();

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'agent'>('deposit');
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('BEP20');
  const [isNetworkSheetOpen, setIsNetworkSheetOpen] = useState<boolean>(false);

  const [depositAmount, setDepositAmount] = useState<string>('25');
  const [txHash, setTxHash] = useState<string>('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState<string>('5');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  const [depositQrUrl, setDepositQrUrl] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState(false);

  const [agentQuery, setAgentQuery] = useState<string>('');
  const [copiedAgentId, setCopiedAgentId] = useState<string | null>(null);
  const [isRefreshingAgents, setIsRefreshingAgents] = useState<boolean>(false);

  const availableNetworks = useMemo<DepositNetworkConfig[]>(() => {
    const rawList =
      Array.isArray(settings?.depositNetworks)
        ? settings.depositNetworks
        : FALLBACK_DEPOSIT_NETWORKS.map((net) =>
            net.id === 'BEP20'
              ? {
                  ...net,
                  logoKey: 'bep20',
                  walletAddress: settings?.usdtBep20Address || net.walletAddress,
                  minDeposit: settings?.minDeposit || net.minDeposit
                }
              : { ...net }
          );
    return rawList.filter((n) => n.enabled);
  }, [settings]);

  const activeNetwork = useMemo<DepositNetworkConfig | null>(() => {
    if (availableNetworks.length === 0) return null;
    return availableNetworks.find((n) => n.id === selectedNetworkId) || availableNetworks[0];
  }, [availableNetworks, selectedNetworkId]);

  useEffect(() => {
    if (availableNetworks.length > 0 && !availableNetworks.some((n) => n.id === selectedNetworkId)) {
      setSelectedNetworkId(availableNetworks[0].id);
    }
  }, [availableNetworks, selectedNetworkId]);

  const activeDepositAddress = activeNetwork?.walletAddress || '';
  const minDeposit = activeNetwork?.minDeposit || settings?.minDeposit || 10;
  const minWithdrawal = settings?.minWithdrawal || 2;
  const feePercent = settings?.withdrawalFeePercent || 1.0;

  // Generate QR for currently selected network deposit address with H error correction for centered USDT logo
  useEffect(() => {
    if (activeDepositAddress) {
      QRCode.toDataURL(activeDepositAddress, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#0B0E11',
          light: '#FFFFFF'
        }
      })
        .then((url) => setDepositQrUrl(url))
        .catch((e) => console.error(e));
    } else {
      setDepositQrUrl('');
    }
  }, [activeDepositAddress]);

  useEffect(() => {
    markNotificationsRead();
  }, [markNotificationsRead]);

  const copyWallet = () => {
    if (!activeDepositAddress || !activeNetwork) return;
    navigator.clipboard.writeText(activeDepositAddress);
    setCopiedAddress(true);
    addToast(`${activeNetwork.shortLabel} address copied!`, 'success');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleSelectNetwork = (net: DepositNetworkConfig) => {
    setSelectedNetworkId(net.id);
    setIsNetworkSheetOpen(false);
    const currentAmt = Number(depositAmount);
    if (!isNaN(currentAmt) && currentAmt < net.minDeposit) {
      setDepositAmount(String(net.minDeposit));
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!activeNetwork) {
      addToast('No deposit market is currently enabled.', 'error');
      return;
    }

    const num = Number(depositAmount);
    if (isNaN(num) || num < minDeposit) {
      addToast(`Minimum deposit on ${activeNetwork.shortLabel} is $${minDeposit} USDT.`, 'error');
      return;
    }

    if (!txHash.trim() || txHash.trim().length < 6) {
      addToast('Please enter a valid Transaction Hash / TrxID / Order ID.', 'error');
      return;
    }

    setIsSubmittingDeposit(true);
    const res = await submitDeposit(num, txHash.trim(), activeNetwork.id);
    setIsSubmittingDeposit(false);

    if (res.success) {
      setTxHash('');
      setActiveTab('deposit');
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const num = Number(withdrawAmount);
    if (isNaN(num) || num < minWithdrawal) {
      addToast(`Minimum withdrawal is $${minWithdrawal} USDT BEP-20.`, 'error');
      return;
    }

    if (currentUser.balance < num) {
      addToast(`Insufficient balance. You have $${currentUser.balance.toFixed(2)} USDT.`, 'error');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(withdrawAddress.trim())) {
      addToast('Invalid BEP-20 address. Must start with 0x and be 42 characters long.', 'error');
      return;
    }

    setIsSubmittingWithdraw(true);
    const res = await submitWithdrawal(num, withdrawAddress.trim());
    setIsSubmittingWithdraw(false);

    if (res.success) {
      setWithdrawAddress('');
    }
  };

  const filteredAgents = useMemo(() => {
    const q = agentQuery.trim().toLowerCase();
    if (!q) return verifiedAgents;
    return verifiedAgents.filter((agent) => {
      const countryName = getCountryByCode(agent.country)?.name?.toLowerCase() || '';
      const countryCode = agent.country?.toLowerCase() || '';
      return (
        agent.name.toLowerCase().includes(q) ||
        agent.id.toLowerCase().includes(q) ||
        countryName.includes(q) ||
        countryCode.includes(q)
      );
    });
  }, [verifiedAgents, agentQuery]);

  const handleCopyAgentId = (agentId: string) => {
    navigator.clipboard.writeText(agentId);
    setCopiedAgentId(agentId);
    addToast(`Agent ID ${agentId} copied!`, 'success');
    setTimeout(() => {
      setCopiedAgentId((prev) => (prev === agentId ? null : prev));
    }, 2000);
  };

  const handleRefreshAgents = async () => {
    setIsRefreshingAgents(true);
    await fetchVerifiedAgents();
    setIsRefreshingAgents(false);
  };

  const numWithdraw = Number(withdrawAmount) || 0;
  const calculatedFee = Number(((numWithdraw * feePercent) / 100).toFixed(2));
  const finalReceive = Math.max(0, Number((numWithdraw - calculatedFee).toFixed(2)));

  return (
    <div className="pb-24 space-y-4 px-3 pt-3">
      {/* 1. BALANCE OVERVIEW CARD */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-amber-400 flex items-center space-x-1.5">
              <UsdtLogo className="w-4 h-4 shrink-0" />
              <span>USDT TetherUS · Multi-Chain</span>
            </span>
            <div className="text-2xl font-black text-white tabular-nums">
              ${currentUser ? currentUser.balance.toFixed(2) : '0.00'}{' '}
              <span className="text-sm font-bold text-amber-400">USDT</span>
            </div>
            <span className="text-[11px] text-slate-400">Available Liquid Balance</span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
            <UsdtLogo className="w-8 h-8" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800">
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Total Deposited</span>
            <span className="text-xs font-black text-emerald-400 tabular-nums">
              ${currentUser ? currentUser.totalDeposited.toFixed(2) : '0.00'} USDT
            </span>
          </div>

          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Total Withdrawn</span>
            <span className="text-xs font-black text-slate-300 tabular-nums">
              ${currentUser ? currentUser.totalWithdrawn.toFixed(2) : '0.00'} USDT
            </span>
          </div>
        </div>
      </div>

      {/* 2. TAB CONTROLS */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'deposit'
              ? 'bg-[#F0B90B] text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          <span>Deposit</span>
        </button>

        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'withdraw'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpFromLine className="w-3.5 h-3.5" />
          <span>Withdraw</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('agent');
            fetchVerifiedAgents();
          }}
          className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'agent'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Agent</span>
        </button>
      </div>

      {/* 3. BINANCE-STYLE DEPOSIT TAB */}
      {activeTab === 'deposit' && (
        <div className="space-y-4">
          {!activeNetwork ? (
            <div className="rounded-2xl bg-[#181A20] border border-[#2B3139] p-6 text-center space-y-2.5 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-[#F0B90B]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-white">Deposit markets are currently disabled</h3>
              <p className="text-xs text-slate-400">
                Markets will appear here once an admin enables a deposit network.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#181A20] border border-[#2B3139] p-4 space-y-4 shadow-xl">
              {/* Binance Asset Header: USDT Logo + Asset Name */}
              <div className="flex items-center justify-between pb-3 border-b border-[#2B3139]">
                <div className="flex items-center space-x-3">
                  <UsdtLogo className="w-9 h-9 shrink-0 shadow-md" />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-base font-black text-white tracking-tight">Deposit USDT</h3>
                      <span className="text-[11px] font-medium text-slate-400">TetherUS</span>
                    </div>
                    <p className="text-[11px] text-[#F0B90B] font-semibold">
                      Multi-Market & Network Deposit
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Minimum</span>
                  <span className="text-xs font-black text-[#F0B90B] tabular-nums">
                    {minDeposit} USDT
                  </span>
                </div>
              </div>

              {/* Network / Market Selection Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                    <Network className="w-3.5 h-3.5 text-[#F0B90B]" />
                    <span>Select Market / Network</span>
                  </span>
                  <span className="text-[10px] text-slate-400 tabular-nums">
                    {availableNetworks.length} markets active
                  </span>
                </div>

                {/* Active Market Dropdown Button WITH Logo */}
                <button
                  type="button"
                  onClick={() => setIsNetworkSheetOpen(true)}
                  className="w-full min-h-[52px] px-3 py-2.5 rounded-xl bg-[#0B0E11] border border-[#2B3139] hover:border-[#F0B90B]/60 transition-colors flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <DepositMarketLogo
                      network={activeNetwork}
                      className="w-8 h-8 shrink-0 rounded-full shadow-sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-white whitespace-nowrap">{activeNetwork.code}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-[11px] text-slate-300 truncate">{activeNetwork.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-2 tabular-nums">
                        <span>Min: {activeNetwork.minDeposit} USDT</span>
                        <span>·</span>
                        <span className="text-emerald-400 font-semibold">Est: {activeNetwork.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#F0B90B] shrink-0" />
                </button>

                {/* Quick 1-Tap Market Switcher WITH Logos */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {availableNetworks.map((net) => {
                    const isSelected = net.id === activeNetwork.id;
                    return (
                      <button
                        key={net.id}
                        type="button"
                        onClick={() => handleSelectNetwork(net)}
                        className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 whitespace-nowrap transition-all border flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-[#F0B90B]/15 text-[#F0B90B] border-[#F0B90B]'
                            : 'bg-[#0B0E11] text-slate-300 border-[#2B3139] hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <DepositMarketLogo network={net} className="w-4 h-4 shrink-0" />
                        <span>{net.id}</span>
                        <span className="text-slate-500">·</span>
                        <span className="tabular-nums text-[10px] opacity-85">{net.minDeposit} USDT</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* QR Code with centered Market / USDT emblem & Wallet address */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#0B0E11] rounded-xl border border-[#2B3139] space-y-3">
                {depositQrUrl && (
                  <div className="relative p-2.5 bg-white rounded-xl shadow-md">
                    <img src={depositQrUrl} alt={`${activeNetwork.name} Deposit QR`} className="w-36 h-36" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="p-1 bg-white rounded-full shadow">
                        <DepositMarketLogo network={activeNetwork} className="w-7 h-7" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="w-full space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <DepositMarketLogo network={activeNetwork} className="w-3.5 h-3.5 shrink-0" />
                      <span>Deposit Address ({activeNetwork.code})</span>
                    </span>
                    <span className="text-emerald-400 font-semibold">{activeNetwork.estimatedTime}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-[#181A20] border border-[#2B3139] rounded-xl px-3 py-2">
                    <span className="text-[11px] font-mono text-white break-all flex-1 leading-relaxed">
                      {activeDepositAddress}
                    </span>
                    <button
                      type="button"
                      onClick={copyWallet}
                      className="min-w-[40px] min-h-[40px] rounded-lg bg-[#F0B90B]/15 hover:bg-[#F0B90B]/25 text-[#F0B90B] transition-colors shrink-0 flex items-center justify-center"
                      title="Copy Address"
                    >
                      {copiedAddress ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Binance-style Market Parameters Summary */}
              <div className="rounded-xl bg-[#0B0E11] border border-[#2B3139] divide-y divide-[#2B3139] text-xs">
                <div className="flex items-center justify-between px-3 py-2.5 gap-2">
                  <span className="text-slate-400">Market / Network</span>
                  <span className="font-bold text-white flex items-center space-x-1.5 text-right">
                    <DepositMarketLogo network={activeNetwork} className="w-4 h-4 shrink-0" />
                    <span>{activeNetwork.name}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-slate-400">Minimum Deposit</span>
                  <span className="font-black text-[#F0B90B] tabular-nums">{minDeposit.toFixed(2)} USDT</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Estimated Arrival</span>
                  </span>
                  <span className="font-bold text-emerald-400">{activeNetwork.estimatedTime}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-slate-400">Confirmations & Fee</span>
                  <span className="font-medium text-slate-200">
                    {activeNetwork.confirmations} · Fee: {activeNetwork.feeLabel}
                  </span>
                </div>
              </div>

              {/* Network Notice */}
              <div className="bg-[#F0B90B]/10 border border-[#F0B90B]/30 rounded-xl p-3 text-[11px] text-amber-200 space-y-1">
                <p className="font-bold flex items-center space-x-1.5 text-[#F0B90B]">
                  <DepositMarketLogo network={activeNetwork} className="w-4 h-4 shrink-0" />
                  <span>Important Notice ({activeNetwork.code}):</span>
                </p>
                <p>
                  1. Please send funds only via the <strong className="text-white">{activeNetwork.name}</strong> market/network. Sending through a wrong network will not be credited.
                </p>
                <p>
                  2. Minimum deposit is <strong className="text-[#F0B90B] tabular-nums">{minDeposit} USDT</strong> and estimated arrival is <strong className="text-emerald-400">{activeNetwork.estimatedTime}</strong>.
                </p>
                <p>3. After transferring, submit your TxHash / TrxID and amount below.</p>
              </div>

              {/* Submission Form */}
              <form onSubmit={handleDepositSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Deposit Amount (USDT) — Minimum {minDeposit} USDT
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min={minDeposit}
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      required
                      placeholder={`Min ${minDeposit} USDT`}
                      className="w-full min-h-[44px] bg-[#0B0E11] border border-[#2B3139] rounded-xl pl-9 pr-3 py-2 text-xs text-white tabular-nums placeholder-slate-500 focus:outline-none focus:border-[#F0B90B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Transaction ID / Hash (TxID / TrxID / Order ID)
                  </label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    required
                    placeholder={
                      activeNetwork.id === 'TRC20'
                        ? 'Enter TRC-20 TxID...'
                        : activeNetwork.id === 'SOL'
                        ? 'Enter Solana Signature / TxID...'
                        : activeNetwork.id.includes('BKASH') || activeNetwork.id.includes('NAGAD')
                        ? 'Enter TrxID...'
                        : activeNetwork.id.includes('BINANCE') || activeNetwork.id.includes('BYBIT') || activeNetwork.id.includes('OKX')
                        ? 'Enter Order ID / Internal TxID...'
                        : 'e.g. 0x3a9b1c7849f283d8e901bca293847fec...'
                    }
                    className="w-full min-h-[44px] bg-[#0B0E11] border border-[#2B3139] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#F0B90B]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingDeposit}
                  className="w-full min-h-[48px] py-2.5 rounded-xl bg-[#F0B90B] hover:bg-[#FCD535] disabled:opacity-50 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/15 transition-all flex items-center justify-center space-x-2"
                >
                  <DepositMarketLogo network={activeNetwork} className="w-4 h-4 shrink-0" />
                  <span>
                    {isSubmittingDeposit
                      ? 'Submitting...'
                      : `Submit ${activeNetwork.shortLabel} Deposit`}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* User's Deposit Requests Status */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 px-1">
              Your Deposit History
            </h4>
            {userDeposits.length > 0 ? (
              <div className="space-y-2">
                {userDeposits.map((dep) => (
                  <div
                    key={dep.id}
                    className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-1.5 text-xs shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DepositMarketLogo network={dep.network} className="w-5 h-5 shrink-0" />
                        <span className="font-extrabold text-white text-sm tabular-nums">
                          +${dep.amount.toFixed(2)} USDT
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-bold ${
                          dep.status === 'approved'
                            ? 'text-emerald-400'
                            : dep.status === 'pending'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {dep.status.toUpperCase()} · {dep.network || 'USDT BEP-20'}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      Tx: {dep.txHash}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>{new Date(dep.createdAt).toLocaleString()}</span>
                      {dep.notes && <span className="text-slate-300 truncate max-w-[160px]">{dep.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-500">
                No deposits submitted yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* BINANCE-STYLE CHOOSE MARKET / NETWORK BOTTOM SHEET / MODAL */}
      {isNetworkSheetOpen && activeNetwork && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center pt-safe px-safe sm:p-4"
          onClick={() => setIsNetworkSheetOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#181A20] border-t sm:border border-[#2B3139] rounded-t-3xl sm:rounded-2xl p-4 pb-[max(1.5rem,var(--app-inset-bottom))] space-y-3 shadow-2xl max-h-[82vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-1 sm:hidden" />
            <div className="flex items-center justify-between pb-2 border-b border-[#2B3139]">
              <div className="flex items-center space-x-2.5">
                <UsdtLogo className="w-6 h-6" />
                <div>
                  <h3 className="text-sm font-black text-white">Choose Deposit Market</h3>
                  <p className="text-[10px] text-slate-400">
                    Select your preferred market and network for depositing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNetworkSheetOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-xl bg-[#2B3139]/60 hover:bg-[#2B3139] text-slate-300 flex items-center justify-center"
                aria-label="Close market selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-2.5 text-[11px] text-slate-300 flex items-start space-x-2">
              <Info className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
              <span>
                Make sure your sending wallet or market matches the exact market and network selected here.
              </span>
            </div>

            <div className="space-y-2">
              {availableNetworks.map((net) => {
                const isSelected = net.id === activeNetwork.id;
                return (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => handleSelectNetwork(net)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#F0B90B]/10 border-[#F0B90B]'
                        : 'bg-[#0B0E11] border-[#2B3139] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <DepositMarketLogo
                        network={net}
                        className="w-9 h-9 shrink-0 rounded-full shadow-sm"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-white">{net.code}</span>
                          <span className="text-[11px] text-slate-400 truncate">{net.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums">
                          <span>
                            Min Deposit: <strong className="text-[#F0B90B]">{net.minDeposit} USDT</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Est. Time: <strong className="text-emerald-400">{net.estimatedTime}</strong>
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {net.confirmations} · Fee: {net.feeLabel}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#F0B90B] border-[#F0B90B] text-slate-950'
                          : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. WITHDRAW TAB */}
      {activeTab === 'withdraw' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Withdraw USDT (BEP-20)
                </h3>
                <span className="text-[10px] text-emerald-400">Direct BSC Settlement</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Minimum: ${minWithdrawal} USDT
              </span>
            </div>

            {/* Balance check */}
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Available to Withdraw</span>
                <span className="text-base font-black text-amber-400">
                  ${currentUser ? currentUser.balance.toFixed(2) : '0.00'} USDT
                </span>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawAmount(currentUser ? currentUser.balance.toString() : '0')}
                className="text-[11px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-colors"
              >
                Max Amount
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Recipient USDT BEP-20 Address
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  required
                  placeholder="0x... (BNB Smart Chain BEP-20)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Withdrawal Amount (USDT)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min={minWithdrawal}
                    max={currentUser?.balance || 10000}
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    placeholder={`Min ${minWithdrawal}`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Fee & Calculation Summary */}
              <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Network Gas & Security Fee ({feePercent}%):</span>
                  <span>${calculatedFee.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800/80">
                  <span>You Will Receive:</span>
                  <span className="text-emerald-400 font-extrabold">${finalReceive.toFixed(2)} USDT</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingWithdraw || !currentUser || currentUser.balance < minWithdrawal}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-50 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1.5"
              >
                <span>{isSubmittingWithdraw ? 'Processing...' : 'Submit Withdrawal Request'}</span>
              </button>
            </form>
          </div>

          {/* User's Withdrawal Requests Status */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
              Your Withdrawal Submissions
            </h4>
            {userWithdrawals.length > 0 ? (
              <div className="space-y-2">
                {userWithdrawals.map((wth) => (
                  <div
                    key={wth.id}
                    className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-1.5 text-xs shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-sm">
                        -${wth.amount.toFixed(2)} USDT
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          wth.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : wth.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {wth.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      To: {wth.toAddress}
                    </div>

                    {wth.txHash && (
                      <div className="text-[10px] font-mono text-emerald-400 truncate">
                        TxID: {wth.txHash}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>{new Date(wth.createdAt).toLocaleString()}</span>
                      <span>Fee: ${wth.fee.toFixed(2)} USDT</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-500">
                No withdrawals requested yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. VERIFIED AGENTS TAB */}
      {activeTab === 'agent' && (
        <div className="space-y-3">
          {/* Header Banner */}
          <div className="rounded-2xl bg-[#181A20] border border-[#2B3139] p-4 space-y-3 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-sm font-black text-white">Verified Agents</h3>
                    <VerifiedBadge size="sm" variant="colorful" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Official admin-verified users for P2P &amp; deposit assistance
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefreshAgents}
                disabled={isRefreshingAgents}
                className="min-w-[36px] min-h-[36px] rounded-xl bg-[#0B0E11] border border-[#2B3139] hover:border-sky-500/50 text-slate-300 hover:text-sky-400 flex items-center justify-center transition-colors shrink-0"
                title="Refresh Verified Agents"
                aria-label="Refresh Verified Agents"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingAgents ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>

            {/* Quick Search + Verified Count */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                  placeholder="Search by agent name or User ID..."
                  className="w-full min-h-[40px] bg-[#0B0E11] border border-[#2B3139] rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                {agentQuery && (
                  <button
                    type="button"
                    onClick={() => setAgentQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="px-2.5 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-[11px] font-bold text-sky-300 tabular-nums shrink-0">
                {verifiedAgents.length} Verified
              </div>
            </div>
          </div>

          {/* Verified Agents List */}
          {filteredAgents.length > 0 ? (
            <div className="space-y-3">
              {filteredAgents.map((agent) => {
                const hasContacts = Boolean(agent.whatsappNumber || agent.telegramLink);
                return (
                  <div
                    key={agent.id}
                    className="rounded-2xl bg-[#181A20] border border-[#2B3139] p-4 space-y-3 shadow-lg"
                  >
                    {/* Agent Identity Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-sky-400/70 bg-slate-900"
                          />
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#181A20]"
                            title="Active Verified Agent"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="text-sm font-black text-white truncate">
                              {agent.name}
                            </span>
                            <VerifiedBadge size="sm" variant="colorful" />
                            {agent.isVerified && agent.country && (
                              <span title={getCountryByCode(agent.country)?.name || agent.country}>
                                <CountryFlag code={agent.country} className="w-5 h-3.5" />
                              </span>
                            )}
                            {agent.hasVolumeVBadge && <VolumeVBadge size="sm" />}
                          </div>

                          <div className="flex items-center space-x-2 mt-1">
                            <button
                              type="button"
                              onClick={() => handleCopyAgentId(agent.id)}
                              className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-[#0B0E11] border border-[#2B3139] hover:border-sky-500/50 text-[10px] font-mono font-bold text-slate-300 transition-colors"
                              title="Copy Agent User ID"
                            >
                              <span>ID: {agent.id}</span>
                              {copiedAgentId === agent.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                            <span className="text-[10px] font-semibold text-emerald-400">
                              Admin Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="pt-2.5 border-t border-[#2B3139] space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Accepted Payment Methods
                      </span>
                      {agent.paymentBadges.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {agent.paymentBadges.map((method) => (
                            <PaymentBadgeChip key={method} method={method} compact />
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          No payment badges configured yet.
                        </p>
                      )}
                    </div>

                    {/* Contact Buttons (WhatsApp / Telegram) */}
                    <div className="pt-2.5 border-t border-[#2B3139] space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Direct Agent Contact
                      </span>
                      {hasContacts ? (
                        <div className="flex flex-wrap gap-2">
                          <VerifiedContactChips
                            whatsappNumber={agent.whatsappNumber}
                            telegramLink={agent.telegramLink}
                            compact
                            showMessageHint
                          />
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          Contact handle not added by agent yet.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#181A20] border border-[#2B3139] p-8 text-center space-y-2 shadow-md">
              <div className="w-11 h-11 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-white">
                {agentQuery ? 'No matching verified agents found' : 'No verified agents available yet'}
              </h4>
              <p className="text-[11px] text-slate-400 max-w-[260px] mx-auto">
                {agentQuery
                  ? 'Try clearing your search or entering another agent name or User ID.'
                  : 'Accounts verified by an Admin will appear automatically in this directory.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
