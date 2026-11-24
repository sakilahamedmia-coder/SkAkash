import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Product,
  Order,
  DepositRequest,
  WithdrawalRequest,
  Transaction,
  ReferralRecord,
  ReferralTrackingEvent,
  ReferralTrackingStats,
  RewardTask,
  ClaimHistoryItem,
  Banner,
  VideoBanner,
  SystemSettings,
  DepositNetworkConfig,
  PaymentMethodBadge,
  PublicUserProfile,
  VerifiedAgent,
  AdminStats,
  NotificationLog,
  CompanyLicenseDocument,
  CompanyProfileInfo
} from '../src/types.js';
import { resolveAbsoluteApkUrl, normalizeReferralCodeInput } from '../src/utils/publicUrl.js';

const ALLOWED_PAYMENT_BADGES: PaymentMethodBadge[] = [
  'bkash',
  'nagad',
  'rocket',
  'upay',
  'phonepe',
  'gpay',
  'paytm',
  'upi',
  'esewa',
  'khalti',
  'imepay',
  'binance',
  'crypto'
];

function sanitizeWhatsappNumber(raw: unknown): string {
  const input = String(raw ?? '').trim();
  if (!input) return '';
  const strippedUrl = input.replace(/^https?:\/\/(api\.whatsapp\.com\/send\?phone=|wa\.me\/)/i, '').replace(/^wa\.me\//i, '');
  const compact = strippedUrl.replace(/[\s()-]/g, '');
  const hasPlus = compact.startsWith('+');
  const digits = compact.replace(/[^0-9]/g, '');
  if (digits.length < 6 || digits.length > 16 || !/^\+?[0-9]+$/.test(compact)) {
    throw new Error('Please enter a valid WhatsApp number (e.g. +88017XXXXXXXX).');
  }
  return hasPlus ? `+${digits}` : `+${digits}`;
}

function sanitizeTelegramLink(raw: unknown): string {
  const input = String(raw ?? '').trim();
  if (!input) return '';
  let cleaned = input
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '')
    .replace(/^(t\.me|telegram\.me)\//i, '')
    .replace(/^@+/, '')
    .split(/[?#]/)[0]
    .replace(/\/+$/, '')
    .trim();
  if (!/^(\+[A-Za-z0-9_-]{8,32}|[A-Za-z0-9_]{3,32})$/.test(cleaned)) {
    throw new Error('Please enter a valid Telegram username or link (e.g. @username or https://t.me/username).');
  }
  return `https://t.me/${cleaned}`;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'database.json');
const DEFAULT_ADMIN_PASSWORD = '55664411Aa';
export const VOLUME_VBADGE_THRESHOLD = 2000;

const DB_TMP_FILE = path.resolve(DB_DIR, 'database.json.tmp');

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  orders: Order[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  transactions: Transaction[];
  referrals: ReferralRecord[];
  referralEvents: ReferralTrackingEvent[];
  referralTrackingTotals?: Record<string, { linkClicks: number; apkDownloads: number }>;
  claims: ClaimHistoryItem[];
  banners: Banner[];
  videoBanners: VideoBanner[];
  tasks: RewardTask[];
  settings: SystemSettings;
  auditLogs: { id: string; action: string; details: string; timestamp: string }[];
  notificationLogs: NotificationLog[];
  adminPassword: string;
  adminTokens: string[];
  adminTokenOwners?: Record<string, string>;
}

const DEFAULT_DEPOSIT_NETWORKS: DepositNetworkConfig[] = [
  {
    id: 'BEP20',
    code: 'BSC (BEP20)',
    name: 'BNB Smart Chain (BEP20)',
    shortLabel: 'USDT BEP-20',
    logoKey: 'bep20',
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
    logoKey: 'trc20',
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
    logoKey: 'sol',
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
    logoKey: 'polygon',
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
    logoKey: 'erc20',
    walletAddress: '0x71C8A3297a760bF1c0678F45a1fA723c3B08bF49',
    minDeposit: 20,
    estimatedTime: '~5 mins',
    confirmations: '6 Block Confirmations',
    feeLabel: '0 USDT',
    explorerTxBase: 'https://etherscan.io/tx/',
    enabled: true
  }
];

const DEFAULT_COMPANY_INFO: CompanyProfileInfo = {
  companyName: 'CryptoEarnGo Global Technologies Ltd.',
  registrationNumber: 'CEG-REG-2024-88412',
  jurisdiction: 'Singapore · ACRA Registered FinTech Entity',
  foundedYear: '2024',
  headquarters: '10 Marina Boulevard, Marina Bay Financial Centre, Singapore',
  officialEmail: 'support@cryptoearngo.com',
  officialWebsite: 'https://cryptoearngo.com',
  description:
    'CryptoEarnGo is a transparent Web3 cloud compute and USDT reward ecosystem operating automated BEP-20 settlements, verified partner payouts, and 24/7 user support.',
  licenses: []
};

const DEFAULT_SETTINGS: SystemSettings = {
  usdtBep20Address: '0x71C8A3297a760bF1c0678F45a1fA723c3B08bF49',
  minDeposit: 10,
  depositNetworks: DEFAULT_DEPOSIT_NETWORKS,
  minWithdrawal: 2, // Strictly requested $2 min
  withdrawalFeePercent: 1.0,
  referralCommissionPercent: 10,
  firstTaskBonusPercent: 20,
  dailyClaimEnabled: true,
  dailyClaimTitle: 'Daily Claim Bonus',
  dailyClaimDescription: 'Collect your guaranteed daily USDT reward every 24 hours.',
  claimIntervalMinutes: 1440, // 24 hours
  claimRewardAmount: 0.5,
  whatsappLink: 'https://wa.me/15557892345',
  telegramLink: 'https://t.me/CryptoEarnGo_Official',
  appVersion: 'v2.4.1',
  apkDownloadUrl: resolveAbsoluteApkUrl('/downloads/CryptoEarnGo-v2.4.1.apk', 'v2.4.1'),
  apkReleaseNotes: 'Release v2.4.1: Instant USDT BEP-20 validator, ultra-smooth UI animations, and improved real-time account sync.',
  forceUpdate: false,
  announcement: '🚀 Welcome to CryptoEarnGo! USDT multi-network deposits & withdrawals operate 24/7 with instant synchronization.',
  maintenanceMode: false,
  companyInfo: DEFAULT_COMPANY_INFO
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'Antminer Cloud Hashrate 10TH/s',
    description: 'High-efficiency BEP20 cloud compute node bundle with automated daily earning claims for 30 days.',
    price: 25,
    dailyRewardAmount: 1.25,
    durationDays: 30,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    category: 'Mining Node',
    stock: 85,
    isAvailable: true,
    features: ['10 TH/s Hashrate', 'Daily Claim for 30 Days', '24/7 Node Uptime', 'Instant BEP20 Settlement'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'prod-2',
    title: 'Crypto Trading Mastercourse & VIP Signals',
    description: '30-day active VIP signal package with daily USDT loyalty earnings and risk-management strategies.',
    price: 15,
    dailyRewardAmount: 0.75,
    durationDays: 30,
    image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80',
    category: 'Education',
    stock: 190,
    isAvailable: true,
    features: ['Telegram VIP Group Access', '30-Day Daily Earning', 'Risk Management Formulas', 'Live Masterclasses'],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'prod-3',
    title: 'Titan Cold Hardware Key Card',
    description: 'Ultra-secure biometric NFC hardware card with 30-day daily security staking rewards.',
    price: 49,
    dailyRewardAmount: 2.5,
    durationDays: 30,
    image: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=800&q=80',
    category: 'Security',
    stock: 42,
    isAvailable: true,
    features: ['EAL6+ Secure Element', 'Daily Earning for 30 Days', 'Waterproof Titanium Alloy', 'Air-Gapped Signing'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'prod-4',
    title: 'DeFi Automated Arbitrage Bot Access',
    description: 'Algorithmic smart-contract scanner for BNB Chain with 30-day daily claimable profit share.',
    price: 35,
    dailyRewardAmount: 1.75,
    durationDays: 30,
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
    category: 'Software',
    stock: 110,
    isAvailable: true,
    features: ['Sub-Second Arbitrage Detection', '30-Day Active Yield', 'Custom Gas Multiplier', 'Real-time Telegram Alerts'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'prod-5',
    title: 'VIP Ambassador Tier',
    description: 'High-yield ambassador package with 30 days of premium daily USDT rewards and zero fees.',
    price: 75,
    dailyRewardAmount: 3.75,
    durationDays: 30,
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    category: 'VIP Club',
    stock: 18,
    isAvailable: true,
    features: ['20% Referral Commission', '30-Day Daily Rewards', 'Zero Platform Withdrawal Fees', 'Exclusive Partner Airdrops'],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const INITIAL_BANNERS: Banner[] = [
  {
    id: 'ban-1',
    title: 'Earn USDT Daily with CryptoEarnGo',
    subtitle: 'Transparent activities & instant BEP-20 network payouts',
    imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1200&q=80',
    badge: 'HOT EARNING',
    linkUrl: '/referrals'
  },
  {
    id: 'ban-2',
    title: 'Invite Friends, Earn 10% Commission',
    subtitle: 'Automated instant referral rewards on every purchase',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
    badge: 'LIFETIME COMMISSION',
    linkUrl: '/referrals'
  },
  {
    id: 'ban-3',
    title: 'Low Minimum Withdrawal: Just $2',
    subtitle: 'Direct USDT settlement to your BEP-20 address within minutes',
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=1200&q=80',
    badge: 'FAST PAYOUT',
    linkUrl: '/wallet'
  }
];

const INITIAL_VIDEO_BANNERS: VideoBanner[] = [
  {
    id: 'vid-1',
    title: 'Getting Started: Deposit & Claim USDT',
    description: 'Learn how to submit your BEP-20 transaction ID and claim daily rewards on Android.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80',
    duration: '1:45'
  },
  {
    id: 'vid-2',
    title: 'Understanding BEP-20 Low Fee Network',
    description: 'Why BNB Smart Chain powers lightning-fast, ultra-low gas fee transactions.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    duration: '2:15'
  }
];

const INITIAL_TASKS: RewardTask[] = [
  {
    id: 'task-hourly',
    title: 'Hourly Energy Claim',
    description: 'Activate your active cloud node and claim your hourly loyalty reward.',
    rewardAmount: 0.25,
    cooldownMinutes: 60,
    iconName: 'Clock',
    category: 'daily',
    actionText: 'Claim Reward'
  },
  {
    id: 'task-daily',
    title: 'Daily Market Check-In',
    description: 'Log in daily to maintain your loyalty streak and earn a bonus.',
    rewardAmount: 0.50,
    cooldownMinutes: 1440,
    iconName: 'CalendarCheck',
    category: 'daily',
    actionText: 'Check-In'
  },
  {
    id: 'task-telegram',
    title: 'Join Official Telegram Community',
    description: 'Join thousands of members for real-time announcements and community tips.',
    rewardAmount: 0.75,
    cooldownMinutes: 0,
    iconName: 'Send',
    category: 'social',
    actionUrl: 'https://t.me/CryptoEarnGo_Official',
    actionText: 'Join & Claim'
  },
  {
    id: 'task-quiz',
    title: 'Crypto Security Knowledge Quiz',
    description: 'Complete 3 quick questions about private key and phishing safety.',
    rewardAmount: 0.60,
    cooldownMinutes: 720,
    iconName: 'GraduationCap',
    category: 'learning',
    actionText: 'Take Quiz'
  },
  {
    id: 'task-share',
    title: 'Share Referral Link on WhatsApp',
    description: 'Broadcast your invitation code to friends or social groups.',
    rewardAmount: 0.35,
    cooldownMinutes: 720,
    iconName: 'Share2',
    category: 'social',
    actionText: 'Share Link'
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'CEG-882941',
    name: 'Alex Morgan',
    email: 'demo@cryptoearngo.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    balance: 48.50,
    totalEarned: 63.50,
    totalDeposited: 50.00,
    totalWithdrawn: 15.00,
    referralCode: 'CEG882',
    referralEarnings: 8.50,
    referralCount: 3,
    status: 'active',
    isVerified: true,
    paymentBadges: ['bkash', 'nagad', 'crypto', 'binance'],
    whatsappNumber: '+8801711000882',
    telegramLink: 'https://t.me/alexmorgan_ceg',
    notificationPrefs: { pushEnabled: true },
    role: 'user',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'CEG-109432',
    name: 'Sarah Connor',
    email: 'sarah.k@cryptoearngo.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    balance: 14.20,
    totalEarned: 14.20,
    totalDeposited: 20.00,
    totalWithdrawn: 5.80,
    referralCode: 'CEG109',
    referredBy: 'CEG-882941',
    referralEarnings: 2.00,
    referralCount: 1,
    status: 'active',
    isVerified: false,
    role: 'user',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    lastLoginAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'CEG-994102',
    name: 'Suspicious Trader',
    email: 'badactor@cryptoearngo.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    balance: 0.00,
    totalEarned: 0.00,
    totalDeposited: 0.00,
    totalWithdrawn: 0.00,
    referralCode: 'CEG994',
    referralEarnings: 0,
    referralCount: 0,
    status: 'banned',
    banReason: 'Submitting forged transaction hashes and duplicate accounts.',
    role: 'user',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    lastLoginAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const INITIAL_DEPOSITS: DepositRequest[] = [
  {
    id: 'dep-101',
    userId: 'CEG-882941',
    userName: 'Alex Morgan',
    userEmail: 'demo@cryptoearngo.com',
    amount: 50,
    txHash: '0x3a9b1c7849f283d8e901bca293847fec0912ab84736291bcde09283746a5b1c2',
    network: 'USDT BEP-20',
    walletAddress: '0x71C8A3297a760bF1c0678F45a1fA723c3B08bF49',
    status: 'approved',
    notes: 'Verified on BSC Explorer block #34891022',
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    processedAt: new Date(Date.now() - 86400000 * 9 + 600000).toISOString()
  },
  {
    id: 'dep-102',
    userId: 'CEG-109432',
    userName: 'Sarah Connor',
    userEmail: 'sarah.k@cryptoearngo.com',
    amount: 20,
    txHash: '0x88f12a938c4b7210984de28a19234bbcf90827361a72093846152019bca84729',
    network: 'USDT BEP-20',
    walletAddress: '0x71C8A3297a760bF1c0678F45a1fA723c3B08bF49',
    status: 'approved',
    notes: 'Approved instantly via BEP-20 scanner',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    processedAt: new Date(Date.now() - 86400000 * 5 + 300000).toISOString()
  },
  {
    id: 'dep-103',
    userId: 'CEG-882941',
    userName: 'Alex Morgan',
    userEmail: 'demo@cryptoearngo.com',
    amount: 25,
    txHash: '0xbc940283746a5b1c23a9b1c7849f283d8e901bca293847fec0912ab84736291a',
    network: 'USDT BEP-20',
    walletAddress: '0x71C8A3297a760bF1c0678F45a1fA723c3B08bF49',
    status: 'pending',
    notes: 'Awaiting admin verification',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'wth-201',
    userId: 'CEG-882941',
    userName: 'Alex Morgan',
    userEmail: 'demo@cryptoearngo.com',
    amount: 15,
    network: 'USDT BEP-20',
    toAddress: '0x99A46b1E834a36283C0123984E019bA0294Cbe01',
    fee: 0.15,
    finalAmount: 14.85,
    status: 'approved',
    txHash: '0x6e284910bca93847fec0912ab84736291bcde09283746a5b1c23a9b1c7849f28',
    notes: 'Processed successfully to user external BEP-20 wallet',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    processedAt: new Date(Date.now() - 86400000 * 4 + 1800000).toISOString()
  },
  {
    id: 'wth-202',
    userId: 'CEG-109432',
    userName: 'Sarah Connor',
    userEmail: 'sarah.k@cryptoearngo.com',
    amount: 6,
    network: 'USDT BEP-20',
    toAddress: '0x22cB18a892bA49821730B247a329F640274Ab893',
    fee: 0.20,
    finalAmount: 5.80,
    status: 'pending',
    notes: 'Waiting for Admin approval queue',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    userId: 'CEG-882941',
    type: 'deposit',
    amount: 50,
    balanceAfter: 50,
    description: 'Deposit approved (USDT BEP-20)',
    status: 'completed',
    referenceId: 'dep-101',
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString()
  },
  {
    id: 'tx-2',
    userId: 'CEG-882941',
    type: 'purchase',
    amount: -15,
    balanceAfter: 35,
    description: 'Purchased "Crypto Trading Mastercourse & VIP Signals"',
    status: 'completed',
    referenceId: 'ord-101',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 'tx-3',
    userId: 'CEG-882941',
    type: 'referral_commission',
    amount: 2.0,
    balanceAfter: 37,
    description: '10% Referral Commission from Sarah Connor (CEG-109432)',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'tx-4',
    userId: 'CEG-882941',
    type: 'reward_claim',
    amount: 0.25,
    balanceAfter: 37.25,
    description: 'Claimed Hourly Energy Reward',
    status: 'completed',
    referenceId: 'task-hourly',
    createdAt: new Date(Date.now() - 86400000 * 4 - 3600000).toISOString()
  },
  {
    id: 'tx-5',
    userId: 'CEG-882941',
    type: 'withdrawal',
    amount: -15,
    balanceAfter: 22.25,
    description: 'Withdrawal to 0x99A4...be01 (USDT BEP-20)',
    status: 'completed',
    referenceId: 'wth-201',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'tx-6',
    userId: 'CEG-882941',
    type: 'reward_claim',
    amount: 0.50,
    balanceAfter: 22.75,
    description: 'Daily Check-in Reward',
    status: 'completed',
    referenceId: 'task-daily',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'tx-7',
    userId: 'CEG-882941',
    type: 'deposit',
    amount: 25.75,
    balanceAfter: 48.50,
    description: 'Deposit approved (USDT BEP-20)',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    userId: 'CEG-882941',
    userEmail: 'demo@cryptoearngo.com',
    productId: 'prod-2',
    productTitle: 'Crypto Trading Mastercourse & VIP Signals',
    productPrice: 15,
    dailyRewardAmount: 0.75,
    durationDays: 30,
    daysClaimed: 0,
    totalEarnedFromOrder: 0,
    expiresAt: new Date(Date.now() + 86400000 * 23).toISOString(),
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

const INITIAL_REFERRALS: ReferralRecord[] = [
  {
    id: 'ref-1',
    referrerId: 'CEG-882941',
    referredUserId: 'CEG-109432',
    referredUserName: 'Sarah Connor',
    commissionEarned: 2.0,
    firstTaskCompleted: false,
    firstTaskBonusEarned: 0,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
  }
];

const INITIAL_CLAIMS: ClaimHistoryItem[] = [
  {
    id: 'clm-2',
    userId: 'CEG-882941',
    taskId: 'daily-claim',
    taskTitle: 'Daily Claim Bonus',
    rewardAmount: 0.50,
    claimedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

class DatabaseManager {
  private data: DatabaseSchema;
  private sseClients: Set<(event: string, data: any) => void> = new Set();
  private txNotificationHandler?: (tx: Transaction, user: User) => void | Promise<void>;
  private userByIdMap: Map<string, User> = new Map();
  private userByEmailMap: Map<string, User> = new Map();
  private userByRefCodeMap: Map<string, User> = new Map();
  private referralsByReferrerMap: Map<string, Map<string, ReferralRecord>> = new Map();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private writeInFlight = false;
  private writePending = false;
  private isDirty = false;

  constructor() {
    this.ensureDirExists();
    this.data = this.loadData();
    this.rebuildIndexes();
    this.syncAllUsersVolumeVBadge();

    if (typeof process !== 'undefined' && typeof process.once === 'function') {
      const flushOnExit = () => {
        this.flushSync();
      };
      process.once('beforeExit', flushOnExit);
      process.once('SIGINT', () => {
        this.flushSync();
        process.exit(0);
      });
      process.once('SIGTERM', () => {
        this.flushSync();
        process.exit(0);
      });
    }
  }

  private makeUniqueId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
  }

  private rebuildIndexes() {
    this.userByIdMap.clear();
    this.userByEmailMap.clear();
    this.userByRefCodeMap.clear();
    this.referralsByReferrerMap.clear();

    if (!this.data.referralTrackingTotals || typeof this.data.referralTrackingTotals !== 'object') {
      this.data.referralTrackingTotals = {};
    }

    for (const u of this.data.users) {
      if (!u.id) {
        u.id = this.generateUniqueUserId();
      }
      this.userByIdMap.set(u.id.toUpperCase(), u);
      if (u.email) {
        this.userByEmailMap.set(u.email.trim().toLowerCase(), u);
      }
      let cleanRef = normalizeReferralCodeInput(u.referralCode);
      if (!cleanRef || cleanRef.length < 3 || this.userByRefCodeMap.has(cleanRef)) {
        cleanRef = this.generateUniqueReferralCode();
      }
      u.referralCode = cleanRef;
      this.userByRefCodeMap.set(cleanRef, u);
    }

    // Backfill referralTrackingTotals from any historical referralEvents if totals are empty
    if (
      Object.keys(this.data.referralTrackingTotals).length === 0 &&
      Array.isArray(this.data.referralEvents) &&
      this.data.referralEvents.length > 0
    ) {
      for (const evt of this.data.referralEvents) {
        if (!evt.referrerId) continue;
        const bucket = this.data.referralTrackingTotals[evt.referrerId] || {
          linkClicks: 0,
          apkDownloads: 0
        };
        if (evt.eventType === 'apk_download') {
          bucket.apkDownloads += 1;
        } else {
          bucket.linkClicks += 1;
        }
        this.data.referralTrackingTotals[evt.referrerId] = bucket;
      }
    }

    // Build deduplicated O(1) referral map keyed by referrerId -> referredUserId
    const dedupedList: ReferralRecord[] = [];
    for (const r of this.data.referrals || []) {
      if (!r.referrerId || !r.referredUserId) continue;
      let byReferred = this.referralsByReferrerMap.get(r.referrerId);
      if (!byReferred) {
        byReferred = new Map<string, ReferralRecord>();
        this.referralsByReferrerMap.set(r.referrerId, byReferred);
      }
      const targetUser = this.userByIdMap.get(r.referredUserId.toUpperCase());
      const derivedQualified =
        Boolean(r.isQualified) ||
        Boolean(r.firstTaskCompleted) ||
        (r.commissionEarned || 0) > 0 ||
        Boolean(targetUser?.firstTaskCompleted) ||
        (targetUser?.totalDeposited || 0) > 0;

      const existing = byReferred.get(r.referredUserId);
      if (!existing) {
        const normalizedRecord: ReferralRecord = {
          ...r,
          referredUserName: targetUser?.name || r.referredUserName,
          isQualified: derivedQualified,
          qualifiedAt: r.qualifiedAt || r.firstTaskCompletedAt,
          qualificationSource:
            r.qualificationSource ||
            (r.firstTaskCompleted ? 'first_task' : (r.commissionEarned || 0) > 0 ? 'deposit' : undefined)
        };
        byReferred.set(r.referredUserId, normalizedRecord);
        dedupedList.push(normalizedRecord);
      } else {
        existing.commissionEarned = Number(((existing.commissionEarned || 0) + (r.commissionEarned || 0)).toFixed(2));
        existing.firstTaskCompleted = Boolean(existing.firstTaskCompleted || r.firstTaskCompleted || targetUser?.firstTaskCompleted);
        existing.firstTaskBonusEarned = Math.max(existing.firstTaskBonusEarned || 0, r.firstTaskBonusEarned || 0);
        existing.firstTaskCompletedAt = existing.firstTaskCompletedAt || r.firstTaskCompletedAt;
        existing.isQualified = Boolean(existing.isQualified || derivedQualified);
        existing.qualifiedAt = existing.qualifiedAt || r.qualifiedAt || r.firstTaskCompletedAt;
        existing.qualificationSource = existing.qualificationSource || r.qualificationSource;
      }
    }

    // Include any user whose referredBy is set even if missing from referrals list
    for (const u of this.data.users) {
      if (!u.referredBy || u.referredBy === u.id) continue;
      const referrer = this.userByIdMap.get(u.referredBy.toUpperCase());
      if (!referrer) continue;
      let byReferred = this.referralsByReferrerMap.get(referrer.id);
      if (!byReferred) {
        byReferred = new Map<string, ReferralRecord>();
        this.referralsByReferrerMap.set(referrer.id, byReferred);
      }
      if (!byReferred.has(u.id)) {
        const derivedQualified = Boolean(u.firstTaskCompleted) || (u.totalDeposited || 0) > 0;
        const synthRecord: ReferralRecord = {
          id: `ref-user-${u.id}`,
          referrerId: referrer.id,
          referredUserId: u.id,
          referredUserName: u.name,
          commissionEarned: 0,
          firstTaskCompleted: Boolean(u.firstTaskCompleted),
          firstTaskBonusEarned: 0,
          isQualified: derivedQualified,
          qualificationSource: u.firstTaskCompleted ? 'first_task' : (u.totalDeposited || 0) > 0 ? 'deposit' : undefined,
          createdAt: u.createdAt
        };
        byReferred.set(u.id, synthRecord);
        dedupedList.push(synthRecord);
      }
    }

    this.data.referrals = dedupedList;
    for (const [referrerId, byReferred] of this.referralsByReferrerMap.entries()) {
      const refUser = this.userByIdMap.get(referrerId.toUpperCase());
      if (refUser) {
        refUser.referralCount = byReferred.size;
      }
    }
  }

  private syncAllUsersVolumeVBadge() {
    const volumeByUser = new Map<string, number>();
    for (const t of this.data.transactions || []) {
      if (t.status !== 'completed' || !t.userId) continue;
      volumeByUser.set(t.userId, (volumeByUser.get(t.userId) || 0) + Math.abs(t.amount || 0));
    }
    for (const u of this.data.users) {
      const txVolume = volumeByUser.get(u.id) || 0;
      const floor = (u.totalDeposited || 0) + (u.totalWithdrawn || 0);
      const totalVolume = Number(Math.max(txVolume, floor).toFixed(2));
      u.totalTransactionVolume = totalVolume;
      if (totalVolume > VOLUME_VBADGE_THRESHOLD) {
        u.hasVolumeVBadge = true;
        if (!u.volumeBadgeUnlockedAt) {
          u.volumeBadgeUnlockedAt = new Date().toISOString();
        }
      } else {
        u.hasVolumeVBadge = false;
      }
    }
  }

  public onSuccessfulTransaction(handler: (tx: Transaction, user: User) => void | Promise<void>) {
    this.txNotificationHandler = handler;
  }

  private emitSuccessfulTransaction(tx: Transaction, user: User) {
    if (
      this.txNotificationHandler &&
      tx.status === 'completed' &&
      (tx.type === 'deposit' || tx.type === 'withdrawal')
    ) {
      Promise.resolve(this.txNotificationHandler(tx, user)).catch((err) => {
        console.error('[Notification Dispatch Error]:', err);
      });
    }
  }

  private ensureDirExists() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        // Make sure all required fields exist
        return {
          users: (parsed.users || INITIAL_USERS).map((u: any) => {
            const { phone: _removedPhone, ...restUser } = u;
            const isVerified = u.isVerified !== undefined ? Boolean(u.isVerified) : u.id === 'CEG-882941';
            const paymentBadges: PaymentMethodBadge[] = isVerified
              ? Array.isArray(u.paymentBadges)
                ? Array.from(
                    new Set(
                      u.paymentBadges.filter((b: any) => ALLOWED_PAYMENT_BADGES.includes(b))
                    )
                  )
                : ['bkash', 'nagad', 'crypto', 'binance']
              : [];
            let whatsappNumber: string | undefined = undefined;
            if (isVerified) {
              if (u.whatsappNumber === undefined && u.id === 'CEG-882941') {
                whatsappNumber = '+8801711000882';
              } else if (typeof u.whatsappNumber === 'string' && u.whatsappNumber.trim()) {
                try {
                  whatsappNumber = sanitizeWhatsappNumber(u.whatsappNumber);
                } catch {
                  whatsappNumber = undefined;
                }
              }
            }
            let telegramLink: string | undefined = undefined;
            if (isVerified) {
              if (u.telegramLink === undefined && u.id === 'CEG-882941') {
                telegramLink = 'https://t.me/alexmorgan_ceg';
              } else if (typeof u.telegramLink === 'string' && u.telegramLink.trim()) {
                try {
                  telegramLink = sanitizeTelegramLink(u.telegramLink);
                } catch {
                  telegramLink = undefined;
                }
              }
            }
            return {
              ...restUser,
              isVerified,
              paymentBadges,
              whatsappNumber: whatsappNumber || '',
              telegramLink: telegramLink || '',
              notificationPrefs: {
                pushEnabled: true
              }
            };
          }),
          products: (parsed.products || INITIAL_PRODUCTS).map((p: any) => ({
            ...p,
            dailyRewardAmount:
              typeof p.dailyRewardAmount === 'number' && Number.isFinite(p.dailyRewardAmount)
                ? p.dailyRewardAmount
                : Number((Number(p.price || 10) * 0.05).toFixed(2)),
            durationDays:
              typeof p.durationDays === 'number' && p.durationDays > 0
                ? Math.floor(p.durationDays)
                : 30
          })),
          orders: (parsed.orders || INITIAL_ORDERS).map((o: any) => {
            const matchedProduct = (parsed.products || INITIAL_PRODUCTS).find((p: any) => p.id === o.productId);
            const durationDays =
              typeof o.durationDays === 'number' && o.durationDays > 0
                ? Math.floor(o.durationDays)
                : matchedProduct?.durationDays || 30;
            const dailyRewardAmount =
              typeof o.dailyRewardAmount === 'number' && Number.isFinite(o.dailyRewardAmount)
                ? o.dailyRewardAmount
                : matchedProduct?.dailyRewardAmount ?? Number((Number(o.productPrice || 10) * 0.05).toFixed(2));
            const createdMs = new Date(o.createdAt || Date.now()).getTime();
            const expiresAt = o.expiresAt || new Date(createdMs + durationDays * 24 * 60 * 60 * 1000).toISOString();
            return {
              ...o,
              dailyRewardAmount,
              durationDays,
              daysClaimed: typeof o.daysClaimed === 'number' ? o.daysClaimed : 0,
              totalEarnedFromOrder: typeof o.totalEarnedFromOrder === 'number' ? o.totalEarnedFromOrder : 0,
              expiresAt
            };
          }),
          deposits: parsed.deposits || INITIAL_DEPOSITS,
          withdrawals: parsed.withdrawals || INITIAL_WITHDRAWALS,
          transactions: parsed.transactions || INITIAL_TRANSACTIONS,
          referrals: parsed.referrals || INITIAL_REFERRALS,
          referralEvents: Array.isArray(parsed.referralEvents) ? parsed.referralEvents : [],
          referralTrackingTotals:
            parsed.referralTrackingTotals && typeof parsed.referralTrackingTotals === 'object'
              ? parsed.referralTrackingTotals
              : {},
          claims: parsed.claims || INITIAL_CLAIMS,
          banners: parsed.banners || INITIAL_BANNERS,
          videoBanners: parsed.videoBanners || INITIAL_VIDEO_BANNERS,
          tasks: parsed.tasks || INITIAL_TASKS,
          settings: (() => {
            const mergedSettings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
            if (parsed.settings?.dailyClaimEnabled === undefined) {
              mergedSettings.dailyClaimEnabled = true;
              mergedSettings.claimIntervalMinutes = 1440;
              if (!parsed.settings?.claimRewardAmount || parsed.settings.claimRewardAmount === 0.25) {
                mergedSettings.claimRewardAmount = 0.5;
              }
            }
            const existingNets = Array.isArray(parsed.settings?.depositNetworks)
              ? parsed.settings.depositNetworks.map((net: any) => ({
                  ...net,
                  logoKey: net.logoKey || undefined
                }))
              : DEFAULT_DEPOSIT_NETWORKS.map((net) =>
                  net.id === 'BEP20'
                    ? {
                        ...net,
                        walletAddress: mergedSettings.usdtBep20Address || net.walletAddress,
                        minDeposit: mergedSettings.minDeposit || net.minDeposit
                      }
                    : { ...net }
                );
            mergedSettings.depositNetworks = existingNets;
            mergedSettings.apkDownloadUrl = resolveAbsoluteApkUrl(
              mergedSettings.apkDownloadUrl,
              mergedSettings.appVersion
            );
            return mergedSettings;
          })(),
          auditLogs: parsed.auditLogs || [],
          notificationLogs: (parsed.notificationLogs || [])
            .filter((n: any) => n.transactionType === 'deposit' || n.transactionType === 'withdrawal')
            .map((n: any) => ({
              id: n.id,
              userId: n.userId,
              userName: n.userName,
              channel: 'push' as const,
              title: n.title,
              message: n.message,
              transactionType: n.transactionType,
              amount: n.amount,
              transactionId: n.transactionId,
              pushStatus: n.pushStatus || 'sent',
              providerInfo: n.providerInfo,
              createdAt: n.createdAt
            })),
          adminPassword:
            typeof parsed.adminPassword === 'string' && parsed.adminPassword.length > 0
              ? parsed.adminPassword
              : DEFAULT_ADMIN_PASSWORD,
          adminTokens: Array.isArray(parsed.adminTokens) ? parsed.adminTokens : [],
          adminTokenOwners:
            parsed.adminTokenOwners && typeof parsed.adminTokenOwners === 'object'
              ? parsed.adminTokenOwners
              : {}
        };
      }
    } catch (e) {
      console.error('Error loading database file, falling back to seed data:', e);
    }

    const initialData: DatabaseSchema = {
      users: INITIAL_USERS,
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      deposits: INITIAL_DEPOSITS,
      withdrawals: INITIAL_WITHDRAWALS,
      transactions: INITIAL_TRANSACTIONS,
      referrals: INITIAL_REFERRALS,
      referralEvents: [],
      referralTrackingTotals: {},
      claims: INITIAL_CLAIMS,
      banners: INITIAL_BANNERS,
      videoBanners: INITIAL_VIDEO_BANNERS,
      tasks: INITIAL_TASKS,
      settings: DEFAULT_SETTINGS,
      auditLogs: [
        {
          id: 'log-1',
          action: 'SYSTEM_BOOT',
          details: 'CryptoEarnGo Cloud Backend and Database Initialized successfully',
          timestamp: new Date().toISOString()
        }
      ],
      notificationLogs: [],
      adminPassword: DEFAULT_ADMIN_PASSWORD,
      adminTokens: [],
      adminTokenOwners: {}
    };
    this.saveDataSync(initialData);
    return initialData;
  }

  private saveDataSync(data: DatabaseSchema) {
    try {
      this.ensureDirExists();
      const payload = JSON.stringify(data);
      fs.writeFileSync(DB_TMP_FILE, payload, 'utf-8');
      fs.renameSync(DB_TMP_FILE, DB_FILE);
      this.isDirty = false;
    } catch (e) {
      console.error('Failed to persist database file:', e);
    }
  }

  public flushSync() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.isDirty) {
      this.saveDataSync(this.data);
    }
  }

  private async flushAsync() {
    if (this.writeInFlight) {
      this.writePending = true;
      return;
    }
    this.writeInFlight = true;
    try {
      while (this.isDirty || this.writePending) {
        this.writePending = false;
        this.isDirty = false;
        const payload = JSON.stringify(this.data);
        await fs.promises.writeFile(DB_TMP_FILE, payload, 'utf-8');
        await fs.promises.rename(DB_TMP_FILE, DB_FILE);
      }
    } catch (e) {
      console.error('Failed to asynchronously persist database file:', e);
    } finally {
      this.writeInFlight = false;
    }
  }

  public subscribeSSE(client: (event: string, data: any) => void) {
    this.sseClients.add(client);
    return () => {
      this.sseClients.delete(client);
    };
  }

  public broadcast(event: string, payload: any) {
    for (const client of this.sseClients) {
      try {
        client(event, payload);
      } catch (e) {
        this.sseClients.delete(client);
      }
    }
  }

  public logAudit(action: string, details: string) {
    const log = {
      id: this.makeUniqueId('log'),
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
    this.broadcast('audit_log', log);
  }

  private save() {
    this.isDirty = true;
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.flushAsync();
    }, 40);
  }

  // --- SETTINGS & DEPOSIT MARKETS ---
  private sanitizeExplorerUrl(raw: unknown): string {
    const val = typeof raw === 'string' ? raw.trim() : '';
    if (!val) return 'https://bscscan.com/tx/';
    try {
      const parsed = new URL(val);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return val.slice(0, 300);
      }
    } catch {
      // fallback
    }
    return 'https://bscscan.com/tx/';
  }

  private sanitizeDepositNetwork(raw: any): DepositNetworkConfig {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid market configuration.');
    }
    const rawId = String(raw.id || raw.code || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '')
      .slice(0, 24);
    if (!rawId) {
      throw new Error('Market ID is required.');
    }

    const name = String(raw.name || raw.code || rawId).trim().slice(0, 80);
    const code = String(raw.code || rawId).trim().slice(0, 40);
    const shortLabel = String(raw.shortLabel || `USDT ${rawId}`).trim().slice(0, 40);
    const logoKey = typeof raw.logoKey === 'string' && raw.logoKey.trim()
      ? raw.logoKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24)
      : undefined;
    const walletAddress = String(raw.walletAddress || '').trim().slice(0, 200);
    const enabled = raw.enabled !== undefined ? Boolean(raw.enabled) : true;
    const minDepNum = Number(raw.minDeposit);
    if (!Number.isFinite(minDepNum) || minDepNum < 0.1 || minDepNum > 1000000) {
      throw new Error(`Minimum deposit for ${name} must be between 0.1 and 1,000,000.`);
    }
    if (enabled && walletAddress.length < 4) {
      throw new Error(`Please provide a valid deposit address for enabled market (${name}).`);
    }

    return {
      id: rawId,
      code,
      name,
      shortLabel,
      ...(logoKey ? { logoKey } : {}),
      walletAddress,
      minDeposit: Number(minDepNum.toFixed(4)),
      estimatedTime: String(raw.estimatedTime || '~2 mins').trim().slice(0, 48),
      confirmations: String(raw.confirmations || '1 Confirmation').trim().slice(0, 64),
      feeLabel: String(raw.feeLabel || '0 USDT').trim().slice(0, 32),
      explorerTxBase: this.sanitizeExplorerUrl(raw.explorerTxBase),
      enabled
    };
  }

  private sanitizeCompanyInfo(raw: any): CompanyProfileInfo {
    const base = this.data?.settings?.companyInfo || DEFAULT_COMPANY_INFO;
    const rawLicenses = Array.isArray(raw?.licenses) ? raw.licenses : base.licenses || [];
    const licenses: CompanyLicenseDocument[] = rawLicenses
      .slice(0, 20)
      .map((doc: any, idx: number): CompanyLicenseDocument | null => {
        const imageUrl = String(doc?.imageUrl || '').trim();
        const isSafeImage =
          imageUrl.startsWith('data:image/') ||
          imageUrl.startsWith('https://') ||
          imageUrl.startsWith('http://') ||
          imageUrl.startsWith('/');
        if (!imageUrl || !isSafeImage || imageUrl.length > 2_500_000) return null;
        return {
          id: String(doc?.id || `lic-${Date.now()}-${idx}`).trim().slice(0, 64),
          title: String(doc?.title || 'Company License Document').trim().slice(0, 120),
          documentNumber: doc?.documentNumber ? String(doc.documentNumber).trim().slice(0, 80) : undefined,
          issuingAuthority: doc?.issuingAuthority ? String(doc.issuingAuthority).trim().slice(0, 120) : undefined,
          imageUrl,
          uploadedAt: String(doc?.uploadedAt || new Date().toISOString())
        };
      })
      .filter((item: CompanyLicenseDocument | null): item is CompanyLicenseDocument => Boolean(item));

    return {
      companyName: String(raw?.companyName ?? base.companyName ?? 'CryptoEarnGo Global Technologies Ltd.')
        .trim()
        .slice(0, 140),
      registrationNumber: String(raw?.registrationNumber ?? base.registrationNumber ?? '').trim().slice(0, 80),
      jurisdiction: String(raw?.jurisdiction ?? base.jurisdiction ?? '').trim().slice(0, 120),
      foundedYear: String(raw?.foundedYear ?? base.foundedYear ?? '').trim().slice(0, 16),
      headquarters: String(raw?.headquarters ?? base.headquarters ?? '').trim().slice(0, 220),
      officialEmail: String(raw?.officialEmail ?? base.officialEmail ?? '').trim().slice(0, 120),
      officialWebsite: String(raw?.officialWebsite ?? base.officialWebsite ?? '').trim().slice(0, 200),
      description: String(raw?.description ?? base.description ?? '').trim().slice(0, 1200),
      licenses
    };
  }

  public getSettings(): SystemSettings {
    if (!Array.isArray(this.data.settings.depositNetworks)) {
      this.data.settings.depositNetworks = DEFAULT_DEPOSIT_NETWORKS.map((net) =>
        net.id === 'BEP20'
          ? {
              ...net,
              walletAddress: this.data.settings.usdtBep20Address || net.walletAddress,
              minDeposit: this.data.settings.minDeposit || net.minDeposit
            }
          : { ...net }
      );
    }
    if (!this.data.settings.companyInfo) {
      this.data.settings.companyInfo = { ...DEFAULT_COMPANY_INFO, licenses: [] };
    }
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    const allowed: Partial<SystemSettings> = {};
    if (updates.usdtBep20Address !== undefined) allowed.usdtBep20Address = String(updates.usdtBep20Address).trim().slice(0, 200);
    if (updates.minDeposit !== undefined && Number.isFinite(Number(updates.minDeposit))) {
      allowed.minDeposit = Math.max(0.1, Number(updates.minDeposit));
    }
    if (updates.minWithdrawal !== undefined && Number.isFinite(Number(updates.minWithdrawal))) {
      allowed.minWithdrawal = Math.max(2, Number(updates.minWithdrawal));
    }
    if (updates.withdrawalFeePercent !== undefined && Number.isFinite(Number(updates.withdrawalFeePercent))) {
      allowed.withdrawalFeePercent = Math.max(0, Math.min(50, Number(updates.withdrawalFeePercent)));
    }
    if (updates.referralCommissionPercent !== undefined && Number.isFinite(Number(updates.referralCommissionPercent))) {
      allowed.referralCommissionPercent = Math.max(0, Math.min(80, Number(updates.referralCommissionPercent)));
    }
    if (updates.firstTaskBonusPercent !== undefined && Number.isFinite(Number(updates.firstTaskBonusPercent))) {
      allowed.firstTaskBonusPercent = Math.max(0, Math.min(100, Number(updates.firstTaskBonusPercent)));
    }
    if (updates.dailyClaimEnabled !== undefined) allowed.dailyClaimEnabled = Boolean(updates.dailyClaimEnabled);
    if (updates.dailyClaimTitle !== undefined) allowed.dailyClaimTitle = String(updates.dailyClaimTitle).trim().slice(0, 120);
    if (updates.dailyClaimDescription !== undefined) allowed.dailyClaimDescription = String(updates.dailyClaimDescription).trim().slice(0, 300);
    if (updates.claimIntervalMinutes !== undefined && Number.isFinite(Number(updates.claimIntervalMinutes))) {
      allowed.claimIntervalMinutes = Math.max(1, Math.min(10080, parseInt(String(updates.claimIntervalMinutes), 10)));
    }
    if (updates.claimRewardAmount !== undefined && Number.isFinite(Number(updates.claimRewardAmount))) {
      allowed.claimRewardAmount = Math.max(0.01, Number(updates.claimRewardAmount));
    }
    if (updates.whatsappLink !== undefined) allowed.whatsappLink = String(updates.whatsappLink).trim().slice(0, 300);
    if (updates.telegramLink !== undefined) allowed.telegramLink = String(updates.telegramLink).trim().slice(0, 300);
    if (updates.appVersion !== undefined) allowed.appVersion = String(updates.appVersion).trim().slice(0, 40);
    if (updates.apkDownloadUrl !== undefined) {
      allowed.apkDownloadUrl = resolveAbsoluteApkUrl(
        String(updates.apkDownloadUrl).trim(),
        updates.appVersion || this.getSettings().appVersion
      ).slice(0, 300);
    }
    if (updates.apkReleaseNotes !== undefined) allowed.apkReleaseNotes = String(updates.apkReleaseNotes).trim().slice(0, 500);
    if (updates.forceUpdate !== undefined) allowed.forceUpdate = Boolean(updates.forceUpdate);
    if (updates.announcement !== undefined) allowed.announcement = String(updates.announcement).trim().slice(0, 400);
    if (updates.maintenanceMode !== undefined) allowed.maintenanceMode = Boolean(updates.maintenanceMode);
    if (updates.companyInfo !== undefined) {
      allowed.companyInfo = this.sanitizeCompanyInfo(updates.companyInfo);
    }

    let nextNetworks: DepositNetworkConfig[];
    if (Array.isArray(updates.depositNetworks)) {
      const seen = new Set<string>();
      nextNetworks = updates.depositNetworks.map((n) => {
        const clean = this.sanitizeDepositNetwork(n);
        if (seen.has(clean.id)) {
          throw new Error(`Duplicate market ID found: ${clean.id}`);
        }
        seen.add(clean.id);
        return clean;
      });
      const bep20 = nextNetworks.find((n) => n.id === 'BEP20');
      if (bep20) {
        allowed.usdtBep20Address = bep20.walletAddress;
        allowed.minDeposit = bep20.minDeposit;
      }
    } else {
      nextNetworks = [...(this.getSettings().depositNetworks || [])];
      if (allowed.usdtBep20Address !== undefined || allowed.minDeposit !== undefined) {
        nextNetworks = nextNetworks.map((net) =>
          net.id === 'BEP20'
            ? {
                ...net,
                walletAddress: allowed.usdtBep20Address ?? net.walletAddress,
                minDeposit: allowed.minDeposit ?? net.minDeposit
              }
            : net
        );
      }
    }

    allowed.depositNetworks = nextNetworks;
    this.data.settings = { ...this.data.settings, ...allowed };
    this.save();
    this.logAudit('SETTINGS_UPDATED', `Settings updated: ${Object.keys(allowed).join(', ')}`);
    this.broadcast('settings_updated', this.data.settings);
    return this.data.settings;
  }

  public addDepositMarket(marketInput: Partial<DepositNetworkConfig>): SystemSettings {
    const clean = this.sanitizeDepositNetwork(marketInput);
    const current = [...(this.getSettings().depositNetworks || [])];
    if (current.some((m) => m.id.toUpperCase() === clean.id.toUpperCase())) {
      throw new Error(`Market "${clean.id}" already exists.`);
    }
    const nextNetworks = [...current, clean];
    this.data.settings = {
      ...this.data.settings,
      depositNetworks: nextNetworks,
      ...(clean.id === 'BEP20'
        ? { usdtBep20Address: clean.walletAddress, minDeposit: clean.minDeposit }
        : {})
    };
    this.save();
    this.logAudit('DEPOSIT_MARKET_ADDED', `Added deposit market: ${clean.name} (${clean.id})`);
    this.broadcast('settings_updated', this.data.settings);
    return this.data.settings;
  }

  public updateDepositMarket(marketId: string, patch: Partial<DepositNetworkConfig>): SystemSettings {
    const targetId = String(marketId || '').trim().toUpperCase();
    const current = [...(this.getSettings().depositNetworks || [])];
    const idx = current.findIndex((m) => m.id.toUpperCase() === targetId);
    if (idx === -1) {
      throw new Error(`Market not found: ${marketId}`);
    }
    const existing = current[idx];
    const merged = this.sanitizeDepositNetwork({
      ...existing,
      ...patch,
      id: existing.id // preserve primary key safely
    });
    current[idx] = merged;

    this.data.settings = {
      ...this.data.settings,
      depositNetworks: current,
      ...(merged.id === 'BEP20'
        ? { usdtBep20Address: merged.walletAddress, minDeposit: merged.minDeposit }
        : {})
    };
    this.save();
    this.logAudit(
      'DEPOSIT_MARKET_UPDATED',
      `Updated deposit market ${merged.name} (${merged.id}) - Status: ${merged.enabled ? 'Enabled' : 'Disabled'}`
    );
    this.broadcast('settings_updated', this.data.settings);
    return this.data.settings;
  }

  public deleteDepositMarket(marketId: string): SystemSettings {
    const targetId = String(marketId || '').trim().toUpperCase();
    const current = [...(this.getSettings().depositNetworks || [])];
    const target = current.find((m) => m.id.toUpperCase() === targetId);
    if (!target) {
      throw new Error(`Market not found: ${marketId}`);
    }
    const nextNetworks = current.filter((m) => m.id.toUpperCase() !== targetId);
    this.data.settings = {
      ...this.data.settings,
      depositNetworks: nextNetworks
    };
    this.save();
    this.logAudit('DEPOSIT_MARKET_DELETED', `Deleted deposit market: ${target.name} (${target.id})`);
    this.broadcast('settings_updated', this.data.settings);
    return this.data.settings;
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    const clean = String(id || '').trim();
    if (!clean) return undefined;
    return (
      this.userByIdMap.get(clean.toUpperCase()) ||
      this.userByEmailMap.get(clean.toLowerCase())
    );
  }

  public getUserByEmail(email: string): User | undefined {
    const clean = String(email || '').trim().toLowerCase();
    if (!clean) return undefined;
    return this.userByEmailMap.get(clean);
  }

  public getUserByReferralCode(code: string): User | undefined {
    const clean = normalizeReferralCodeInput(code);
    if (!clean) return undefined;
    return this.userByRefCodeMap.get(clean);
  }

  private generateUniqueUserId(): string {
    for (let attempt = 0; attempt < 30; attempt++) {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const candidate = `CEG-${randomSuffix}`;
      if (!this.userByIdMap.has(candidate)) {
        return candidate;
      }
    }
    while (true) {
      const candidate = `CEG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      if (!this.userByIdMap.has(candidate)) {
        return candidate;
      }
    }
  }

  private generateUniqueReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (const length of [5, 6, 7]) {
      for (let attempt = 0; attempt < 30; attempt++) {
        let suffix = '';
        for (let i = 0; i < length; i++) {
          suffix += chars[Math.floor(Math.random() * chars.length)];
        }
        const candidate = `CEG${suffix}`;
        if (!this.userByRefCodeMap.has(candidate)) {
          return candidate;
        }
      }
    }
    while (true) {
      const candidate = `CEG${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      if (!this.userByRefCodeMap.has(candidate)) {
        return candidate;
      }
    }
  }

  private upsertReferralRecord(
    referrer: User,
    referredUser: User,
    patch?: Partial<ReferralRecord>
  ): ReferralRecord {
    let byReferred = this.referralsByReferrerMap.get(referrer.id);
    if (!byReferred) {
      byReferred = new Map<string, ReferralRecord>();
      this.referralsByReferrerMap.set(referrer.id, byReferred);
    }

    const nowIso = new Date().toISOString();
    let record = byReferred.get(referredUser.id);
    if (!record) {
      record = {
        id: this.makeUniqueId('ref'),
        referrerId: referrer.id,
        referredUserId: referredUser.id,
        referredUserName: referredUser.name,
        commissionEarned: Number((patch?.commissionEarned || 0).toFixed(2)),
        firstTaskCompleted: Boolean(patch?.firstTaskCompleted),
        firstTaskBonusEarned: patch?.firstTaskBonusEarned || 0,
        firstTaskCompletedAt: patch?.firstTaskCompletedAt,
        isQualified: Boolean(patch?.isQualified),
        qualifiedAt: patch?.qualifiedAt,
        qualificationSource: patch?.qualificationSource,
        createdAt: patch?.createdAt || nowIso
      };
      byReferred.set(referredUser.id, record);
      this.data.referrals.unshift(record);
    } else {
      record.referredUserName = referredUser.name;
      if (patch?.commissionEarned) {
        record.commissionEarned = Number(((record.commissionEarned || 0) + patch.commissionEarned).toFixed(2));
      }
      if (patch?.firstTaskCompleted) {
        record.firstTaskCompleted = true;
      }
      if (patch?.firstTaskBonusEarned !== undefined) {
        record.firstTaskBonusEarned = Math.max(record.firstTaskBonusEarned || 0, patch.firstTaskBonusEarned);
      }
      if (patch?.firstTaskCompletedAt) {
        record.firstTaskCompletedAt = record.firstTaskCompletedAt || patch.firstTaskCompletedAt;
      }
      if (patch?.isQualified) {
        record.isQualified = true;
      }
      if (patch?.qualifiedAt) {
        record.qualifiedAt = record.qualifiedAt || patch.qualifiedAt;
      }
      if (patch?.qualificationSource) {
        record.qualificationSource = record.qualificationSource || patch.qualificationSource;
      }
    }

    referrer.referralCount = byReferred.size;
    return record;
  }

  public computeUserTransactionVolume(user: User): number {
    const txVolume = (this.data.transactions || [])
      .filter((t) => t.userId === user.id && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    const depositWithdrawFloor = (user.totalDeposited || 0) + (user.totalWithdrawn || 0);
    return Number(Math.max(txVolume, depositWithdrawFloor).toFixed(2));
  }

  public syncUserVolumeVBadge(user: User, emitEvents = true): boolean {
    const totalVolume = this.computeUserTransactionVolume(user);
    user.totalTransactionVolume = totalVolume;
    const qualified = totalVolume > VOLUME_VBADGE_THRESHOLD;

    if (qualified) {
      const wasUnlocked = Boolean(user.hasVolumeVBadge);
      user.hasVolumeVBadge = true;
      if (!user.volumeBadgeUnlockedAt) {
        user.volumeBadgeUnlockedAt = new Date().toISOString();
      }
      if (!wasUnlocked && emitEvents) {
        this.logAudit(
          'VOLUME_VBADGE_UNLOCKED',
          `User ${user.name} (${user.id}) automatically unlocked the Colorful $2,000+ V-Badge ($${totalVolume.toFixed(2)} USDT volume)`
        );
        this.broadcast('volume_vbadge_unlocked', {
          userId: user.id,
          userName: user.name,
          totalTransactionVolume: totalVolume,
          hasVolumeVBadge: true,
          volumeBadgeUnlockedAt: user.volumeBadgeUnlockedAt
        });
        return true;
      }
    } else {
      user.hasVolumeVBadge = false;
    }
    return false;
  }

  public createUser(userData: {
    name: string;
    email: string;
    googleId?: string;
    avatar?: string;
    referredByCode?: string;
  }): User {
    const cleanEmail = String(userData.email || '').trim().toLowerCase();
    const userId = this.generateUniqueUserId();
    const referralCode = this.generateUniqueReferralCode();

    let referrer: User | undefined;
    if (userData.referredByCode) {
      const normalizedRef = normalizeReferralCodeInput(userData.referredByCode);
      if (normalizedRef) {
        const found = this.getUserByReferralCode(normalizedRef);
        // Prevent self-referral by email or inactive referrer
        if (found && found.status === 'active' && found.email.toLowerCase() !== cleanEmail) {
          referrer = found;
        }
      }
    }

    const nowIso = new Date().toISOString();
    const newUser: User = {
      id: userId,
      name: String(userData.name || cleanEmail.split('@')[0] || 'User').trim(),
      email: cleanEmail,
      googleId: userData.googleId,
      avatar:
        userData.avatar ||
        `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
      balance: 1.0, // Welcome signup bonus of $1.00 USDT
      totalEarned: 1.0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      referralCode,
      referredBy: referrer ? referrer.id : undefined,
      referralEarnings: 0,
      referralCount: 0,
      status: 'active',
      isVerified: false,
      paymentBadges: [],
      firstTaskCompleted: false,
      firstTaskBonusPaid: false,
      notificationPrefs: { pushEnabled: true },
      role: 'user',
      createdAt: nowIso,
      lastLoginAt: nowIso
    };

    this.data.users.unshift(newUser);
    this.userByIdMap.set(newUser.id.toUpperCase(), newUser);
    if (newUser.email) {
      this.userByEmailMap.set(newUser.email.toLowerCase(), newUser);
    }
    this.userByRefCodeMap.set(newUser.referralCode.toUpperCase(), newUser);

    // Initial signup transaction
    this.data.transactions.unshift({
      id: this.makeUniqueId('tx-sign'),
      userId: newUser.id,
      type: 'reward_claim',
      amount: 1.0,
      balanceAfter: 1.0,
      description: 'Welcome Sign-up Bonus',
      status: 'completed',
      createdAt: nowIso
    });

    // If referred, update referrer stats and deduplicated referral index atomically
    let referralRecord: ReferralRecord | undefined;
    if (referrer) {
      referralRecord = this.upsertReferralRecord(referrer, newUser, { createdAt: nowIso });
    }

    this.save();
    this.logAudit('USER_REGISTERED', `New user registered: ${newUser.name} (${newUser.id})`);
    this.broadcast('user_registered', newUser);
    if (referrer && referralRecord) {
      this.broadcast('referral_bound', {
        referrerId: referrer.id,
        referredUserId: newUser.id,
        referralRecord,
        tracking: this.getReferralStats(referrer.id)
      });
    }
    return newUser;
  }

  public updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned', reason?: string): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.status = status;
    if (reason !== undefined) user.banReason = reason;
    this.save();
    this.logAudit('USER_STATUS_CHANGED', `User ${user.id} status changed to ${status}: ${reason || ''}`);
    this.broadcast('user_status_changed', { userId: user.id, status, banReason: user.banReason });
    return user;
  }

  public toggleUserVerified(userId: string, isVerified: boolean): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.isVerified = isVerified;
    if (!isVerified) {
      if (this.data.adminTokenOwners) {
        const revokedTokens = Object.entries(this.data.adminTokenOwners)
          .filter(([, ownerId]) => ownerId === user.id)
          .map(([tok]) => tok);
        if (revokedTokens.length > 0) {
          this.data.adminTokens = (this.data.adminTokens || []).filter((t) => !revokedTokens.includes(t));
          revokedTokens.forEach((t) => {
            delete this.data.adminTokenOwners![t];
          });
        }
      }
    }
    this.save();
    this.logAudit(
      'USER_VERIFIED_TOGGLED',
      `Admin toggled verification for ${user.name} (${user.id}): ${isVerified ? 'VERIFIED (Blue Badge Granted)' : 'UNVERIFIED (Badge Removed)'}`
    );
    this.broadcast('user_verified_changed', { userId: user.id, isVerified: user.isVerified, user });
    return user;
  }

  public adminUpdateVerifiedUserId(
    currentUserId: string,
    rawNewUserId: string
  ): { oldUserId: string; newUserId: string; user: User } {
    const user = this.getUserById(currentUserId);
    if (!user) throw new Error('User not found');
    if (!user.isVerified) {
      throw new Error('Only verified accounts can have their User ID edited.');
    }

    const newId = String(rawNewUserId || '').trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(newId)) {
      throw new Error('Please enter a valid User ID (3-24 uppercase letters, numbers, or hyphens, e.g. CEG-VIP01).');
    }

    const oldId = user.id;
    if (newId === oldId) {
      return { oldUserId: oldId, newUserId: newId, user };
    }

    const duplicate = this.data.users.some((u) => u.id.toUpperCase() === newId && u.id !== oldId);
    if (duplicate) {
      throw new Error('This User ID is already in use by another account.');
    }

    user.id = newId;

    this.data.users.forEach((u) => {
      if (u.referredBy === oldId) u.referredBy = newId;
    });
    this.data.orders.forEach((o) => {
      if (o.userId === oldId) o.userId = newId;
    });
    this.data.deposits.forEach((d) => {
      if (d.userId === oldId) d.userId = newId;
    });
    this.data.withdrawals.forEach((w) => {
      if (w.userId === oldId) w.userId = newId;
    });
    this.data.transactions.forEach((t) => {
      if (t.userId === oldId) t.userId = newId;
    });
    this.data.referrals.forEach((r) => {
      if (r.referrerId === oldId) r.referrerId = newId;
      if (r.referredUserId === oldId) r.referredUserId = newId;
    });
    this.data.claims.forEach((c) => {
      if (c.userId === oldId) c.userId = newId;
    });
    if (Array.isArray(this.data.notificationLogs)) {
      this.data.notificationLogs.forEach((n) => {
        if (n.userId === oldId) n.userId = newId;
      });
    }
    if (this.data.adminTokenOwners) {
      Object.keys(this.data.adminTokenOwners).forEach((tok) => {
        if (this.data.adminTokenOwners![tok] === oldId) {
          this.data.adminTokenOwners![tok] = newId;
        }
      });
    }

    if (this.data.referralTrackingTotals && this.data.referralTrackingTotals[oldId]) {
      this.data.referralTrackingTotals[newId] = this.data.referralTrackingTotals[oldId];
      delete this.data.referralTrackingTotals[oldId];
    }
    this.rebuildIndexes();
    this.save();
    this.logAudit(
      'ADMIN_USER_ID_UPDATED',
      `Admin edited verified user ${user.name}'s User ID from ${oldId} to ${newId}`
    );
    this.broadcast('user_id_updated', { oldUserId: oldId, newUserId: newId, user });
    return { oldUserId: oldId, newUserId: newId, user };
  }

  public updateUserProfile(userId: string, updates: Partial<User>): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    if (updates.name !== undefined) {
      const trimmedName = String(updates.name).trim();
      if (!trimmedName) throw new Error('Name cannot be empty');
      user.name = trimmedName.slice(0, 60);
    }

    if (updates.avatar !== undefined) {
      const trimmedAvatar = String(updates.avatar).trim();
      if (trimmedAvatar) {
        user.avatar = trimmedAvatar;
      }
    }

    if (updates.country !== undefined) {
      const normalizedCountry = String(updates.country || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 2);
      if (normalizedCountry && !user.isVerified) {
        throw new Error('Only verified accounts can select a country.');
      }
      user.country = normalizedCountry || undefined;
    }

    if (updates.paymentBadges !== undefined) {
      if (!Array.isArray(updates.paymentBadges)) {
        throw new Error('Invalid paymentBadges format');
      }
      const filteredBadges = Array.from(
        new Set(updates.paymentBadges.filter((b): b is PaymentMethodBadge => ALLOWED_PAYMENT_BADGES.includes(b)))
      );
      if (filteredBadges.length > 0 && !user.isVerified) {
        throw new Error('Your account must be verified to display payment method logos.');
      }
      user.paymentBadges = filteredBadges;
    }

    if (updates.whatsappNumber !== undefined) {
      const normalizedWhatsapp = sanitizeWhatsappNumber(updates.whatsappNumber);
      if (normalizedWhatsapp && !user.isVerified) {
        throw new Error('Only verified accounts can link a WhatsApp number.');
      }
      user.whatsappNumber = normalizedWhatsapp;
    }

    if (updates.telegramLink !== undefined) {
      const normalizedTelegram = sanitizeTelegramLink(updates.telegramLink);
      if (normalizedTelegram && !user.isVerified) {
        throw new Error('Only verified accounts can link a Telegram handle.');
      }
      user.telegramLink = normalizedTelegram;
    }

    this.save();
    this.logAudit('USER_PROFILE_UPDATED', `User ${user.name} (${user.id}) updated profile details`);
    this.broadcast('user_updated', user);
    return user;
  }

  public searchUserPublicProfileById(rawUserId: string): PublicUserProfile | null {
    const q = String(rawUserId || '').trim().toUpperCase();
    if (!q || q.includes('@') || q.length < 3 || !/^[A-Z0-9-]+$/.test(q)) {
      throw new Error('Please search using a valid User ID only (e.g. CEG-882941).');
    }

    const user = this.data.users.find((u) => {
      const uid = u.id.toUpperCase();
      if (uid === q) return true;
      if (!q.includes('-') && uid === `CEG-${q}`) return true;
      return false;
    });

    if (!user) return null;

    this.syncUserVolumeVBadge(user, false);

    const userClaims = this.getUserClaims(user.id)
      .slice()
      .sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());

    const completedTasksCount = userClaims.length;
    const recentCompletedTasks = userClaims.slice(0, 10).map((c) => ({
      id: c.id,
      title: c.taskTitle,
      rewardAmount: Number((c.rewardAmount || 0).toFixed(2)),
      completedAt: c.claimedAt
    }));

    const activityScore = (user.totalDeposited || 0) + (user.totalEarned || 0) + completedTasksCount * 5;
    let level = 1;
    let levelTitle = 'Starter';
    let badgeTitle = 'Starter Member';

    if (activityScore >= 1500) {
      level = 6;
      levelTitle = 'Diamond VIP';
      badgeTitle = 'Diamond VIP';
    } else if (activityScore >= 750) {
      level = 5;
      levelTitle = 'Platinum VIP';
      badgeTitle = 'Platinum VIP';
    } else if (activityScore >= 300) {
      level = 4;
      levelTitle = 'Gold VIP';
      badgeTitle = 'Gold Member';
    } else if (activityScore >= 100) {
      level = 3;
      levelTitle = 'Silver Member';
      badgeTitle = 'Silver Member';
    } else if (activityScore >= 25) {
      level = 2;
      levelTitle = 'Bronze Member';
      badgeTitle = 'Bronze Member';
    }

    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      country: user.isVerified && user.country ? user.country : undefined,
      status: user.status,
      isVerified: Boolean(user.isVerified),
      hasVolumeVBadge: Boolean(user.hasVolumeVBadge),
      volumeBadgeUnlockedAt: user.volumeBadgeUnlockedAt,
      totalTransactionVolume: user.totalTransactionVolume || 0,
      paymentBadges: user.isVerified ? (user.paymentBadges || []) : [],
      whatsappNumber: user.isVerified && user.whatsappNumber ? user.whatsappNumber : undefined,
      telegramLink: user.isVerified && user.telegramLink ? user.telegramLink : undefined,
      level,
      levelTitle,
      badgeTitle,
      totalDeposited: Number((user.totalDeposited || 0).toFixed(2)),
      totalWithdrawn: Number((user.totalWithdrawn || 0).toFixed(2)),
      completedTasksCount,
      recentCompletedTasks,
      joinedAt: user.createdAt
    };
  }

  public getVerifiedAgents(): VerifiedAgent[] {
    return this.data.users
      .filter((u) => Boolean(u.isVerified) && u.status === 'active')
      .map((u) => {
        this.syncUserVolumeVBadge(u, false);
        return {
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          country: u.country,
          isVerified: true,
          hasVolumeVBadge: Boolean(u.hasVolumeVBadge),
          totalTransactionVolume: Number((u.totalTransactionVolume || 0).toFixed(2)),
          paymentBadges: Array.isArray(u.paymentBadges) ? u.paymentBadges : [],
          whatsappNumber: u.whatsappNumber || undefined,
          telegramLink: u.telegramLink || undefined,
          joinedAt: u.createdAt
        };
      })
      .sort((a, b) => (b.totalTransactionVolume || 0) - (a.totalTransactionVolume || 0));
  }

  public updateUserNotificationSettings(
    userId: string,
    updates: {
      fcmToken?: string;
      pushSubscription?: Record<string, any> | null;
      notificationPrefs?: { pushEnabled: boolean };
    }
  ): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    if (updates.fcmToken !== undefined) {
      user.fcmToken = updates.fcmToken.trim();
    }
    if (updates.pushSubscription !== undefined) {
      user.pushSubscription = updates.pushSubscription;
    }
    user.notificationPrefs = {
      pushEnabled: true
    };

    this.save();
    this.logAudit(
      'NOTIFICATION_PREFS_UPDATED',
      `User ${user.name} (${user.id}) updated Push notification settings`
    );
    this.broadcast('user_updated', user);
    return user;
  }

  public addNotificationLog(log: NotificationLog): NotificationLog {
    if (!Array.isArray(this.data.notificationLogs)) {
      this.data.notificationLogs = [];
    }
    this.data.notificationLogs.unshift(log);
    if (this.data.notificationLogs.length > 500) {
      this.data.notificationLogs.pop();
    }
    this.save();
    this.broadcast('notification_logged', log);
    if (log.pushStatus === 'sent') {
      this.broadcast('push_notification', log);
    }
    return log;
  }

  public getUserNotifications(userId: string): NotificationLog[] {
    return (this.data.notificationLogs || []).filter(n => n.userId === userId);
  }

  public getAllNotificationLogs(): NotificationLog[] {
    return this.data.notificationLogs || [];
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public addProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
    const price = Number(product.price) || 0;
    const dailyRewardAmount =
      typeof product.dailyRewardAmount === 'number' && Number.isFinite(product.dailyRewardAmount) && product.dailyRewardAmount >= 0
        ? Number(product.dailyRewardAmount.toFixed(2))
        : Number((price * 0.05).toFixed(2));
    const durationDays =
      typeof product.durationDays === 'number' && Number.isFinite(product.durationDays) && product.durationDays >= 1
        ? Math.floor(product.durationDays)
        : 30;

    const newProduct: Product = {
      ...product,
      price,
      dailyRewardAmount,
      durationDays,
      id: this.makeUniqueId('prod'),
      createdAt: new Date().toISOString()
    };
    this.data.products.unshift(newProduct);
    this.save();
    this.logAudit(
      'PRODUCT_ADDED',
      `Product added: ${newProduct.title} ($${newProduct.price} USDT, Daily: $${newProduct.dailyRewardAmount}/day for ${newProduct.durationDays} days)`
    );
    this.broadcast('product_updated', { action: 'add', product: newProduct });
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product {
    const product = this.getProductById(id);
    if (!product) throw new Error('Product not found');
    const cleanUpdates = { ...updates };
    if (cleanUpdates.dailyRewardAmount !== undefined) {
      cleanUpdates.dailyRewardAmount = Math.max(0, Number(Number(cleanUpdates.dailyRewardAmount).toFixed(2)) || 0);
    }
    if (cleanUpdates.durationDays !== undefined) {
      cleanUpdates.durationDays = Math.max(1, Math.floor(Number(cleanUpdates.durationDays)) || 30);
    }
    Object.assign(product, cleanUpdates);
    this.save();
    this.logAudit(
      'PRODUCT_UPDATED',
      `Product updated: ${product.title} (Price: $${product.price} USDT, Daily: $${product.dailyRewardAmount}/day, Duration: ${product.durationDays}d)`
    );
    this.broadcast('product_updated', { action: 'update', product });
    return product;
  }

  public deleteProduct(id: string): boolean {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    const deleted = this.data.products.splice(idx, 1)[0];
    this.save();
    this.logAudit('PRODUCT_DELETED', `Product deleted: ${deleted.title}`);
    this.broadcast('product_updated', { action: 'delete', productId: id });
    return true;
  }

  // --- ORDERS / PURCHASES ---
  public buyProduct(userId: string, productId: string): { order: Order; updatedBalance: number } {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error(`Account is ${user.status}. Purchases are disabled.`);

    const product = this.getProductById(productId);
    if (!product) throw new Error('Product not found');
    if (!product.isAvailable || product.stock <= 0) throw new Error('Product is out of stock');

    if (user.balance < product.price) {
      throw new Error(`Insufficient USDT balance. Current: $${user.balance.toFixed(2)}, Required: $${product.price.toFixed(2)}`);
    }

    // Deduct balance and decrement stock
    user.balance = Number((user.balance - product.price).toFixed(2));
    product.stock -= 1;

    const durationDays = product.durationDays && product.durationDays > 0 ? Math.floor(product.durationDays) : 30;
    const dailyRewardAmount =
      typeof product.dailyRewardAmount === 'number' && Number.isFinite(product.dailyRewardAmount)
        ? product.dailyRewardAmount
        : Number((product.price * 0.05).toFixed(2));
    const nowMs = Date.now();

    const order: Order = {
      id: this.makeUniqueId('ord'),
      userId: user.id,
      userEmail: user.email,
      productId: product.id,
      productTitle: product.title,
      productPrice: product.price,
      dailyRewardAmount,
      durationDays,
      daysClaimed: 0,
      totalEarnedFromOrder: 0,
      expiresAt: new Date(nowMs + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      createdAt: new Date(nowMs).toISOString()
    };
    this.data.orders.unshift(order);

    // Ledger transaction
    const purchaseTx: Transaction = {
      id: this.makeUniqueId('tx'),
      userId: user.id,
      type: 'purchase',
      amount: -product.price,
      balanceAfter: user.balance,
      description: `Purchased "${product.title}"`,
      status: 'completed',
      referenceId: order.id,
      createdAt: new Date().toISOString()
    };
    this.data.transactions.unshift(purchaseTx);

    let commissionReferrer: User | undefined;
    let commissionTx: Transaction | undefined;

    // Check referral commission on product purchase
    if (user.referredBy) {
      const referrer = this.getUserById(user.referredBy);
      if (referrer && referrer.status === 'active') {
        const commissionPct = this.data.settings.referralCommissionPercent || 10;
        const commission = Number(((product.price * commissionPct) / 100).toFixed(2));
        if (commission > 0) {
          referrer.balance = Number((referrer.balance + commission).toFixed(2));
          referrer.totalEarned = Number((referrer.totalEarned + commission).toFixed(2));
          referrer.referralEarnings = Number((referrer.referralEarnings + commission).toFixed(2));

          commissionReferrer = referrer;
          commissionTx = {
            id: this.makeUniqueId('tx-ref'),
            userId: referrer.id,
            type: 'referral_commission',
            amount: commission,
            balanceAfter: referrer.balance,
            description: `${commissionPct}% Referral Commission on purchase by ${user.name}`,
            status: 'completed',
            referenceId: order.id,
            createdAt: new Date().toISOString()
          };
          this.data.transactions.unshift(commissionTx);

          const nowIso = new Date().toISOString();
          this.upsertReferralRecord(referrer, user, {
            commissionEarned: commission,
            isQualified: true,
            qualifiedAt: nowIso,
            qualificationSource: 'purchase',
            createdAt: nowIso
          });
        }
      }
    }

    this.syncUserVolumeVBadge(user);
    if (commissionReferrer) {
      this.syncUserVolumeVBadge(commissionReferrer);
    }

    this.save();
    this.logAudit('PRODUCT_PURCHASED', `User ${user.name} (${user.id}) bought ${product.title} for $${product.price}`);
    this.broadcast('order_created', { order, user, product });
    return { order, updatedBalance: user.balance };
  }

  public getUserOrders(userId: string): Order[] {
    return this.data.orders.filter(o => o.userId === userId);
  }

  public getAllOrders(): Order[] {
    return this.data.orders;
  }

  // --- DEPOSITS ---
  public submitDeposit(userId: string, amount: number, txHash: string, networkInput?: string): DepositRequest {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error(`Account is ${user.status}. Deposits not permitted.`);

    const settings = this.getSettings();
    const networks = settings.depositNetworks || DEFAULT_DEPOSIT_NETWORKS;
    const enabledNetworks = networks.filter((n) => n.enabled);

    let selectedNetwork: DepositNetworkConfig | undefined;
    if (networkInput && networkInput.trim()) {
      const target = networkInput.trim().toLowerCase();
      selectedNetwork = networks.find(
        (n) =>
          n.id.toLowerCase() === target ||
          n.code.toLowerCase() === target ||
          n.shortLabel.toLowerCase() === target ||
          n.name.toLowerCase() === target
      );
      if (!selectedNetwork) {
        throw new Error('The selected deposit network is invalid.');
      }
      if (!selectedNetwork.enabled) {
        throw new Error(`Deposits on ${selectedNetwork.name} are temporarily disabled.`);
      }
    } else {
      selectedNetwork = enabledNetworks[0] || networks[0];
    }

    const min = selectedNetwork ? selectedNetwork.minDeposit : settings.minDeposit || 10;
    const netLabel = selectedNetwork ? selectedNetwork.shortLabel : 'USDT BEP-20';
    const receivingAddress = selectedNetwork ? selectedNetwork.walletAddress : settings.usdtBep20Address;

    if (amount < min) {
      throw new Error(`Minimum deposit on ${netLabel} is $${min} USDT.`);
    }

    // Check duplicate txHash
    const existing = this.data.deposits.find(d => d.txHash.toLowerCase() === txHash.trim().toLowerCase());
    if (existing) {
      throw new Error('This transaction hash has already been submitted.');
    }

    const deposit: DepositRequest = {
      id: this.makeUniqueId('dep'),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount,
      txHash: txHash.trim(),
      network: netLabel,
      walletAddress: receivingAddress,
      status: 'pending',
      notes: `Submitted via ${netLabel} (${selectedNetwork?.estimatedTime || '~2 mins'}). Waiting for admin approval.`,
      createdAt: new Date().toISOString()
    };

    this.data.deposits.unshift(deposit);

    this.save();
    this.logAudit(
      'DEPOSIT_SUBMITTED',
      `Deposit of $${amount} ${netLabel} submitted by ${user.name} (${user.id}). TxHash: ${txHash.slice(0, 10)}...`
    );
    this.broadcast('deposit_submitted', deposit);
    return deposit;
  }

  public approveDeposit(depositId: string, notes?: string): DepositRequest {
    const deposit = this.data.deposits.find(d => d.id === depositId);
    if (!deposit) throw new Error('Deposit not found');
    if (deposit.status !== 'pending') throw new Error(`Deposit is already ${deposit.status}`);

    const user = this.getUserById(deposit.userId);
    if (!user) throw new Error('User not found for deposit');

    deposit.status = 'approved';
    deposit.processedAt = new Date().toISOString();
    if (notes) deposit.notes = notes;

    // Credit user balance
    user.balance = Number((user.balance + deposit.amount).toFixed(2));
    user.totalDeposited = Number((user.totalDeposited + deposit.amount).toFixed(2));

    // Ledger record
    const depositTx: Transaction = {
      id: this.makeUniqueId('tx-dep'),
      userId: user.id,
      type: 'deposit',
      amount: deposit.amount,
      balanceAfter: user.balance,
      description: `Deposit Approved: $${deposit.amount} USDT (${deposit.network || 'USDT BEP-20'})`,
      status: 'completed',
      referenceId: deposit.id,
      createdAt: new Date().toISOString()
    };
    this.data.transactions.unshift(depositTx);

    let depReferrer: User | undefined;
    let depCommissionTx: Transaction | undefined;

    // Check referral deposit bonus commission
    if (user.referredBy) {
      const referrer = this.getUserById(user.referredBy);
      if (referrer && referrer.status === 'active') {
        const commissionPct = this.data.settings.referralCommissionPercent || 10;
        const commission = Number(((deposit.amount * commissionPct) / 100).toFixed(2));
        if (commission > 0) {
          referrer.balance = Number((referrer.balance + commission).toFixed(2));
          referrer.totalEarned = Number((referrer.totalEarned + commission).toFixed(2));
          referrer.referralEarnings = Number((referrer.referralEarnings + commission).toFixed(2));

          depReferrer = referrer;
          depCommissionTx = {
            id: this.makeUniqueId('tx-refdep'),
            userId: referrer.id,
            type: 'referral_commission',
            amount: commission,
            balanceAfter: referrer.balance,
            description: `${commissionPct}% Referral Commission on deposit by ${user.name}`,
            status: 'completed',
            referenceId: deposit.id,
            createdAt: new Date().toISOString()
          };
          this.data.transactions.unshift(depCommissionTx);

          const nowIso = new Date().toISOString();
          this.upsertReferralRecord(referrer, user, {
            commissionEarned: commission,
            isQualified: true,
            qualifiedAt: nowIso,
            qualificationSource: 'deposit',
            createdAt: nowIso
          });
        }
      }
    }

    this.syncUserVolumeVBadge(user);
    if (depReferrer) {
      this.syncUserVolumeVBadge(depReferrer);
    }

    this.save();
    this.logAudit('DEPOSIT_APPROVED', `Admin approved deposit ${deposit.id} ($${deposit.amount} USDT) for ${user.name}`);
    this.broadcast('deposit_updated', { deposit, user });
    this.emitSuccessfulTransaction(depositTx, user);
    return deposit;
  }

  public rejectDeposit(depositId: string, reason: string): DepositRequest {
    const deposit = this.data.deposits.find(d => d.id === depositId);
    if (!deposit) throw new Error('Deposit not found');
    if (deposit.status !== 'pending') throw new Error(`Deposit is already ${deposit.status}`);

    deposit.status = 'rejected';
    deposit.processedAt = new Date().toISOString();
    deposit.notes = reason || 'Rejected by Admin. Invalid transaction or amount mismatch.';

    this.save();
    this.logAudit('DEPOSIT_REJECTED', `Admin rejected deposit ${deposit.id}. Reason: ${deposit.notes}`);
    this.broadcast('deposit_updated', { deposit });
    return deposit;
  }

  public getUserDeposits(userId: string): DepositRequest[] {
    return this.data.deposits.filter(d => d.userId === userId);
  }

  public getAllDeposits(): DepositRequest[] {
    return this.data.deposits;
  }

  // --- WITHDRAWALS ---
  public submitWithdrawal(userId: string, amount: number, toAddress: string): WithdrawalRequest {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error(`Account is ${user.status}. Withdrawals not permitted.`);

    const min = this.data.settings.minWithdrawal || 2;
    if (amount < min) {
      throw new Error(`Minimum withdrawal is $${min} USDT BEP-20.`);
    }

    if (user.balance < amount) {
      throw new Error(`Insufficient balance. Current: $${user.balance.toFixed(2)}, Requested: $${amount.toFixed(2)}`);
    }

    // Basic BEP-20 address validation
    const cleanAddress = toAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
      throw new Error('Invalid USDT BEP-20 (BNB Smart Chain) address format. Must begin with 0x and have 40 hex characters.');
    }

    const feePct = this.data.settings.withdrawalFeePercent || 1.0;
    const fee = Number(((amount * feePct) / 100).toFixed(2));
    const finalAmount = Number((amount - fee).toFixed(2));

    // Deduct immediately on request to prevent double spending
    user.balance = Number((user.balance - amount).toFixed(2));

    const withdrawal: WithdrawalRequest = {
      id: this.makeUniqueId('wth'),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount,
      network: 'USDT BEP-20',
      toAddress: cleanAddress,
      fee,
      finalAmount,
      status: 'pending',
      notes: 'Withdrawal requested. Awaiting Admin clearance.',
      createdAt: new Date().toISOString()
    };

    this.data.withdrawals.unshift(withdrawal);

    this.data.transactions.unshift({
      id: this.makeUniqueId('tx-wth'),
      userId: user.id,
      type: 'withdrawal',
      amount: -amount,
      balanceAfter: user.balance,
      description: `Withdrawal request to ${cleanAddress.slice(0, 6)}...${cleanAddress.slice(-4)}`,
      status: 'pending',
      referenceId: withdrawal.id,
      createdAt: new Date().toISOString()
    });

    this.save();
    this.logAudit('WITHDRAWAL_REQUESTED', `User ${user.name} (${user.id}) requested withdrawal of $${amount} USDT to ${cleanAddress}`);
    this.broadcast('withdrawal_submitted', { withdrawal, user });
    return withdrawal;
  }

  public approveWithdrawal(withdrawalId: string, txHash?: string, notes?: string): WithdrawalRequest {
    const withdrawal = this.data.withdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal) throw new Error('Withdrawal not found');
    if (withdrawal.status !== 'pending') throw new Error(`Withdrawal is already ${withdrawal.status}`);

    const user = this.getUserById(withdrawal.userId);
    if (!user) throw new Error('User not found');

    withdrawal.status = 'approved';
    withdrawal.processedAt = new Date().toISOString();
    withdrawal.txHash = txHash || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    withdrawal.notes = notes || 'Processed and transferred on BNB Smart Chain (BEP-20).';

    user.totalWithdrawn = Number((user.totalWithdrawn + withdrawal.amount).toFixed(2));

    // Update corresponding transaction status to completed
    let tx = this.data.transactions.find(t => t.referenceId === withdrawal.id);
    if (tx) {
      tx.status = 'completed';
    } else {
      tx = {
        id: this.makeUniqueId('tx-wth'),
        userId: user.id,
        type: 'withdrawal',
        amount: -withdrawal.amount,
        balanceAfter: user.balance,
        description: `Withdrawal completed to ${withdrawal.toAddress}`,
        status: 'completed',
        referenceId: withdrawal.id,
        createdAt: new Date().toISOString()
      };
      this.data.transactions.unshift(tx);
    }

    this.syncUserVolumeVBadge(user);

    this.save();
    this.logAudit('WITHDRAWAL_APPROVED', `Admin approved withdrawal ${withdrawal.id} ($${withdrawal.amount} USDT) for ${user.name}`);
    this.broadcast('withdrawal_updated', { withdrawal, user });
    this.emitSuccessfulTransaction(tx, user);
    return withdrawal;
  }

  public rejectWithdrawal(withdrawalId: string, reason: string): WithdrawalRequest {
    const withdrawal = this.data.withdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal) throw new Error('Withdrawal not found');
    if (withdrawal.status !== 'pending') throw new Error(`Withdrawal is already ${withdrawal.status}`);

    const user = this.getUserById(withdrawal.userId);
    if (!user) throw new Error('User not found');

    // Refund user balance
    user.balance = Number((user.balance + withdrawal.amount).toFixed(2));

    withdrawal.status = 'rejected';
    withdrawal.processedAt = new Date().toISOString();
    withdrawal.notes = reason || 'Rejected by Admin. Balance refunded.';

    // Update corresponding transaction status to rejected
    const tx = this.data.transactions.find(t => t.referenceId === withdrawal.id);
    if (tx) {
      tx.status = 'rejected';
    }

    // Ledger refund entry
    this.data.transactions.unshift({
      id: this.makeUniqueId('tx-ref'),
      userId: user.id,
      type: 'reward_claim',
      amount: withdrawal.amount,
      balanceAfter: user.balance,
      description: `Refund: Withdrawal ${withdrawal.id} rejected (${reason || 'Admin review'})`,
      status: 'completed',
      referenceId: withdrawal.id,
      createdAt: new Date().toISOString()
    });

    this.save();
    this.logAudit('WITHDRAWAL_REJECTED', `Admin rejected withdrawal ${withdrawal.id}. Balance refunded to ${user.name}`);
    this.broadcast('withdrawal_updated', { withdrawal, user });
    return withdrawal;
  }

  public getUserWithdrawals(userId: string): WithdrawalRequest[] {
    return this.data.withdrawals.filter(w => w.userId === userId);
  }

  public getAllWithdrawals(): WithdrawalRequest[] {
    return this.data.withdrawals;
  }

  // --- REWARDS & TASKS ---
  public getTasks(): RewardTask[] {
    return this.data.tasks;
  }

  public updateTask(id: string, updates: Partial<RewardTask>): RewardTask {
    const task = this.data.tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    Object.assign(task, updates);
    this.save();
    this.broadcast('task_updated', task);
    return task;
  }

  private awardFirstClaimReferralBonus(
    user: User,
    reward: number,
    claimTitle: string,
    claimRecordId: string
  ): { referrerId: string; bonusAmount: number; bonusPercent: number } | undefined {
    const previousClaimsCount = this.data.claims.filter(c => c.userId === user.id).length;
    const isFirstClaim = previousClaimsCount === 1 && !user.firstTaskBonusPaid;
    if (!isFirstClaim) return undefined;

    user.firstTaskCompleted = true;
    if (!user.referredBy) return undefined;

    const referrer = this.getUserById(user.referredBy);
    if (!referrer || referrer.id === user.id || referrer.status !== 'active') return undefined;

    const bonusPercent = this.data.settings.firstTaskBonusPercent ?? 20;
    const bonusAmount = Number(((reward * bonusPercent) / 100).toFixed(2));
    if (bonusAmount <= 0) return undefined;

    referrer.balance = Number((referrer.balance + bonusAmount).toFixed(2));
    referrer.totalEarned = Number((referrer.totalEarned + bonusAmount).toFixed(2));
    referrer.referralEarnings = Number(((referrer.referralEarnings || 0) + bonusAmount).toFixed(2));
    user.firstTaskBonusPaid = true;

    const nowIso = new Date().toISOString();
    const bonusRefTx: Transaction = {
      id: this.makeUniqueId('tx-reftask'),
      userId: referrer.id,
      type: 'referral_commission',
      amount: bonusAmount,
      balanceAfter: referrer.balance,
      description: `${bonusPercent}% First-Claim Referral Bonus from ${user.name} (${claimTitle})`,
      status: 'completed',
      referenceId: claimRecordId,
      createdAt: nowIso
    };
    this.data.transactions.unshift(bonusRefTx);

    this.upsertReferralRecord(referrer, user, {
      commissionEarned: bonusAmount,
      firstTaskCompleted: true,
      firstTaskBonusEarned: bonusAmount,
      firstTaskCompletedAt: nowIso,
      isQualified: true,
      qualifiedAt: nowIso,
      qualificationSource: 'first_task',
      createdAt: nowIso
    });

    const firstTaskBonus = {
      referrerId: referrer.id,
      bonusAmount,
      bonusPercent
    };

    this.logAudit(
      'REFERRAL_FIRST_TASK_BONUS',
      `Referrer ${referrer.name} (${referrer.id}) earned $${bonusAmount} USDT (${bonusPercent}%) when ${user.name} (${user.id}) completed "${claimTitle}"`
    );

    this.broadcast('referral_bonus_earned', {
      referrerId: referrer.id,
      referrerBalance: referrer.balance,
      referredUserId: user.id,
      referredUserName: user.name,
      taskTitle: claimTitle,
      bonusAmount,
      bonusPercent
    });

    return firstTaskBonus;
  }

  public claimProductDailyReward(
    userId: string,
    orderId: string
  ): {
    order: Order;
    reward: number;
    balance: number;
    nextClaimAt: string;
    firstTaskBonus?: { referrerId: string; bonusAmount: number; bonusPercent: number };
  } {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error(`Account is ${user.status}. Claims are disabled.`);

    const order = this.data.orders.find(o => o.id === orderId && o.userId === user.id);
    if (!order) throw new Error('Purchased product order not found');
    if (order.status !== 'completed') throw new Error('Order is not active');

    const durationDays = order.durationDays || 30;
    const product = this.getProductById(order.productId);
    const dailyReward =
      typeof order.dailyRewardAmount === 'number' && order.dailyRewardAmount > 0
        ? order.dailyRewardAmount
        : product?.dailyRewardAmount || 0;

    if (dailyReward <= 0) {
      throw new Error('No daily income is configured for this product.');
    }

    if ((order.daysClaimed || 0) >= durationDays) {
      throw new Error(`All ${durationDays} days of daily income for this product have already been claimed.`);
    }

    if (order.expiresAt && Date.now() > new Date(order.expiresAt).getTime()) {
      throw new Error(`The ${durationDays}-day duration for this product has expired.`);
    }

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    if (order.lastClaimedAt) {
      const elapsedMs = Date.now() - new Date(order.lastClaimedAt).getTime();
      if (elapsedMs < ONE_DAY_MS) {
        const remainingMs = ONE_DAY_MS - elapsedMs;
        const totalMins = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        throw new Error(`Please wait ${hrs}h ${mins}m before claiming the next daily income.`);
      }
    }

    const nowIso = new Date().toISOString();
    order.daysClaimed = (order.daysClaimed || 0) + 1;
    order.totalEarnedFromOrder = Number(((order.totalEarnedFromOrder || 0) + dailyReward).toFixed(2));
    order.lastClaimedAt = nowIso;

    user.balance = Number((user.balance + dailyReward).toFixed(2));
    user.totalEarned = Number((user.totalEarned + dailyReward).toFixed(2));

    const claimTitle = `${order.productTitle} (Day ${order.daysClaimed}/${durationDays})`;
    const claimRecord: ClaimHistoryItem = {
      id: this.makeUniqueId('clm-prod'),
      userId: user.id,
      taskId: order.id,
      taskTitle: claimTitle,
      rewardAmount: dailyReward,
      claimedAt: nowIso
    };
    this.data.claims.unshift(claimRecord);

    this.data.transactions.unshift({
      id: this.makeUniqueId('tx-prodclm'),
      userId: user.id,
      type: 'reward_claim',
      amount: dailyReward,
      balanceAfter: user.balance,
      description: `Product Daily Income: ${claimTitle}`,
      status: 'completed',
      referenceId: order.id,
      createdAt: nowIso
    });

    const firstTaskBonus = this.awardFirstClaimReferralBonus(user, dailyReward, claimTitle, claimRecord.id);
    const nextClaimAt = new Date(Date.now() + ONE_DAY_MS).toISOString();

    this.syncUserVolumeVBadge(user);
    if (firstTaskBonus) {
      const refUser = this.getUserById(firstTaskBonus.referrerId);
      if (refUser) this.syncUserVolumeVBadge(refUser);
    }

    this.save();
    this.logAudit(
      'PRODUCT_DAILY_EARNING_CLAIMED',
      `User ${user.name} (${user.id}) claimed $${dailyReward} USDT (${order.daysClaimed}/${durationDays}) from ${order.productTitle}`
    );
    this.broadcast('order_updated', { order, user });
    this.broadcast('reward_claimed', { user, claimRecord, firstTaskBonus });
    return { order, reward: dailyReward, balance: user.balance, nextClaimAt, firstTaskBonus };
  }

  public claimDailyReward(
    userId: string
  ): {
    reward: number;
    balance: number;
    nextClaimAt: string;
    claimRecord: ClaimHistoryItem;
    firstTaskBonus?: { referrerId: string; bonusAmount: number; bonusPercent: number };
  } {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error(`Account is ${user.status}. Claims are disabled.`);

    if (this.data.settings.dailyClaimEnabled === false) {
      throw new Error('Daily Claim is temporarily disabled by Admin.');
    }

    const reward = Number(this.data.settings.claimRewardAmount ?? 0.5);
    if (!Number.isFinite(reward) || reward <= 0) {
      throw new Error('Daily Claim reward amount is not configured by Admin.');
    }

    const intervalMinutes = Math.max(1, Number(this.data.settings.claimIntervalMinutes ?? 1440));
    const intervalMs = intervalMinutes * 60 * 1000;

    const recentClaim = this.data.claims
      .filter(c => c.userId === user.id && (c.taskId === 'daily-claim' || c.taskId === 'task-daily'))
      .sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime())[0];

    if (recentClaim) {
      const elapsedMs = Date.now() - new Date(recentClaim.claimedAt).getTime();
      if (elapsedMs < intervalMs) {
        const remainingMs = intervalMs - elapsedMs;
        const totalMins = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        throw new Error(`Daily Claim is on cooldown! Please try again in ${hrs}h ${mins}m.`);
      }
    }

    const nowIso = new Date().toISOString();
    const claimTitle = this.data.settings.dailyClaimTitle || 'Daily Claim Bonus';

    user.balance = Number((user.balance + reward).toFixed(2));
    user.totalEarned = Number((user.totalEarned + reward).toFixed(2));

    const claimRecord: ClaimHistoryItem = {
      id: this.makeUniqueId('clm-daily'),
      userId: user.id,
      taskId: 'daily-claim',
      taskTitle: claimTitle,
      rewardAmount: reward,
      claimedAt: nowIso
    };
    this.data.claims.unshift(claimRecord);

    this.data.transactions.unshift({
      id: this.makeUniqueId('tx-daily'),
      userId: user.id,
      type: 'daily_checkin',
      amount: reward,
      balanceAfter: user.balance,
      description: claimTitle,
      status: 'completed',
      referenceId: claimRecord.id,
      createdAt: nowIso
    });

    const firstTaskBonus = this.awardFirstClaimReferralBonus(user, reward, claimTitle, claimRecord.id);
    const nextClaimAt = new Date(Date.now() + intervalMs).toISOString();

    this.syncUserVolumeVBadge(user);
    if (firstTaskBonus) {
      const refUser = this.getUserById(firstTaskBonus.referrerId);
      if (refUser) this.syncUserVolumeVBadge(refUser);
    }

    this.save();
    this.logAudit('DAILY_CLAIM_COMPLETED', `User ${user.name} (${user.id}) claimed $${reward.toFixed(2)} USDT Daily Claim`);
    this.broadcast('reward_claimed', { user, claimRecord, firstTaskBonus });
    return { reward, balance: user.balance, nextClaimAt, claimRecord, firstTaskBonus };
  }

  public claimTaskReward(
    userId: string,
    taskId: string
  ): { reward: number; balance: number; nextClaimAt: string; firstTaskBonus?: { referrerId: string; bonusAmount: number; bonusPercent: number } } {
    if (!taskId || taskId === 'daily-claim' || taskId === 'task-daily') {
      const res = this.claimDailyReward(userId);
      return {
        reward: res.reward,
        balance: res.balance,
        nextClaimAt: res.nextClaimAt,
        firstTaskBonus: res.firstTaskBonus
      };
    }

    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error(`Account is ${user.status}. Claims are disabled.`);

    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    if (task.cooldownMinutes === 0) {
      const alreadyClaimed = this.data.claims.some(c => c.userId === user.id && c.taskId === taskId);
      if (alreadyClaimed) {
        throw new Error('You have already completed and claimed this one-time task.');
      }
    }

    if (task.cooldownMinutes > 0) {
      const recentClaim = this.data.claims
        .filter(c => c.userId === user.id && c.taskId === taskId)
        .sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime())[0];

      if (recentClaim) {
        const lastTime = new Date(recentClaim.claimedAt).getTime();
        const diffMinutes = (Date.now() - lastTime) / (1000 * 60);
        if (diffMinutes < task.cooldownMinutes) {
          const remainingMinutes = Math.ceil(task.cooldownMinutes - diffMinutes);
          throw new Error(`Reward is on cooldown. Please wait ${remainingMinutes} more minute(s).`);
        }
      }
    }

    const reward = task.rewardAmount;
    user.balance = Number((user.balance + reward).toFixed(2));
    user.totalEarned = Number((user.totalEarned + reward).toFixed(2));

    const claimRecord: ClaimHistoryItem = {
      id: this.makeUniqueId('clm'),
      userId: user.id,
      taskId: task.id,
      taskTitle: task.title,
      rewardAmount: reward,
      claimedAt: new Date().toISOString()
    };
    this.data.claims.unshift(claimRecord);

    this.data.transactions.unshift({
      id: this.makeUniqueId('tx-clm'),
      userId: user.id,
      type: 'reward_claim',
      amount: reward,
      balanceAfter: user.balance,
      description: `Claim: ${task.title}`,
      status: 'completed',
      referenceId: task.id,
      createdAt: new Date().toISOString()
    });

    const firstTaskBonus = this.awardFirstClaimReferralBonus(user, reward, task.title, claimRecord.id);
    const nextClaimAt = new Date(Date.now() + task.cooldownMinutes * 60 * 1000).toISOString();

    this.syncUserVolumeVBadge(user);
    if (firstTaskBonus) {
      const refUser = this.getUserById(firstTaskBonus.referrerId);
      if (refUser) this.syncUserVolumeVBadge(refUser);
    }

    this.save();
    this.logAudit('REWARD_CLAIMED', `User ${user.name} (${user.id}) claimed $${reward} for "${task.title}"`);
    this.broadcast('reward_claimed', { user, claimRecord, firstTaskBonus });
    return { reward, balance: user.balance, nextClaimAt, firstTaskBonus };
  }

  public getUserClaims(userId: string): ClaimHistoryItem[] {
    return this.data.claims.filter(c => c.userId === userId);
  }

  // --- REFERRALS & ACCURATE 10,000+ CONVERSION TRACKING ---
  public getUserReferralsCount(userId: string): number {
    return this.referralsByReferrerMap.get(userId)?.size || 0;
  }

  public getUserReferrals(userId: string, limit = 0, offset = 0): ReferralRecord[] {
    const byReferred = this.referralsByReferrerMap.get(userId);
    if (!byReferred || byReferred.size === 0) return [];

    const sorted = Array.from(byReferred.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (limit > 0) {
      const safeOffset = Math.max(0, Math.floor(offset));
      const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
      return sorted.slice(safeOffset, safeOffset + safeLimit);
    }
    return sorted;
  }

  public getReferralStats(userId: string): ReferralTrackingStats {
    const user = this.getUserById(userId);
    const byReferred = this.referralsByReferrerMap.get(userId);
    const totalSignups = byReferred ? byReferred.size : 0;
    let successfulReferrals = 0;
    if (byReferred) {
      for (const r of byReferred.values()) {
        if (r.isQualified || r.firstTaskCompleted || (r.commissionEarned || 0) > 0) {
          successfulReferrals += 1;
        }
      }
    }

    const bucket = this.data.referralTrackingTotals?.[userId];
    const linkClicks = bucket?.linkClicks || 0;
    const apkDownloads = bucket?.apkDownloads || 0;

    if (user && (user.referralCount || 0) !== totalSignups) {
      user.referralCount = totalSignups;
    }

    const conversionRate =
      totalSignups > 0
        ? Number(((successfulReferrals / totalSignups) * 100).toFixed(1))
        : 0;

    return {
      referralCode: user?.referralCode || '',
      linkClicks,
      apkDownloads,
      totalSignups,
      successfulReferrals,
      conversionRate
    };
  }

  public applyReferralCode(
    userId: string,
    rawCode: string
  ): {
    referrer: User;
    user: User;
    referralRecord: ReferralRecord;
    stats: ReferralTrackingStats;
  } {
    const user = this.getUserById(userId);
    if (!user) throw new Error('Account not found. Please sign in again.');
    if (user.status !== 'active') throw new Error(`Account is ${user.status}.`);

    const cleanCode = normalizeReferralCodeInput(rawCode);
    if (!cleanCode || cleanCode.length < 3) {
      throw new Error('Please enter a valid referral code or invitation link.');
    }

    const referrer = this.getUserByReferralCode(cleanCode);
    if (!referrer || referrer.status !== 'active') {
      throw new Error('Referral code not found. Please verify the code and try again.');
    }

    if (
      referrer.id === user.id ||
      referrer.email.toLowerCase() === user.email.toLowerCase()
    ) {
      throw new Error('You cannot apply your own referral code.');
    }

    if (referrer.referredBy === user.id) {
      throw new Error('Mutual/circular referral is not permitted.');
    }

    if (user.referredBy && user.referredBy !== referrer.id) {
      throw new Error('A referral partner is already linked to your account.');
    }

    user.referredBy = referrer.id;
    const referralRecord = this.upsertReferralRecord(referrer, user);
    const stats = this.getReferralStats(referrer.id);

    this.save();
    this.logAudit(
      'REFERRAL_BOUND',
      `User ${user.name} (${user.id}) linked referral code ${referrer.referralCode} (${referrer.id})`
    );
    this.broadcast('referral_bound', {
      referrerId: referrer.id,
      referredUserId: user.id,
      referralRecord,
      tracking: stats
    });

    return { referrer, user, referralRecord, stats };
  }

  public trackReferralEvent(
    rawCode: string,
    eventType: 'click' | 'apk_download',
    source = 'landing'
  ): { tracked: boolean; referrerId?: string; stats?: ReferralTrackingStats; tracking?: ReferralTrackingStats } {
    const code = normalizeReferralCodeInput(rawCode);
    if (!code) return { tracked: false };
    const referrer = this.getUserByReferralCode(code);
    if (!referrer || referrer.status !== 'active') {
      return { tracked: false };
    }

    if (!this.data.referralTrackingTotals || typeof this.data.referralTrackingTotals !== 'object') {
      this.data.referralTrackingTotals = {};
    }
    const bucket = this.data.referralTrackingTotals[referrer.id] || {
      linkClicks: 0,
      apkDownloads: 0
    };
    if (eventType === 'apk_download') {
      bucket.apkDownloads += 1;
    } else {
      bucket.linkClicks += 1;
    }
    this.data.referralTrackingTotals[referrer.id] = bucket;

    if (!Array.isArray(this.data.referralEvents)) {
      this.data.referralEvents = [];
    }

    const event: ReferralTrackingEvent = {
      id: this.makeUniqueId(`reft-${eventType}`),
      referralCode: referrer.referralCode,
      referrerId: referrer.id,
      eventType,
      source: String(source || 'landing').slice(0, 60),
      createdAt: new Date().toISOString()
    };

    this.data.referralEvents.unshift(event);
    if (this.data.referralEvents.length > 2000) {
      this.data.referralEvents.length = 2000;
    }

    const stats = this.getReferralStats(referrer.id);
    this.save();
    this.broadcast('referral_tracked', {
      referrerId: referrer.id,
      referralCode: referrer.referralCode,
      eventType,
      stats,
      tracking: stats
    });
    return { tracked: true, referrerId: referrer.id, stats, tracking: stats };
  }

  // --- TRANSACTIONS ---
  public getUserTransactions(userId: string): Transaction[] {
    return this.data.transactions.filter(t => t.userId === userId);
  }

  public getAllTransactions(): Transaction[] {
    return this.data.transactions;
  }

  // --- CONTENT: BANNERS & VIDEOS ---
  public getBanners(): Banner[] {
    return this.data.banners;
  }

  public updateBanners(banners: Banner[]): Banner[] {
    this.data.banners = banners;
    this.save();
    this.logAudit('BANNERS_UPDATED', `Updated ${banners.length} promotional banners`);
    this.broadcast('content_updated', { banners });
    return this.data.banners;
  }

  public getVideoBanners(): VideoBanner[] {
    return this.data.videoBanners;
  }

  public updateVideoBanners(videos: VideoBanner[]): VideoBanner[] {
    this.data.videoBanners = videos;
    this.save();
    this.logAudit('VIDEOS_UPDATED', `Updated ${videos.length} video banners`);
    this.broadcast('content_updated', { videoBanners: videos });
    return this.data.videoBanners;
  }

  // --- STATS ---
  public getAdminStats(): AdminStats {
    const totalUsers = this.data.users.length;
    const activeUsers = this.data.users.filter(u => u.status === 'active').length;
    const bannedUsers = this.data.users.filter(u => u.status === 'banned').length;

    const totalVolume = this.data.deposits
      .filter(d => d.status === 'approved')
      .reduce((sum, d) => sum + d.amount, 0);

    const pendingDeposits = this.data.deposits.filter(d => d.status === 'pending');
    const pendingWithdrawals = this.data.withdrawals.filter(w => w.status === 'pending');

    return {
      totalUsers,
      activeUsers,
      bannedUsers,
      totalVolume: Number(totalVolume.toFixed(2)),
      pendingDepositsCount: pendingDeposits.length,
      pendingDepositsAmount: Number(pendingDeposits.reduce((sum, d) => sum + d.amount, 0).toFixed(2)),
      pendingWithdrawalsCount: pendingWithdrawals.length,
      pendingWithdrawalsAmount: Number(pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0).toFixed(2)),
      totalOrdersCount: this.data.orders.length,
      totalProductsCount: this.data.products.length
    };
  }

  public getAuditLogs() {
    return this.data.auditLogs;
  }

  // --- ADMIN AUTH & PASSWORD MANAGEMENT ---
  public verifyAdminLogin(email: string, password: string, userId?: string): string | null {
    const appUser = userId ? this.getUserById(userId) : undefined;
    if (!appUser || !appUser.isVerified || appUser.status !== 'active') {
      throw new Error('Only verified accounts can access the Admin Panel.');
    }
    const normalizedEmail = (email || '').trim().toLowerCase();
    const isValidEmail = normalizedEmail === 'admin@cryptoearngo.com' || normalizedEmail === 'admin';
    if (!isValidEmail || password !== this.data.adminPassword) {
      return null;
    }
    const token = crypto.randomBytes(24).toString('hex');
    if (!Array.isArray(this.data.adminTokens)) {
      this.data.adminTokens = [];
    }
    if (!this.data.adminTokenOwners || typeof this.data.adminTokenOwners !== 'object') {
      this.data.adminTokenOwners = {};
    }
    this.data.adminTokens.push(token);
    if (userId) {
      const appUser = this.getUserById(userId);
      if (appUser) {
        this.data.adminTokenOwners[token] = appUser.id;
      }
    }
    if (this.data.adminTokens.length > 20) {
      const removed = this.data.adminTokens.slice(0, this.data.adminTokens.length - 20);
      this.data.adminTokens = this.data.adminTokens.slice(-20);
      removed.forEach((tok) => {
        delete this.data.adminTokenOwners?.[tok];
      });
    }
    this.save();
    this.logAudit(
      'ADMIN_LOGIN',
      `Administrator authenticated${userId ? ` via verified account (${userId})` : ''} and started a secure session`
    );
    return token;
  }

  public verifyAdminToken(token: string): boolean {
    if (!token || !Array.isArray(this.data.adminTokens)) return false;
    return this.data.adminTokens.includes(token);
  }

  public getAdminTokenOwner(token: string): string | undefined {
    if (!token || !this.data.adminTokenOwners) return undefined;
    return this.data.adminTokenOwners[token] || undefined;
  }

  public revokeAdminToken(token: string): void {
    if (!token || !Array.isArray(this.data.adminTokens)) return;
    this.data.adminTokens = this.data.adminTokens.filter(t => t !== token);
    if (this.data.adminTokenOwners) {
      delete this.data.adminTokenOwners[token];
    }
    this.save();
  }

  public changeAdminPassword(currentPassword: string, newPassword: string, ownerUserId?: string): string {
    if (!currentPassword || currentPassword !== this.data.adminPassword) {
      throw new Error('Current password is incorrect');
    }
    const trimmed = (newPassword || '').trim();
    if (trimmed.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }
    this.data.adminPassword = trimmed;
    const newToken = crypto.randomBytes(24).toString('hex');
    this.data.adminTokens = [newToken];
    this.data.adminTokenOwners = ownerUserId ? { [newToken]: ownerUserId } : {};
    this.save();
    this.logAudit('ADMIN_PASSWORD_CHANGED', 'Administrator updated the Admin Panel access password');
    return newToken;
  }
}

export const db = new DatabaseManager();
