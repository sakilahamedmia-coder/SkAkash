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
} from '../types';
import { resolveAbsoluteApkUrl, normalizeReferralCodeInput } from './publicUrl';

const STORAGE_KEY = 'ceg_native_db_v1';
const DEFAULT_ADMIN_PASSWORD = '55664411Aa';
const VOLUME_VBADGE_THRESHOLD = 2000;

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
  const strippedUrl = input
    .replace(/^https?:\/\/(api\.whatsapp\.com\/send\?phone=|wa\.me\/)/i, '')
    .replace(/^wa\.me\//i, '');
  const compact = strippedUrl.replace(/[\s()-]/g, '');
  const digits = compact.replace(/[^0-9]/g, '');
  if (digits.length < 6 || digits.length > 16 || !/^\+?[0-9]+$/.test(compact)) {
    throw new Error('Please enter a valid WhatsApp number (e.g. +88017XXXXXXXX).');
  }
  return `+${digits}`;
}

function sanitizeTelegramLink(raw: unknown): string {
  const input = String(raw ?? '').trim();
  if (!input) return '';
  const cleaned = input
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

function randomHexToken(byteLen = 24): string {
  const bytes = new Uint8Array(byteLen);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

interface NativeDatabaseSchema {
  users: User[];
  userPasswords: Record<string, string>;
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
  adminTokenOwners: Record<string, string>;
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

function createSeedData(): NativeDatabaseSchema {
  const now = Date.now();
  return {
    users: [
      {
        id: 'CEG-882941',
        name: 'Alex Morgan',
        email: 'demo@cryptoearngo.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        balance: 48.5,
        totalEarned: 63.5,
        totalDeposited: 50.0,
        totalWithdrawn: 15.0,
        referralCode: 'CEG882',
        referralEarnings: 8.5,
        referralCount: 3,
        status: 'active',
        isVerified: true,
        paymentBadges: ['bkash', 'nagad', 'crypto', 'binance'],
        whatsappNumber: '+8801711000882',
        telegramLink: 'https://t.me/alexmorgan_ceg',
        notificationPrefs: { pushEnabled: true },
        role: 'user',
        createdAt: new Date(now - 86400000 * 10).toISOString(),
        lastLoginAt: new Date(now).toISOString()
      },
      {
        id: 'CEG-109432',
        name: 'Sarah Connor',
        email: 'sarah.k@cryptoearngo.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        balance: 14.2,
        totalEarned: 14.2,
        totalDeposited: 20.0,
        totalWithdrawn: 5.8,
        referralCode: 'CEG109',
        referredBy: 'CEG-882941',
        referralEarnings: 2.0,
        referralCount: 1,
        status: 'active',
        isVerified: false,
        notificationPrefs: { pushEnabled: true },
        role: 'user',
        createdAt: new Date(now - 86400000 * 6).toISOString(),
        lastLoginAt: new Date(now - 86400000).toISOString()
      },
      {
        id: 'CEG-994102',
        name: 'Suspicious Trader',
        email: 'badactor@cryptoearngo.com',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
        balance: 0,
        totalEarned: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        referralCode: 'CEG994',
        referralEarnings: 0,
        referralCount: 0,
        status: 'banned',
        banReason: 'Submitting forged transaction hashes and duplicate accounts.',
        notificationPrefs: { pushEnabled: true },
        role: 'user',
        createdAt: new Date(now - 86400000 * 8).toISOString(),
        lastLoginAt: new Date(now - 86400000 * 2).toISOString()
      }
    ],
    userPasswords: {
      'demo@cryptoearngo.com': 'password123',
      'sarah.k@cryptoearngo.com': 'password123'
    },
    products: [
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
        createdAt: new Date(now - 86400000 * 5).toISOString()
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
        createdAt: new Date(now - 86400000 * 4).toISOString()
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
        createdAt: new Date(now - 86400000 * 3).toISOString()
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
        createdAt: new Date(now - 86400000 * 2).toISOString()
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
        createdAt: new Date(now - 86400000).toISOString()
      }
    ],
    orders: [
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
        expiresAt: new Date(now + 86400000 * 23).toISOString(),
        status: 'completed',
        createdAt: new Date(now - 86400000 * 7).toISOString()
      }
    ],
    deposits: [
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
        createdAt: new Date(now - 86400000 * 9).toISOString(),
        processedAt: new Date(now - 86400000 * 9 + 600000).toISOString()
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
        createdAt: new Date(now - 86400000 * 5).toISOString(),
        processedAt: new Date(now - 86400000 * 5 + 300000).toISOString()
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
        createdAt: new Date(now - 3600000 * 2).toISOString()
      }
    ],
    withdrawals: [
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
        createdAt: new Date(now - 86400000 * 4).toISOString(),
        processedAt: new Date(now - 86400000 * 4 + 1800000).toISOString()
      },
      {
        id: 'wth-202',
        userId: 'CEG-109432',
        userName: 'Sarah Connor',
        userEmail: 'sarah.k@cryptoearngo.com',
        amount: 6,
        network: 'USDT BEP-20',
        toAddress: '0x22cB18a892bA49821730B247a329F640274Ab893',
        fee: 0.2,
        finalAmount: 5.8,
        status: 'pending',
        notes: 'Waiting for Admin approval queue',
        createdAt: new Date(now - 3600000 * 3).toISOString()
      }
    ],
    transactions: [
      {
        id: 'tx-1',
        userId: 'CEG-882941',
        type: 'deposit',
        amount: 50,
        balanceAfter: 50,
        description: 'Deposit approved (USDT BEP-20)',
        status: 'completed',
        referenceId: 'dep-101',
        createdAt: new Date(now - 86400000 * 9).toISOString()
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
        createdAt: new Date(now - 86400000 * 7).toISOString()
      },
      {
        id: 'tx-3',
        userId: 'CEG-882941',
        type: 'referral_commission',
        amount: 2.0,
        balanceAfter: 37,
        description: '10% Referral Commission from Sarah Connor (CEG-109432)',
        status: 'completed',
        createdAt: new Date(now - 86400000 * 5).toISOString()
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
        createdAt: new Date(now - 86400000 * 4 - 3600000).toISOString()
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
        createdAt: new Date(now - 86400000 * 4).toISOString()
      },
      {
        id: 'tx-6',
        userId: 'CEG-882941',
        type: 'reward_claim',
        amount: 0.5,
        balanceAfter: 22.75,
        description: 'Daily Check-in Reward',
        status: 'completed',
        referenceId: 'task-daily',
        createdAt: new Date(now - 86400000 * 2).toISOString()
      },
      {
        id: 'tx-7',
        userId: 'CEG-882941',
        type: 'deposit',
        amount: 25.75,
        balanceAfter: 48.5,
        description: 'Deposit approved (USDT BEP-20)',
        status: 'completed',
        createdAt: new Date(now - 86400000).toISOString()
      }
    ],
    referrals: [
      {
        id: 'ref-1',
        referrerId: 'CEG-882941',
        referredUserId: 'CEG-109432',
        referredUserName: 'Sarah Connor',
        commissionEarned: 2.0,
        firstTaskCompleted: false,
        firstTaskBonusEarned: 0,
        createdAt: new Date(now - 86400000 * 6).toISOString()
      }
    ],
    claims: [
      {
        id: 'clm-2',
        userId: 'CEG-882941',
        taskId: 'daily-claim',
        taskTitle: 'Daily Claim Bonus',
        rewardAmount: 0.5,
        claimedAt: new Date(now - 86400000).toISOString()
      }
    ],
    banners: [
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
    ],
    videoBanners: [
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
    ],
    tasks: [
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
        rewardAmount: 0.5,
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
        rewardAmount: 0.6,
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
    ],
    settings: {
      usdtBep20Address: '0x71C8A3297a760bF1c0678F45a1fA723c3B08bF49',
      minDeposit: 10,
      depositNetworks: DEFAULT_DEPOSIT_NETWORKS,
      minWithdrawal: 2,
      withdrawalFeePercent: 1.0,
      referralCommissionPercent: 10,
      firstTaskBonusPercent: 20,
      dailyClaimEnabled: true,
      dailyClaimTitle: 'Daily Claim Bonus',
      dailyClaimDescription: 'Collect your guaranteed daily USDT reward every 24 hours.',
      claimIntervalMinutes: 1440,
      claimRewardAmount: 0.5,
      whatsappLink: 'https://wa.me/15557892345',
      telegramLink: 'https://t.me/CryptoEarnGo_Official',
      appVersion: 'v2.4.1',
      apkDownloadUrl: resolveAbsoluteApkUrl('/downloads/CryptoEarnGo-v2.4.1.apk', 'v2.4.1'),
      apkReleaseNotes: 'Release v2.4.1: Instant USDT BEP-20 validator, ultra-smooth UI animations, and improved real-time account sync.',
      forceUpdate: false,
      announcement: 'Welcome to CryptoEarnGo! USDT multi-network deposits & withdrawals operate 24/7 with instant synchronization.',
      maintenanceMode: false,
      companyInfo: {
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
      }
    },
    auditLogs: [
      {
        id: 'log-1',
        action: 'SYSTEM_BOOT',
        details: 'CryptoEarnGo Mobile Local Engine initialized successfully',
        timestamp: new Date(now).toISOString()
      }
    ],
    referralEvents: [],
    referralTrackingTotals: {},
    notificationLogs: [],
    adminPassword: DEFAULT_ADMIN_PASSWORD,
    adminTokens: [],
    adminTokenOwners: {}
  };
}

class NativeBackendEngine {
  private data: NativeDatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): NativeDatabaseSchema {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const seed = createSeedData();
          return {
            ...seed,
            ...parsed,
            userPasswords: parsed.userPasswords || seed.userPasswords,
            adminTokens: Array.isArray(parsed.adminTokens) ? parsed.adminTokens : [],
            adminTokenOwners: parsed.adminTokenOwners || {},
            notificationLogs: Array.isArray(parsed.notificationLogs) ? parsed.notificationLogs : [],
            referralEvents: Array.isArray(parsed.referralEvents) ? parsed.referralEvents : [],
            referralTrackingTotals:
              parsed.referralTrackingTotals && typeof parsed.referralTrackingTotals === 'object'
                ? parsed.referralTrackingTotals
                : {},
            auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : seed.auditLogs,
            settings: (() => {
              const mergedSettings = {
                ...seed.settings,
                ...(parsed.settings || {}),
                depositNetworks: Array.isArray(parsed.settings?.depositNetworks)
                  ? parsed.settings.depositNetworks
                  : seed.settings.depositNetworks,
                companyInfo: parsed.settings?.companyInfo
                  ? {
                      ...seed.settings.companyInfo!,
                      ...parsed.settings.companyInfo,
                      licenses: Array.isArray(parsed.settings.companyInfo.licenses)
                        ? parsed.settings.companyInfo.licenses
                        : []
                    }
                  : seed.settings.companyInfo
              };
              mergedSettings.apkDownloadUrl = resolveAbsoluteApkUrl(
                mergedSettings.apkDownloadUrl,
                mergedSettings.appVersion
              );
              return mergedSettings;
            })()
          };
        }
      }
    } catch {
      // fall through to seed
    }
    const seed = createSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(d: NativeDatabaseSchema) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
      }
    } catch {
      // ignore storage quota failures
    }
  }

  private save() {
    this.saveData(this.data);
  }

  private emit(event: string, data: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ceg-local-event', { detail: { event, data } }));
    }
  }

  private logAudit(action: string, details: string) {
    const log = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
    this.emit('audit_log', log);
  }

  private addNotification(tx: Transaction, user: User, customTitle?: string, customMessage?: string) {
    const isDeposit = tx.type === 'deposit';
    const amountAbs = Math.abs(tx.amount).toFixed(2);
    const log: NotificationLog = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      userName: user.name,
      channel: 'push',
      title:
        customTitle ||
        (isDeposit ? `Deposit Approved: +$${amountAbs} USDT` : `Withdrawal Processed: -$${amountAbs} USDT`),
      message:
        customMessage ||
        (isDeposit
          ? `Your $${amountAbs} USDT deposit is verified. Current balance: $${user.balance.toFixed(2)} USDT.`
          : `Your $${amountAbs} USDT withdrawal has been processed. Current balance: $${user.balance.toFixed(2)} USDT.`),
      transactionType: isDeposit ? 'deposit' : 'withdrawal',
      amount: Math.abs(tx.amount),
      transactionId: tx.id,
      pushStatus: 'sent',
      providerInfo: 'Mobile Local Push Gateway',
      createdAt: new Date().toISOString()
    };
    this.data.notificationLogs.unshift(log);
    if (this.data.notificationLogs.length > 500) {
      this.data.notificationLogs.pop();
    }
    this.save();
    this.emit('notification_logged', log);
    this.emit('push_notification', log);
    return log;
  }

  private getUserById(id: string): User | undefined {
    const clean = String(id || '').trim();
    return this.data.users.find((u) => u.id === clean || u.email.toLowerCase() === clean.toLowerCase());
  }

  private getUserByEmail(email: string): User | undefined {
    const clean = String(email || '').trim().toLowerCase();
    return this.data.users.find((u) => u.email.toLowerCase() === clean);
  }

  private makeUniqueId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${randomHexToken(4)}`;
  }

  private getUserByReferralCode(code: string): User | undefined {
    const clean = normalizeReferralCodeInput(code);
    if (!clean) return undefined;
    return this.data.users.find((u) => u.referralCode.toUpperCase() === clean);
  }

  private generateUniqueUserId(): string {
    const existingIds = new Set(this.data.users.map((u) => u.id.toUpperCase()));
    for (let attempt = 0; attempt < 30; attempt++) {
      const candidate = `CEG-${Math.floor(100000 + Math.random() * 900000)}`;
      if (!existingIds.has(candidate)) return candidate;
    }
    return `CEG-${randomHexToken(4).toUpperCase()}`;
  }

  private generateUniqueReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const existingCodes = new Set(this.data.users.map((u) => u.referralCode.toUpperCase()));
    for (const length of [5, 6, 7]) {
      for (let attempt = 0; attempt < 30; attempt++) {
        let suffix = '';
        for (let i = 0; i < length; i++) {
          suffix += chars[Math.floor(Math.random() * chars.length)];
        }
        const candidate = `CEG${suffix}`;
        if (!existingCodes.has(candidate)) {
          return candidate;
        }
      }
    }
    return `CEG${randomHexToken(4).toUpperCase()}`;
  }

  private getUserReferralsDedup(userId: string): ReferralRecord[] {
    const map = new Map<string, ReferralRecord>();
    const userMap = new Map(this.data.users.map((u) => [u.id, u]));
    for (const r of this.data.referrals) {
      if (r.referrerId !== userId) continue;
      const targetUser = userMap.get(r.referredUserId);
      const derivedQualified =
        Boolean(r.isQualified) ||
        Boolean(r.firstTaskCompleted) ||
        (r.commissionEarned || 0) > 0 ||
        Boolean(targetUser?.firstTaskCompleted) ||
        (targetUser?.totalDeposited || 0) > 0;
      const existing = map.get(r.referredUserId);
      if (!existing) {
        map.set(r.referredUserId, { ...r, isQualified: derivedQualified });
      } else {
        existing.commissionEarned = Number(((existing.commissionEarned || 0) + (r.commissionEarned || 0)).toFixed(2));
        existing.firstTaskCompleted = Boolean(existing.firstTaskCompleted || r.firstTaskCompleted);
        existing.firstTaskBonusEarned = Math.max(existing.firstTaskBonusEarned || 0, r.firstTaskBonusEarned || 0);
        existing.isQualified = Boolean(existing.isQualified || derivedQualified);
      }
    }
    for (const u of this.data.users) {
      if (u.referredBy === userId && !map.has(u.id)) {
        map.set(u.id, {
          id: `ref-user-${u.id}`,
          referrerId: userId,
          referredUserId: u.id,
          referredUserName: u.name,
          commissionEarned: 0,
          firstTaskCompleted: Boolean(u.firstTaskCompleted),
          firstTaskBonusEarned: 0,
          isQualified: Boolean(u.firstTaskCompleted || (u.totalDeposited || 0) > 0),
          createdAt: u.createdAt
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private getReferralStats(userId: string): ReferralTrackingStats {
    const user = this.getUserById(userId);
    const history = this.getUserReferralsDedup(userId);
    const bucket = this.data.referralTrackingTotals?.[userId];
    const events = bucket ? [] : (this.data.referralEvents || []).filter((e) => e.referrerId === userId);
    const linkClicks = bucket ? bucket.linkClicks : events.filter((e) => e.eventType === 'click').length;
    const apkDownloads = bucket ? bucket.apkDownloads : events.filter((e) => e.eventType === 'apk_download').length;
    const totalSignups = history.length;
    const successfulReferrals = history.filter(
      (r) => Boolean(r.isQualified || r.firstTaskCompleted || (r.commissionEarned || 0) > 0)
    ).length;
    if (user && (user.referralCount || 0) !== totalSignups) {
      user.referralCount = totalSignups;
    }
    return {
      referralCode: user?.referralCode || '',
      linkClicks,
      apkDownloads,
      totalSignups,
      successfulReferrals,
      conversionRate: totalSignups > 0 ? Number(((successfulReferrals / totalSignups) * 100).toFixed(1)) : 0
    };
  }

  private applyReferralCode(userId: string, rawCode: string): {
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
    if (referrer.id === user.id || referrer.email.toLowerCase() === user.email.toLowerCase()) {
      throw new Error('You cannot apply your own referral code.');
    }
    if (referrer.referredBy === user.id) {
      throw new Error('Mutual/circular referral is not permitted.');
    }
    if (user.referredBy && user.referredBy !== referrer.id) {
      throw new Error('A referral partner is already linked to your account.');
    }

    user.referredBy = referrer.id;
    let record = this.data.referrals.find(
      (r) => r.referrerId === referrer.id && r.referredUserId === user.id
    );
    if (!record) {
      record = {
        id: this.makeUniqueId('ref'),
        referrerId: referrer.id,
        referredUserId: user.id,
        referredUserName: user.name,
        commissionEarned: 0,
        firstTaskCompleted: Boolean(user.firstTaskCompleted),
        firstTaskBonusEarned: 0,
        createdAt: new Date().toISOString()
      };
      this.data.referrals.unshift(record);
    }
    const stats = this.getReferralStats(referrer.id);
    this.save();
    this.emit('referral_bound', {
      referrerId: referrer.id,
      referredUserId: user.id,
      referralRecord: record,
      tracking: stats
    });
    return { referrer, user, referralRecord: record, stats };
  }

  private trackReferralEvent(
    rawCode: string,
    eventType: 'click' | 'apk_download',
    source = 'landing'
  ): { tracked: boolean; referrerId?: string; stats?: ReferralTrackingStats; tracking?: ReferralTrackingStats } {
    const code = normalizeReferralCodeInput(rawCode);
    if (!code) return { tracked: false };
    const referrer = this.getUserByReferralCode(code);
    if (!referrer || referrer.status !== 'active') return { tracked: false };
    if (!this.data.referralTrackingTotals || typeof this.data.referralTrackingTotals !== 'object') {
      this.data.referralTrackingTotals = {};
    }
    const bucket = this.data.referralTrackingTotals[referrer.id] || { linkClicks: 0, apkDownloads: 0 };
    if (eventType === 'apk_download') bucket.apkDownloads += 1;
    else bucket.linkClicks += 1;
    this.data.referralTrackingTotals[referrer.id] = bucket;

    if (!Array.isArray(this.data.referralEvents)) this.data.referralEvents = [];
    this.data.referralEvents.unshift({
      id: this.makeUniqueId(`reft-${eventType}`),
      referralCode: referrer.referralCode,
      referrerId: referrer.id,
      eventType,
      source: String(source || 'landing').slice(0, 60),
      createdAt: new Date().toISOString()
    });
    if (this.data.referralEvents.length > 2000) this.data.referralEvents.length = 2000;
    const stats = this.getReferralStats(referrer.id);
    this.save();
    this.emit('referral_tracked', {
      referrerId: referrer.id,
      referralCode: referrer.referralCode,
      eventType,
      stats,
      tracking: stats
    });
    return { tracked: true, referrerId: referrer.id, stats, tracking: stats };
  }

  private syncUserVolumeVBadge(user: User, emitEvents = true): boolean {
    const txVolume = this.data.transactions
      .filter((t) => t.userId === user.id && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    const totalVolume = Number(Math.max(txVolume, (user.totalDeposited || 0) + (user.totalWithdrawn || 0)).toFixed(2));
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
          `User ${user.name} (${user.id}) unlocked Colorful V-Badge ($${totalVolume.toFixed(2)} USDT volume)`
        );
        this.emit('volume_vbadge_unlocked', {
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

  private createUser(input: {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    avatar?: string;
    referredByCode?: string;
  }): User {
    const emailClean = input.email.trim().toLowerCase();
    const userId = this.generateUniqueUserId();
    const referralCode = this.generateUniqueReferralCode();

    let referrer: User | undefined;
    if (input.referredByCode) {
      const normalizedRef = normalizeReferralCodeInput(input.referredByCode);
      if (normalizedRef) {
        const found = this.getUserByReferralCode(normalizedRef);
        if (found && found.status === 'active' && found.email.toLowerCase() !== emailClean) {
          referrer = found;
        }
      }
    }

    const nowIso = new Date().toISOString();
    const newUser: User = {
      id: userId,
      name: input.name.trim(),
      email: emailClean,
      googleId: input.googleId,
      avatar:
        input.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      balance: 1.0,
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
    if (input.password && input.password.trim()) {
      this.data.userPasswords[emailClean] = input.password;
    }

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

    let referralRecord: ReferralRecord | undefined;
    if (referrer) {
      referrer.referralCount = (referrer.referralCount || 0) + 1;
      referralRecord = {
        id: this.makeUniqueId('ref'),
        referrerId: referrer.id,
        referredUserId: newUser.id,
        referredUserName: newUser.name,
        commissionEarned: 0,
        firstTaskCompleted: false,
        firstTaskBonusEarned: 0,
        createdAt: nowIso
      };
      this.data.referrals.unshift(referralRecord);
    }

    this.save();
    this.logAudit('USER_REGISTERED', `New user registered: ${newUser.name} (${newUser.id})`);
    this.emit('user_registered', newUser);
    if (referrer && referralRecord) {
      this.emit('referral_bound', {
        referrerId: referrer.id,
        referredUserId: newUser.id,
        referralRecord,
        tracking: this.getReferralStats(referrer.id)
      });
    }
    return newUser;
  }

  private awardFirstClaimReferralBonus(
    user: User,
    reward: number,
    claimTitle: string,
    claimRecordId: string
  ): { referrerId: string; bonusAmount: number; bonusPercent: number } | undefined {
    const previousClaimsCount = this.data.claims.filter((c) => c.userId === user.id).length;
    if (previousClaimsCount !== 1 || user.firstTaskBonusPaid) return undefined;

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
    this.data.transactions.unshift({
      id: `tx-reftask-${Date.now()}`,
      userId: referrer.id,
      type: 'referral_commission',
      amount: bonusAmount,
      balanceAfter: referrer.balance,
      description: `${bonusPercent}% First-Claim Referral Bonus from ${user.name} (${claimTitle})`,
      status: 'completed',
      referenceId: claimRecordId,
      createdAt: nowIso
    });

    const existingRef = this.data.referrals.find(
      (r) => r.referrerId === referrer.id && r.referredUserId === user.id
    );
    if (existingRef) {
      existingRef.commissionEarned = Number((existingRef.commissionEarned + bonusAmount).toFixed(2));
      existingRef.firstTaskCompleted = true;
      existingRef.firstTaskBonusEarned = bonusAmount;
      existingRef.firstTaskCompletedAt = nowIso;
      existingRef.isQualified = true;
      existingRef.qualifiedAt = existingRef.qualifiedAt || nowIso;
      existingRef.qualificationSource = 'first_task';
    } else {
      this.data.referrals.unshift({
        id: `ref-task-${Date.now()}`,
        referrerId: referrer.id,
        referredUserId: user.id,
        referredUserName: user.name,
        commissionEarned: bonusAmount,
        firstTaskCompleted: true,
        firstTaskBonusEarned: bonusAmount,
        firstTaskCompletedAt: nowIso,
        isQualified: true,
        qualifiedAt: nowIso,
        qualificationSource: 'first_task',
        createdAt: nowIso
      });
    }

    const firstTaskBonus = { referrerId: referrer.id, bonusAmount, bonusPercent };
    this.emit('referral_bonus_earned', {
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

  private sanitizeDepositNetwork(raw: any): DepositNetworkConfig {
    const rawId = String(raw?.id || raw?.code || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '')
      .slice(0, 24);
    if (!rawId) throw new Error('Market ID is required.');
    const name = String(raw.name || raw.code || rawId).trim().slice(0, 80);
    const code = String(raw.code || rawId).trim().slice(0, 40);
    const shortLabel = String(raw.shortLabel || `USDT ${rawId}`).trim().slice(0, 40);
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
      ...(typeof raw.logoKey === 'string' && raw.logoKey.trim()
        ? { logoKey: raw.logoKey.trim().toLowerCase() }
        : {}),
      walletAddress,
      minDeposit: Number(minDepNum.toFixed(4)),
      estimatedTime: String(raw.estimatedTime || '~2 mins').trim().slice(0, 48),
      confirmations: String(raw.confirmations || '1 Confirmation').trim().slice(0, 64),
      feeLabel: String(raw.feeLabel || '0 USDT').trim().slice(0, 32),
      explorerTxBase: String(raw.explorerTxBase || 'https://bscscan.com/tx/').trim(),
      enabled
    };
  }

  private checkAdminAuth(headers: Record<string, string>): { ok: boolean; status: number; error?: string; ownerId?: string } {
    const token = (headers['x-admin-token'] || headers['authorization']?.replace(/^Bearer\s+/i, '') || '').trim();
    if (!token || !this.data.adminTokens.includes(token)) {
      return { ok: false, status: 401, error: 'Unauthorized: Valid admin authentication required' };
    }
    const boundUserId = this.data.adminTokenOwners[token];
    const headerUserId = (headers['x-user-id'] || '').trim();
    const effectiveUserId = headerUserId || boundUserId;
    const owner = effectiveUserId ? this.getUserById(effectiveUserId) : undefined;
    if (!owner || !owner.isVerified || owner.status !== 'active' || (boundUserId && headerUserId && boundUserId !== headerUserId)) {
      return { ok: false, status: 403, error: 'Only verified accounts can access the Admin Panel.' };
    }
    return { ok: true, status: 200, ownerId: owner.id };
  }

  public async handle(rawPath: string, init?: RequestInit): Promise<Response> {
    const urlObj = new URL(rawPath, 'https://localhost');
    const pathname = urlObj.pathname;
    const method = (init?.method || 'GET').toUpperCase();

    const headers: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => {
          headers[k.toLowerCase()] = v;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([k, v]) => {
          headers[k.toLowerCase()] = v;
        });
      } else {
        Object.entries(init.headers).forEach(([k, v]) => {
          headers[k.toLowerCase()] = String(v);
        });
      }
    }

    let body: any = {};
    if (init?.body && typeof init.body === 'string') {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = {};
      }
    }

    const json = (payload: any, status = 200) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });

    try {
      // PUBLIC SETTINGS
      if (method === 'GET' && pathname === '/api/settings/public') {
        return json({
          settings: this.data.settings,
          banners: this.data.banners,
          videoBanners: this.data.videoBanners
        });
      }

      // PUBLIC FEED
      if (method === 'GET' && pathname === '/api/activity/public-feed') {
        const maskName = (name: string) => {
          const parts = (name || 'User').trim().split(/\s+/);
          if (parts.length > 1) return `${parts[0]} ${parts[1][0]}.`;
          return parts[0].length > 3 ? `${parts[0].slice(0, 3)}***` : parts[0];
        };
        const maskUserId = (id: string) =>
          !id ? 'CEG-***' : id.length > 6 ? `${id.slice(0, 4)}***${id.slice(-3)}` : id;
        const userMap = new Map(this.data.users.map((u) => [u.id, u]));

        const approvedDeposits = this.data.deposits
          .filter((d) => d.status === 'approved')
          .map((d) => {
            const u = userMap.get(d.userId);
            return {
              id: d.id,
              type: 'deposit' as const,
              userName: maskName(d.userName),
              userIdMasked: maskUserId(d.userId),
              isVerified: Boolean(u?.isVerified),
              hasVolumeVBadge: Boolean(u?.hasVolumeVBadge),
              amount: d.amount,
              network: d.network || 'USDT BEP-20',
              status: 'Success' as const,
              timestamp: d.processedAt || d.createdAt
            };
          });

        const approvedWithdrawals = this.data.withdrawals
          .filter((w) => w.status === 'approved')
          .map((w) => {
            const u = userMap.get(w.userId);
            return {
              id: w.id,
              type: 'withdrawal' as const,
              userName: maskName(w.userName),
              userIdMasked: maskUserId(w.userId),
              isVerified: Boolean(u?.isVerified),
              hasVolumeVBadge: Boolean(u?.hasVolumeVBadge),
              amount: w.amount,
              network: w.network || 'USDT BEP-20',
              status: 'Success' as const,
              timestamp: w.processedAt || w.createdAt
            };
          });

        const feed = [...approvedDeposits, ...approvedWithdrawals].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        return json({ feed });
      }

      // AUTH: REGISTER
      if (method === 'POST' && pathname === '/api/auth/register') {
        const { name, email, password, referralCode } = body || {};
        if (!name || !email) {
          return json({ error: 'Name and email are required' }, 400);
        }
        const existing = this.getUserByEmail(email);
        if (existing) {
          return json({ error: 'An account with this email already exists' }, 400);
        }
        const user = this.createUser({
          name: String(name),
          email: String(email),
          password: typeof password === 'string' ? password : undefined,
          referredByCode: referralCode
        });
        return json({ success: true, user });
      }

      // AUTH: LOGIN
      if (method === 'POST' && pathname === '/api/auth/login') {
        const { email, password } = body || {};
        if (!email) {
          return json({ error: 'Email is required' }, 400);
        }
        const emailLower = String(email).trim().toLowerCase();
        const user = this.getUserByEmail(emailLower);
        if (!user) {
          return json({ error: 'User not found. Please register or use Google Sign-In.' }, 404);
        }
        if (user.status === 'banned') {
          return json(
            {
              error: `Account Banned: ${user.banReason || 'Violation of terms'}`,
              status: 'banned',
              user
            },
            403
          );
        }
        const storedPw = this.data.userPasswords[emailLower];
        if (storedPw && typeof password === 'string' && password.length > 0 && password !== storedPw) {
          return json({ error: 'Incorrect password. Please check and try again.' }, 401);
        }
        user.lastLoginAt = new Date().toISOString();
        this.save();
        return json({ success: true, user });
      }

      // AUTH: GOOGLE SIGN-IN
      if (method === 'POST' && pathname === '/api/auth/google') {
        const { email, name, googleId, avatar, referralCode } = body || {};
        if (!email) {
          return json({ error: 'Email is required for Google Sign-In' }, 400);
        }
        const cleanEmail = String(email).trim().toLowerCase();
        const cleanReferralCode = normalizeReferralCodeInput(referralCode) || undefined;
        let user = this.getUserByEmail(cleanEmail);
        if (!user) {
          user = this.createUser({
            name: String(name || cleanEmail.split('@')[0]),
            email: cleanEmail,
            googleId: googleId || `google-${Date.now()}`,
            avatar:
              avatar ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            referredByCode: cleanReferralCode
          });
        } else {
          user.lastLoginAt = new Date().toISOString();
          if (googleId) user.googleId = googleId;
          if (avatar && !user.avatar) user.avatar = avatar;
          if (!user.referredBy && cleanReferralCode) {
            try {
              this.applyReferralCode(user.id, cleanReferralCode);
            } catch {
              // Optional code never blocks sign-in
            }
          }
          this.save();
        }
        if (user.status === 'banned') {
          return json(
            {
              error: `Account Banned: ${user.banReason || 'Violation of platform rules'}`,
              status: 'banned',
              user
            },
            403
          );
        }
        return json({ success: true, user });
      }

      // AUTH: ADMIN LOGIN
      if (method === 'POST' && pathname === '/api/auth/admin-login') {
        const { email, password, userId } = body || {};
        const appUser = userId ? this.getUserById(userId) : undefined;
        if (!appUser || !appUser.isVerified || appUser.status !== 'active') {
          return json({ error: 'Only verified accounts can access the Admin Panel.' }, 403);
        }
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const isValidEmail = normalizedEmail === 'admin@cryptoearngo.com' || normalizedEmail === 'admin';
        if (!isValidEmail || password !== this.data.adminPassword) {
          return json({ error: 'Invalid admin email or password!' }, 401);
        }
        const token = randomHexToken(24);
        this.data.adminTokens.push(token);
        this.data.adminTokenOwners[token] = appUser.id;
        if (this.data.adminTokens.length > 20) {
          const removed = this.data.adminTokens.slice(0, this.data.adminTokens.length - 20);
          this.data.adminTokens = this.data.adminTokens.slice(-20);
          removed.forEach((tok) => delete this.data.adminTokenOwners[tok]);
        }
        this.save();
        this.logAudit('ADMIN_LOGIN', `Administrator authenticated via verified account (${appUser.id})`);
        return json({
          success: true,
          token,
          admin: {
            id: 'ADMIN-001',
            name: 'Chief Platform Administrator',
            email: 'admin@cryptoearngo.com',
            role: 'admin'
          }
        });
      }

      // AUTH: ADMIN LOGOUT
      if (method === 'POST' && pathname === '/api/auth/admin-logout') {
        const token = (headers['x-admin-token'] || '').trim();
        if (token) {
          this.data.adminTokens = this.data.adminTokens.filter((t) => t !== token);
          delete this.data.adminTokenOwners[token];
          this.save();
        }
        return json({ success: true });
      }

      // AUTH: DEMO USERS
      if (method === 'GET' && pathname === '/api/auth/demo-users') {
        return json({ users: this.data.users });
      }

      // SEARCH PUBLIC USER BY ID
      if (method === 'GET' && pathname === '/api/users/search') {
        const rawUserId = urlObj.searchParams.get('userId') || '';
        const q = rawUserId.trim().toUpperCase();
        if (!q || q.includes('@') || q.length < 3 || !/^[A-Z0-9-]+$/.test(q)) {
          return json({ error: 'Please search using a valid User ID only (e.g. CEG-882941).' }, 400);
        }
        const user = this.data.users.find((u) => {
          const uid = u.id.toUpperCase();
          return uid === q || (!q.includes('-') && uid === `CEG-${q}`);
        });
        if (!user) {
          return json({ error: 'No account found with this User ID.' }, 404);
        }
        this.syncUserVolumeVBadge(user, false);
        const userClaims = this.data.claims
          .filter((c) => c.userId === user.id)
          .slice()
          .sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
        const completedTasksCount = userClaims.length;
        const activityScore = (user.totalDeposited || 0) + (user.totalEarned || 0) + completedTasksCount * 5;
        let level = 1;
        let levelTitle = 'Starter';
        let badgeTitle = 'Starter Member';
        if (activityScore >= 1500) {
          level = 6; levelTitle = 'Diamond VIP'; badgeTitle = 'Diamond VIP';
        } else if (activityScore >= 750) {
          level = 5; levelTitle = 'Platinum VIP'; badgeTitle = 'Platinum VIP';
        } else if (activityScore >= 300) {
          level = 4; levelTitle = 'Gold VIP'; badgeTitle = 'Gold Member';
        } else if (activityScore >= 100) {
          level = 3; levelTitle = 'Silver Member'; badgeTitle = 'Silver Member';
        } else if (activityScore >= 25) {
          level = 2; levelTitle = 'Bronze Member'; badgeTitle = 'Bronze Member';
        }

        const profile: PublicUserProfile = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          country: user.isVerified && user.country ? user.country : undefined,
          status: user.status,
          isVerified: Boolean(user.isVerified),
          hasVolumeVBadge: Boolean(user.hasVolumeVBadge),
          volumeBadgeUnlockedAt: user.volumeBadgeUnlockedAt,
          totalTransactionVolume: user.totalTransactionVolume || 0,
          paymentBadges: user.isVerified ? user.paymentBadges || [] : [],
          whatsappNumber: user.isVerified && user.whatsappNumber ? user.whatsappNumber : undefined,
          telegramLink: user.isVerified && user.telegramLink ? user.telegramLink : undefined,
          level,
          levelTitle,
          badgeTitle,
          totalDeposited: Number((user.totalDeposited || 0).toFixed(2)),
          totalWithdrawn: Number((user.totalWithdrawn || 0).toFixed(2)),
          completedTasksCount,
          recentCompletedTasks: userClaims.slice(0, 10).map((c) => ({
            id: c.id,
            title: c.taskTitle,
            rewardAmount: Number((c.rewardAmount || 0).toFixed(2)),
            completedAt: c.claimedAt
          })),
          joinedAt: user.createdAt
        };
        return json({ profile });
      }

      // VERIFIED AGENTS LIST (Admin-verified active users)
      if (method === 'GET' && pathname === '/api/agents/verified') {
        const agents: VerifiedAgent[] = this.data.users
          .filter((u) => Boolean(u.isVerified) && u.status === 'active')
          .map((u) => {
            this.syncUserVolumeVBadge(u, false);
            return {
              id: u.id,
              name: u.name,
              avatar: u.avatar,
              country: u.country || undefined,
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
        return json({ agents });
      }

      // USER FULL DATA
      const fullDataMatch = pathname.match(/^\/api\/user\/([^/]+)\/full-data$/);
      if (method === 'GET' && fullDataMatch) {
        const userId = decodeURIComponent(fullDataMatch[1]);
        const user = this.getUserById(userId);
        if (!user) return json({ error: 'User not found' }, 404);
        this.syncUserVolumeVBadge(user, false);
        return json({
          user,
          orders: this.data.orders.filter((o) => o.userId === user.id),
          deposits: this.data.deposits.filter((d) => d.userId === user.id),
          withdrawals: this.data.withdrawals.filter((w) => w.userId === user.id),
          transactions: this.data.transactions.filter((t) => t.userId === user.id),
          tasks: this.data.tasks,
          claims: this.data.claims.filter((c) => c.userId === user.id),
          notifications: this.data.notificationLogs.filter((n) => n.userId === user.id),
          notificationProviders: {
            pushWebhookConfigured: false,
            webhookSecretConfigured: false,
            fcmConfigured: false,
            webPushReady: true
          },
          referralData: (() => {
            const tracking = this.getReferralStats(user.id);
            const allHistory = this.getUserReferralsDedup(user.id);
            const page = allHistory.slice(0, 100);
            return {
              referralCode: user.referralCode,
              referralCount: tracking.totalSignups,
              totalRecords: tracking.totalSignups,
              hasMore: page.length < tracking.totalSignups,
              referralEarnings: user.referralEarnings || 0,
              commissionPercent: this.data.settings.referralCommissionPercent,
              firstTaskBonusPercent: this.data.settings.firstTaskBonusPercent ?? 20,
              tracking,
              history: page
            };
          })()
        });
      }

      // USER NOTIFICATIONS TEST
      const notifTestMatch = pathname.match(/^\/api\/user\/([^/]+)\/notifications\/test$/);
      if (method === 'POST' && notifTestMatch) {
        const user = this.getUserById(decodeURIComponent(notifTestMatch[1]));
        if (!user) return json({ error: 'User not found' }, 404);
        const txType: 'deposit' | 'withdrawal' = body?.type === 'withdrawal' ? 'withdrawal' : 'deposit';
        const isWth = txType === 'withdrawal';
        const sampleTx: Transaction = {
          id: `tx-test-${Date.now()}`,
          userId: user.id,
          type: txType,
          amount: isWth ? -1.0 : 1.0,
          balanceAfter: user.balance,
          description: isWth ? 'Test withdrawal push notification' : 'Test deposit push notification',
          status: 'completed',
          createdAt: new Date().toISOString()
        };
        const log = this.addNotification(
          sampleTx,
          user,
          isWth ? 'Test Withdrawal Push Alert: CryptoEarnGo Active!' : 'Test Deposit Push Alert: CryptoEarnGo Active!',
          `Your account (${user.id}) is connected to real-time Deposit & Withdrawal push notifications. Current balance: $${user.balance.toFixed(2)} USDT.`
        );
        return json({ success: true, log });
      }

      // USER NOTIFICATIONS GET/PUT
      const notifMatch = pathname.match(/^\/api\/user\/([^/]+)\/notifications$/);
      if (notifMatch) {
        const user = this.getUserById(decodeURIComponent(notifMatch[1]));
        if (!user) return json({ error: 'User not found' }, 404);
        if (method === 'GET') {
          return json({
            notifications: this.data.notificationLogs.filter((n) => n.userId === user.id),
            providers: { pushWebhookConfigured: false, fcmConfigured: false, webPushReady: true }
          });
        }
        if (method === 'PUT') {
          if (body?.fcmToken !== undefined) user.fcmToken = String(body.fcmToken).trim();
          if (body?.pushSubscription !== undefined) user.pushSubscription = body.pushSubscription;
          user.notificationPrefs = { pushEnabled: true };
          this.save();
          this.emit('user_updated', user);
          return json({ success: true, user });
        }
      }

      // USER PROFILE GET/PUT
      const userMatch = pathname.match(/^\/api\/user\/([^/]+)$/);
      if (userMatch) {
        const userId = decodeURIComponent(userMatch[1]);
        const user = this.getUserById(userId);
        if (!user) return json({ error: 'User not found' }, 404);
        if (method === 'GET') {
          return json({ user });
        }
        if (method === 'PUT') {
          const { name, avatar, country, paymentBadges, whatsappNumber, telegramLink } = body || {};
          if (name !== undefined) {
            const trimmed = String(name).trim();
            if (!trimmed) return json({ error: 'Name cannot be empty' }, 400);
            user.name = trimmed.slice(0, 60);
          }
          if (avatar !== undefined && String(avatar).trim()) {
            user.avatar = String(avatar).trim();
          }
          if (country !== undefined) {
            const normCountry = String(country || '')
              .trim()
              .toUpperCase()
              .replace(/[^A-Z]/g, '')
              .slice(0, 2);
            if (normCountry && !user.isVerified) {
              return json({ error: 'Only verified accounts can select a country.' }, 400);
            }
            user.country = normCountry || undefined;
          }
          if (paymentBadges !== undefined) {
            if (!Array.isArray(paymentBadges)) return json({ error: 'Invalid paymentBadges format' }, 400);
            const filtered = Array.from(
              new Set(paymentBadges.filter((b: any): b is PaymentMethodBadge => ALLOWED_PAYMENT_BADGES.includes(b)))
            );
            if (filtered.length > 0 && !user.isVerified) {
              return json({ error: 'Your account must be verified to display payment method logos.' }, 400);
            }
            user.paymentBadges = filtered;
          }
          if (whatsappNumber !== undefined) {
            const normWa = sanitizeWhatsappNumber(whatsappNumber);
            if (normWa && !user.isVerified) {
              return json({ error: 'Only verified accounts can link a WhatsApp number.' }, 400);
            }
            user.whatsappNumber = normWa;
          }
          if (telegramLink !== undefined) {
            const normTg = sanitizeTelegramLink(telegramLink);
            if (normTg && !user.isVerified) {
              return json({ error: 'Only verified accounts can link a Telegram handle.' }, 400);
            }
            user.telegramLink = normTg;
          }
          this.save();
          this.emit('user_updated', user);
          return json({ user });
        }
      }

      // WEBHOOK PUSH NOTIFICATIONS
      if (pathname === '/api/webhooks/push-notifications') {
        if (method === 'GET') {
          return json({
            status: 'active',
            endpoint: '/api/webhooks/push-notifications',
            supportedEvents: ['deposit', 'withdrawal'],
            channel: 'push',
            secretRequired: false
          });
        }
        if (method === 'POST') {
          const rawUserId = String(body?.userId || '').trim();
          const rawType = String(body?.type || body?.transactionType || '').trim().toLowerCase();
          if (!rawUserId) return json({ error: 'userId is required' }, 400);
          if (rawType !== 'deposit' && rawType !== 'withdrawal') {
            return json({ error: 'Invalid type. Only "deposit" and "withdrawal" are supported.' }, 400);
          }
          const user = this.getUserById(rawUserId);
          if (!user) return json({ error: 'User not found' }, 404);
          const parsedAmount = Number(body?.amount ?? 0);
          const tx: Transaction = {
            id: `wh-${Date.now()}`,
            userId: user.id,
            type: rawType as 'deposit' | 'withdrawal',
            amount: rawType === 'withdrawal' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount),
            balanceAfter: user.balance,
            description: `${rawType === 'deposit' ? 'Deposit' : 'Withdrawal'} Webhook Push Notification`,
            status: 'completed',
            createdAt: new Date().toISOString()
          };
          const log = this.addNotification(tx, user, body?.title, body?.message);
          return json({ success: true, event: 'push_notification', notification: log });
        }
      }

      // PRODUCTS
      if (method === 'GET' && pathname === '/api/products') {
        return json({ products: this.data.products });
      }

      if (method === 'POST' && pathname === '/api/products/buy') {
        const { userId, productId } = body || {};
        const user = this.getUserById(userId);
        if (!user) return json({ error: 'User not found' }, 400);
        if (user.status !== 'active') return json({ error: `Account is ${user.status}. Purchases are disabled.` }, 400);
        const product = this.data.products.find((p) => p.id === productId);
        if (!product) return json({ error: 'Product not found' }, 400);
        if (!product.isAvailable || product.stock <= 0) return json({ error: 'Product is out of stock' }, 400);
        if (user.balance < product.price) {
          return json({ error: `Insufficient USDT balance. Current: $${user.balance.toFixed(2)}, Required: $${product.price.toFixed(2)}` }, 400);
        }

        user.balance = Number((user.balance - product.price).toFixed(2));
        product.stock -= 1;
        const durationDays = product.durationDays > 0 ? Math.floor(product.durationDays) : 30;
        const dailyRewardAmount = product.dailyRewardAmount || Number((product.price * 0.05).toFixed(2));
        const nowMs = Date.now();
        const order: Order = {
          id: `ord-${nowMs}`,
          userId: user.id,
          userEmail: user.email,
          productId: product.id,
          productTitle: product.title,
          productPrice: product.price,
          dailyRewardAmount,
          durationDays,
          daysClaimed: 0,
          totalEarnedFromOrder: 0,
          expiresAt: new Date(nowMs + durationDays * 86400000).toISOString(),
          status: 'completed',
          createdAt: new Date(nowMs).toISOString()
        };
        this.data.orders.unshift(order);
        this.data.transactions.unshift({
          id: `tx-${nowMs}`,
          userId: user.id,
          type: 'purchase',
          amount: -product.price,
          balanceAfter: user.balance,
          description: `Purchased "${product.title}"`,
          status: 'completed',
          referenceId: order.id,
          createdAt: new Date(nowMs).toISOString()
        });
        this.syncUserVolumeVBadge(user);
        this.save();
        this.emit('order_created', { order, user, product });
        return json({ success: true, order, updatedBalance: user.balance });
      }

      // ORDERS DAILY CLAIM
      const orderClaimMatch = pathname.match(/^\/api\/orders\/([^/]+)\/claim$/);
      if (method === 'POST' && orderClaimMatch) {
        const orderId = decodeURIComponent(orderClaimMatch[1]);
        const userId = String(body?.userId || '').trim();
        const user = this.getUserById(userId);
        if (!user) return json({ error: 'User not found' }, 400);
        const order = this.data.orders.find((o) => o.id === orderId && o.userId === user.id);
        if (!order) return json({ error: 'Purchased product order not found' }, 400);
        const durationDays = order.durationDays || 30;
        const dailyReward = order.dailyRewardAmount || 0;
        if (dailyReward <= 0) return json({ error: 'No daily income configured.' }, 400);
        if ((order.daysClaimed || 0) >= durationDays) {
          return json({ error: `All ${durationDays} days already claimed.` }, 400);
        }
        const ONE_DAY_MS = 86400000;
        if (order.lastClaimedAt) {
          const elapsed = Date.now() - new Date(order.lastClaimedAt).getTime();
          if (elapsed < ONE_DAY_MS) {
            const remMins = Math.max(1, Math.ceil((ONE_DAY_MS - elapsed) / 60000));
            return json({ error: `Please wait ${Math.floor(remMins / 60)}h ${remMins % 60}m before claiming again.` }, 400);
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
          id: `clm-prod-${Date.now()}`,
          userId: user.id,
          taskId: order.id,
          taskTitle: claimTitle,
          rewardAmount: dailyReward,
          claimedAt: nowIso
        };
        this.data.claims.unshift(claimRecord);
        this.data.transactions.unshift({
          id: `tx-prodclm-${Date.now()}`,
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
        this.syncUserVolumeVBadge(user);
        this.save();
        this.emit('order_updated', { order, user });
        this.emit('reward_claimed', { user, claimRecord, firstTaskBonus });
        return json({
          success: true,
          order,
          reward: dailyReward,
          balance: user.balance,
          nextClaimAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
          firstTaskBonus
        });
      }

      const ordersUserMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
      if (method === 'GET' && ordersUserMatch) {
        return json({ orders: this.data.orders.filter((o) => o.userId === decodeURIComponent(ordersUserMatch[1])) });
      }

      // DEPOSITS
      if (method === 'POST' && pathname === '/api/deposits/submit') {
        const { userId, amount, txHash, network } = body || {};
        const user = this.getUserById(userId);
        if (!user) return json({ error: 'User not found' }, 400);
        if (user.status !== 'active') return json({ error: `Account is ${user.status}. Deposits not permitted.` }, 400);
        const numAmount = Number(amount);
        if (!Number.isFinite(numAmount) || numAmount <= 0) return json({ error: 'Invalid deposit amount' }, 400);
        const networks = this.data.settings.depositNetworks || DEFAULT_DEPOSIT_NETWORKS;
        const selected = network
          ? networks.find(
              (n) =>
                n.id.toLowerCase() === String(network).toLowerCase() ||
                n.shortLabel.toLowerCase() === String(network).toLowerCase()
            )
          : networks.find((n) => n.enabled) || networks[0];
        const min = selected?.minDeposit ?? this.data.settings.minDeposit ?? 10;
        const netLabel = selected?.shortLabel ?? 'USDT BEP-20';
        if (numAmount < min) return json({ error: `Minimum deposit on ${netLabel} is $${min} USDT.` }, 400);
        if (this.data.deposits.some((d) => d.txHash.toLowerCase() === String(txHash).trim().toLowerCase())) {
          return json({ error: 'This transaction hash has already been submitted.' }, 400);
        }
        const deposit: DepositRequest = {
          id: `dep-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          amount: numAmount,
          txHash: String(txHash).trim(),
          network: netLabel,
          walletAddress: selected?.walletAddress || this.data.settings.usdtBep20Address,
          status: 'pending',
          notes: `Submitted via ${netLabel}. Waiting for admin approval.`,
          createdAt: new Date().toISOString()
        };
        this.data.deposits.unshift(deposit);
        this.save();
        this.logAudit('DEPOSIT_SUBMITTED', `Deposit of $${numAmount} ${netLabel} submitted by ${user.name} (${user.id})`);
        this.emit('deposit_submitted', deposit);
        return json({ success: true, deposit });
      }

      const depUserMatch = pathname.match(/^\/api\/deposits\/([^/]+)$/);
      if (method === 'GET' && depUserMatch) {
        return json({ deposits: this.data.deposits.filter((d) => d.userId === decodeURIComponent(depUserMatch[1])) });
      }

      // WITHDRAWALS
      if (method === 'POST' && pathname === '/api/withdrawals/submit') {
        const { userId, amount, toAddress } = body || {};
        const user = this.getUserById(userId);
        if (!user) return json({ error: 'User not found' }, 400);
        if (user.status !== 'active') return json({ error: `Account is ${user.status}. Withdrawals not permitted.` }, 400);
        const numAmount = Number(amount);
        const min = this.data.settings.minWithdrawal || 2;
        if (!Number.isFinite(numAmount) || numAmount < min) {
          return json({ error: `Minimum withdrawal is $${min} USDT BEP-20.` }, 400);
        }
        if (user.balance < numAmount) {
          return json({ error: `Insufficient balance. Current: $${user.balance.toFixed(2)}` }, 400);
        }
        const cleanAddress = String(toAddress || '').trim();
        if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
          return json({ error: 'Invalid USDT BEP-20 address format (must start with 0x and be 42 chars).' }, 400);
        }
        const feePct = this.data.settings.withdrawalFeePercent || 1.0;
        const fee = Number(((numAmount * feePct) / 100).toFixed(2));
        const finalAmount = Number((numAmount - fee).toFixed(2));
        user.balance = Number((user.balance - numAmount).toFixed(2));
        const withdrawal: WithdrawalRequest = {
          id: `wth-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          amount: numAmount,
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
          id: `tx-wth-${Date.now()}`,
          userId: user.id,
          type: 'withdrawal',
          amount: -numAmount,
          balanceAfter: user.balance,
          description: `Withdrawal request to ${cleanAddress.slice(0, 6)}...${cleanAddress.slice(-4)}`,
          status: 'pending',
          referenceId: withdrawal.id,
          createdAt: new Date().toISOString()
        });
        this.save();
        this.logAudit('WITHDRAWAL_REQUESTED', `User ${user.name} (${user.id}) requested $${numAmount} USDT`);
        this.emit('withdrawal_submitted', { withdrawal, user });
        return json({ success: true, withdrawal });
      }

      const wthUserMatch = pathname.match(/^\/api\/withdrawals\/([^/]+)$/);
      if (method === 'GET' && wthUserMatch) {
        return json({ withdrawals: this.data.withdrawals.filter((w) => w.userId === decodeURIComponent(wthUserMatch[1])) });
      }

      // REWARDS
      if (method === 'GET' && pathname === '/api/rewards/tasks') {
        const userId = urlObj.searchParams.get('userId') || '';
        return json({
          tasks: this.data.tasks,
          userClaims: userId ? this.data.claims.filter((c) => c.userId === userId) : []
        });
      }

      if (method === 'POST' && (pathname === '/api/rewards/claim' || pathname === '/api/daily-claim')) {
        const userId = String(body?.userId || '').trim();
        const taskId = pathname === '/api/daily-claim' ? 'daily-claim' : String(body?.taskId || 'daily-claim');
        const user = this.getUserById(userId);
        if (!user) return json({ error: 'User not found' }, 400);
        if (user.status !== 'active') return json({ error: `Account is ${user.status}. Claims are disabled.` }, 400);
        const task = this.data.tasks.find((t) => t.id === taskId);
        const reward = task ? task.rewardAmount : Number(this.data.settings.claimRewardAmount ?? 0.5);
        const title = task ? task.title : this.data.settings.dailyClaimTitle || 'Daily Claim Bonus';
        const cooldown = task ? task.cooldownMinutes : Number(this.data.settings.claimIntervalMinutes ?? 1440);

        if (cooldown === 0 && this.data.claims.some((c) => c.userId === user.id && c.taskId === taskId)) {
          return json({ error: 'You have already completed and claimed this one-time task.' }, 400);
        }
        if (cooldown > 0) {
          const recent = this.data.claims
            .filter((c) => c.userId === user.id && c.taskId === taskId)
            .sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime())[0];
          if (recent) {
            const diffMin = (Date.now() - new Date(recent.claimedAt).getTime()) / 60000;
            if (diffMin < cooldown) {
              return json({ error: `Reward is on cooldown. Please wait ${Math.ceil(cooldown - diffMin)} more minute(s).` }, 400);
            }
          }
        }
        user.balance = Number((user.balance + reward).toFixed(2));
        user.totalEarned = Number((user.totalEarned + reward).toFixed(2));
        const claimRecord: ClaimHistoryItem = {
          id: `clm-${Date.now()}`,
          userId: user.id,
          taskId,
          taskTitle: title,
          rewardAmount: reward,
          claimedAt: new Date().toISOString()
        };
        this.data.claims.unshift(claimRecord);
        this.data.transactions.unshift({
          id: `tx-clm-${Date.now()}`,
          userId: user.id,
          type: 'reward_claim',
          amount: reward,
          balanceAfter: user.balance,
          description: `Claim: ${title}`,
          status: 'completed',
          referenceId: taskId,
          createdAt: new Date().toISOString()
        });
        const firstTaskBonus = this.awardFirstClaimReferralBonus(user, reward, title, claimRecord.id);
        this.syncUserVolumeVBadge(user);
        this.save();
        this.emit('reward_claimed', { user, claimRecord, firstTaskBonus });
        return json({
          success: true,
          reward,
          balance: user.balance,
          nextClaimAt: new Date(Date.now() + cooldown * 60000).toISOString(),
          firstTaskBonus
        });
      }

      // REFERRALS
      const refValidateMatch = pathname.match(/^\/api\/referrals\/validate\/([^/]+)$/);
      if (method === 'GET' && refValidateMatch) {
        const code = normalizeReferralCodeInput(decodeURIComponent(refValidateMatch[1]));
        const referrer = this.getUserByReferralCode(code);
        const tracking = referrer ? this.getReferralStats(referrer.id) : null;
        return json({
          valid: Boolean(referrer),
          referrerName: referrer ? referrer.name : null,
          referrerAvatar: referrer ? referrer.avatar : null,
          referrerVerified: referrer ? Boolean(referrer.isVerified) : false,
          referralCode: referrer ? referrer.referralCode : null,
          firstTaskBonusPercent: this.data.settings.firstTaskBonusPercent ?? 20,
          commissionPercent: this.data.settings.referralCommissionPercent ?? 10,
          appVersion: this.data.settings.appVersion || 'v2.4.1',
          apkDownloadUrl: resolveAbsoluteApkUrl(this.data.settings.apkDownloadUrl, this.data.settings.appVersion),
          apkReleaseNotes: this.data.settings.apkReleaseNotes,
          tracking
        });
      }

      if (method === 'POST' && pathname === '/api/referrals/track') {
        const eventType = body?.eventType === 'apk_download' ? 'apk_download' : 'click';
        const res = this.trackReferralEvent(String(body?.referralCode || ''), eventType, String(body?.source || 'landing'));
        return json({ success: true, ...res });
      }

      if (method === 'POST' && pathname === '/api/referrals/apply') {
        try {
          const userId = String(body?.userId || '').trim();
          const rawCode = String(body?.referralCode || body?.code || '').trim();
          if (!userId) return json({ error: 'Please sign in first to apply a referral code.' }, 400);
          const { referrer, user, referralRecord, stats } = this.applyReferralCode(userId, rawCode);
          return json({
            success: true,
            user,
            referrerName: referrer.name,
            referrerId: referrer.id,
            referralCode: referrer.referralCode,
            referralRecord,
            tracking: stats
          });
        } catch (err: any) {
          return json({ error: err?.message || 'Unable to apply referral code.' }, 400);
        }
      }

      const refUserMatch = pathname.match(/^\/api\/referrals\/([^/]+)$/);
      if (method === 'GET' && refUserMatch) {
        const user = this.getUserById(decodeURIComponent(refUserMatch[1]));
        if (!user) return json({ error: 'User not found' }, 404);
        const tracking = this.getReferralStats(user.id);
        const allHistory = this.getUserReferralsDedup(user.id);
        const rawLimit = Number(urlObj.searchParams.get('limit') ?? 100);
        const rawOffset = Number(urlObj.searchParams.get('offset') ?? 0);
        const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(500, Math.floor(rawLimit)) : 100;
        const safeOffset = Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;
        const page = allHistory.slice(safeOffset, safeOffset + safeLimit);
        return json({
          referralCode: user.referralCode,
          referralCount: tracking.totalSignups,
          totalRecords: tracking.totalSignups,
          hasMore: safeOffset + page.length < tracking.totalSignups,
          referralEarnings: user.referralEarnings || 0,
          commissionPercent: this.data.settings.referralCommissionPercent,
          firstTaskBonusPercent: this.data.settings.firstTaskBonusPercent ?? 20,
          tracking,
          history: page
        });
      }

      // TRANSACTIONS
      const txUserMatch = pathname.match(/^\/api\/transactions\/([^/]+)$/);
      if (method === 'GET' && txUserMatch) {
        return json({ transactions: this.data.transactions.filter((t) => t.userId === decodeURIComponent(txUserMatch[1])) });
      }

      // ADMIN ROUTES
      if (pathname.startsWith('/api/admin')) {
        const auth = this.checkAdminAuth(headers);
        if (!auth.ok) {
          return json({ error: auth.error }, auth.status);
        }

        if (method === 'POST' && pathname === '/api/admin/change-password') {
          const { currentPassword, newPassword } = body || {};
          if (!currentPassword || currentPassword !== this.data.adminPassword) {
            return json({ error: 'Current password is incorrect' }, 400);
          }
          const trimmed = String(newPassword || '').trim();
          if (trimmed.length < 6) return json({ error: 'New password must be at least 6 characters' }, 400);
          this.data.adminPassword = trimmed;
          const newToken = randomHexToken(24);
          this.data.adminTokens = [newToken];
          this.data.adminTokenOwners = auth.ownerId ? { [newToken]: auth.ownerId } : {};
          this.save();
          this.logAudit('ADMIN_PASSWORD_CHANGED', 'Administrator updated the Admin Panel access password');
          return json({ success: true, token: newToken, message: 'Admin password updated successfully!' });
        }

        if (method === 'GET' && pathname === '/api/admin/stats') {
          const pendingDeposits = this.data.deposits.filter((d) => d.status === 'pending');
          const pendingWithdrawals = this.data.withdrawals.filter((w) => w.status === 'pending');
          const stats: AdminStats = {
            totalUsers: this.data.users.length,
            activeUsers: this.data.users.filter((u) => u.status === 'active').length,
            bannedUsers: this.data.users.filter((u) => u.status === 'banned').length,
            totalVolume: Number(
              this.data.deposits
                .filter((d) => d.status === 'approved')
                .reduce((sum, d) => sum + d.amount, 0)
                .toFixed(2)
            ),
            pendingDepositsCount: pendingDeposits.length,
            pendingDepositsAmount: Number(pendingDeposits.reduce((s, d) => s + d.amount, 0).toFixed(2)),
            pendingWithdrawalsCount: pendingWithdrawals.length,
            pendingWithdrawalsAmount: Number(pendingWithdrawals.reduce((s, w) => s + w.amount, 0).toFixed(2)),
            totalOrdersCount: this.data.orders.length,
            totalProductsCount: this.data.products.length
          };
          return json({ stats });
        }

        if (method === 'GET' && pathname === '/api/admin/users') {
          return json({ users: this.data.users });
        }

        const userStatusMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/status$/);
        if (method === 'POST' && userStatusMatch) {
          const user = this.getUserById(decodeURIComponent(userStatusMatch[1]));
          if (!user) return json({ error: 'User not found' }, 400);
          user.status = body.status;
          if (body.reason !== undefined) user.banReason = body.reason;
          this.save();
          this.emit('user_status_changed', { userId: user.id, status: user.status, banReason: user.banReason });
          return json({ success: true, user });
        }

        const userVerifyMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/verify$/);
        if (method === 'POST' && userVerifyMatch) {
          const user = this.getUserById(decodeURIComponent(userVerifyMatch[1]));
          if (!user) return json({ error: 'User not found' }, 400);
          user.isVerified = Boolean(body.isVerified);
          this.save();
          this.emit('user_verified_changed', { userId: user.id, isVerified: user.isVerified, user });
          return json({ success: true, user });
        }

        const userIdUpdateMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/id$/);
        if (method === 'PUT' && userIdUpdateMatch) {
          const user = this.getUserById(decodeURIComponent(userIdUpdateMatch[1]));
          if (!user) return json({ error: 'User not found' }, 400);
          if (!user.isVerified) return json({ error: 'Only verified accounts can have their User ID edited.' }, 400);
          const newId = String(body?.newUserId || '').trim().toUpperCase();
          if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(newId)) {
            return json({ error: 'Please enter a valid User ID (e.g. CEG-VIP01).' }, 400);
          }
          const oldId = user.id;
          if (newId !== oldId) {
            if (this.data.users.some((u) => u.id.toUpperCase() === newId && u.id !== oldId)) {
              return json({ error: 'This User ID is already in use by another account.' }, 400);
            }
            user.id = newId;
            this.data.users.forEach((u) => { if (u.referredBy === oldId) u.referredBy = newId; });
            this.data.orders.forEach((o) => { if (o.userId === oldId) o.userId = newId; });
            this.data.deposits.forEach((d) => { if (d.userId === oldId) d.userId = newId; });
            this.data.withdrawals.forEach((w) => { if (w.userId === oldId) w.userId = newId; });
            this.data.transactions.forEach((t) => { if (t.userId === oldId) t.userId = newId; });
            this.data.referrals.forEach((r) => {
              if (r.referrerId === oldId) r.referrerId = newId;
              if (r.referredUserId === oldId) r.referredUserId = newId;
            });
            this.data.claims.forEach((c) => { if (c.userId === oldId) c.userId = newId; });
            this.data.notificationLogs.forEach((n) => { if (n.userId === oldId) n.userId = newId; });
            Object.keys(this.data.adminTokenOwners).forEach((tok) => {
              if (this.data.adminTokenOwners[tok] === oldId) this.data.adminTokenOwners[tok] = newId;
            });
            this.save();
            this.emit('user_id_updated', { oldUserId: oldId, newUserId: newId, user });
          }
          return json({ success: true, oldUserId: oldId, newUserId: newId, user });
        }

        const userLedgerMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/ledger$/);
        if (method === 'GET' && userLedgerMatch) {
          const userId = decodeURIComponent(userLedgerMatch[1]);
          const user = this.getUserById(userId);
          if (!user) return json({ error: 'User not found' }, 404);
          return json({
            user,
            transactions: this.data.transactions.filter((t) => t.userId === user.id),
            deposits: this.data.deposits.filter((d) => d.userId === user.id),
            withdrawals: this.data.withdrawals.filter((w) => w.userId === user.id),
            orders: this.data.orders.filter((o) => o.userId === user.id),
            referrals: this.data.referrals.filter((r) => r.referrerId === user.id),
            claims: this.data.claims.filter((c) => c.userId === user.id)
          });
        }

        if (method === 'POST' && pathname === '/api/admin/products') {
          const prod: Product = {
            ...body,
            price: Number(body.price) || 0,
            dailyRewardAmount: Number(body.dailyRewardAmount) || 0,
            durationDays: Number(body.durationDays) || 30,
            id: `prod-${Date.now()}`,
            createdAt: new Date().toISOString()
          };
          this.data.products.unshift(prod);
          this.save();
          this.emit('product_updated', { action: 'add', product: prod });
          return json({ success: true, product: prod });
        }

        const adminProdMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)$/);
        if (adminProdMatch) {
          const id = decodeURIComponent(adminProdMatch[1]);
          if (method === 'PUT') {
            const p = this.data.products.find((item) => item.id === id);
            if (!p) return json({ error: 'Product not found' }, 400);
            Object.assign(p, body || {});
            this.save();
            this.emit('product_updated', { action: 'update', product: p });
            return json({ success: true, product: p });
          }
          if (method === 'DELETE') {
            const idx = this.data.products.findIndex((item) => item.id === id);
            if (idx >= 0) this.data.products.splice(idx, 1);
            this.save();
            this.emit('product_updated', { action: 'delete', productId: id });
            return json({ success: idx >= 0 });
          }
        }

        if (method === 'GET' && pathname === '/api/admin/orders') {
          return json({ orders: this.data.orders });
        }

        if (method === 'GET' && pathname === '/api/admin/deposits') {
          return json({ deposits: this.data.deposits });
        }

        const depApproveMatch = pathname.match(/^\/api\/admin\/deposits\/([^/]+)\/approve$/);
        if (method === 'POST' && depApproveMatch) {
          const dep = this.data.deposits.find((d) => d.id === decodeURIComponent(depApproveMatch[1]));
          if (!dep) return json({ error: 'Deposit not found' }, 400);
          if (dep.status !== 'pending') return json({ error: `Deposit is already ${dep.status}` }, 400);
          const user = this.getUserById(dep.userId);
          if (!user) return json({ error: 'User not found' }, 400);
          dep.status = 'approved';
          dep.processedAt = new Date().toISOString();
          if (body?.notes) dep.notes = body.notes;
          user.balance = Number((user.balance + dep.amount).toFixed(2));
          user.totalDeposited = Number((user.totalDeposited + dep.amount).toFixed(2));
          const tx: Transaction = {
            id: `tx-dep-${Date.now()}`,
            userId: user.id,
            type: 'deposit',
            amount: dep.amount,
            balanceAfter: user.balance,
            description: `Deposit Approved: $${dep.amount} USDT (${dep.network || 'USDT BEP-20'})`,
            status: 'completed',
            referenceId: dep.id,
            createdAt: new Date().toISOString()
          };
          this.data.transactions.unshift(tx);
          this.syncUserVolumeVBadge(user);
          this.save();
          this.emit('deposit_updated', { deposit: dep, user });
          this.addNotification(tx, user);
          return json({ success: true, deposit: dep });
        }

        const depRejectMatch = pathname.match(/^\/api\/admin\/deposits\/([^/]+)\/reject$/);
        if (method === 'POST' && depRejectMatch) {
          const dep = this.data.deposits.find((d) => d.id === decodeURIComponent(depRejectMatch[1]));
          if (!dep) return json({ error: 'Deposit not found' }, 400);
          dep.status = 'rejected';
          dep.processedAt = new Date().toISOString();
          dep.notes = body?.reason || 'Rejected by Admin.';
          this.save();
          this.emit('deposit_updated', { deposit: dep });
          return json({ success: true, deposit: dep });
        }

        if (method === 'GET' && pathname === '/api/admin/withdrawals') {
          return json({ withdrawals: this.data.withdrawals });
        }

        const wthApproveMatch = pathname.match(/^\/api\/admin\/withdrawals\/([^/]+)\/approve$/);
        if (method === 'POST' && wthApproveMatch) {
          const wth = this.data.withdrawals.find((w) => w.id === decodeURIComponent(wthApproveMatch[1]));
          if (!wth) return json({ error: 'Withdrawal not found' }, 400);
          if (wth.status !== 'pending') return json({ error: `Withdrawal is already ${wth.status}` }, 400);
          const user = this.getUserById(wth.userId);
          if (!user) return json({ error: 'User not found' }, 400);
          wth.status = 'approved';
          wth.processedAt = new Date().toISOString();
          wth.txHash = body?.txHash || `0x${randomHexToken(32)}`;
          wth.notes = body?.notes || 'Processed and transferred on BEP-20.';
          user.totalWithdrawn = Number((user.totalWithdrawn + wth.amount).toFixed(2));
          let tx = this.data.transactions.find((t) => t.referenceId === wth.id);
          if (tx) {
            tx.status = 'completed';
          } else {
            tx = {
              id: `tx-wth-${Date.now()}`,
              userId: user.id,
              type: 'withdrawal',
              amount: -wth.amount,
              balanceAfter: user.balance,
              description: `Withdrawal completed to ${wth.toAddress}`,
              status: 'completed',
              referenceId: wth.id,
              createdAt: new Date().toISOString()
            };
            this.data.transactions.unshift(tx);
          }
          this.syncUserVolumeVBadge(user);
          this.save();
          this.emit('withdrawal_updated', { withdrawal: wth, user });
          this.addNotification(tx, user);
          return json({ success: true, withdrawal: wth });
        }

        const wthRejectMatch = pathname.match(/^\/api\/admin\/withdrawals\/([^/]+)\/reject$/);
        if (method === 'POST' && wthRejectMatch) {
          const wth = this.data.withdrawals.find((w) => w.id === decodeURIComponent(wthRejectMatch[1]));
          if (!wth) return json({ error: 'Withdrawal not found' }, 400);
          const user = this.getUserById(wth.userId);
          if (!user) return json({ error: 'User not found' }, 400);
          user.balance = Number((user.balance + wth.amount).toFixed(2));
          wth.status = 'rejected';
          wth.processedAt = new Date().toISOString();
          wth.notes = body?.reason || 'Rejected by Admin. Balance refunded.';
          const tx = this.data.transactions.find((t) => t.referenceId === wth.id);
          if (tx) tx.status = 'rejected';
          this.data.transactions.unshift({
            id: `tx-ref-${Date.now()}`,
            userId: user.id,
            type: 'reward_claim',
            amount: wth.amount,
            balanceAfter: user.balance,
            description: `Refund: Withdrawal ${wth.id} rejected`,
            status: 'completed',
            referenceId: wth.id,
            createdAt: new Date().toISOString()
          });
          this.save();
          this.emit('withdrawal_updated', { withdrawal: wth, user });
          return json({ success: true, withdrawal: wth });
        }

        if (method === 'GET' && pathname === '/api/admin/transactions') {
          return json({ transactions: this.data.transactions });
        }

        if (pathname === '/api/admin/settings') {
          if (method === 'GET') return json({ settings: this.data.settings });
          if (method === 'POST') {
            const merged = { ...this.data.settings, ...(body || {}) };
            if (body?.companyInfo) {
              const rawLicenses = Array.isArray(body.companyInfo.licenses) ? body.companyInfo.licenses : [];
              const cleanLicenses: CompanyLicenseDocument[] = rawLicenses
                .slice(0, 20)
                .filter((d: any) => typeof d?.imageUrl === 'string' && d.imageUrl.trim())
                .map((d: any, idx: number) => ({
                  id: String(d.id || `lic-${Date.now()}-${idx}`),
                  title: String(d.title || 'Company License Document').trim().slice(0, 120),
                  documentNumber: d.documentNumber ? String(d.documentNumber).trim().slice(0, 80) : undefined,
                  issuingAuthority: d.issuingAuthority ? String(d.issuingAuthority).trim().slice(0, 120) : undefined,
                  imageUrl: String(d.imageUrl).trim(),
                  uploadedAt: String(d.uploadedAt || new Date().toISOString())
                }));
              merged.companyInfo = {
                ...(this.data.settings.companyInfo || { companyName: 'CryptoEarnGo Global Technologies Ltd.', licenses: [] }),
                ...body.companyInfo,
                licenses: cleanLicenses
              } as CompanyProfileInfo;
            }
            merged.apkDownloadUrl = resolveAbsoluteApkUrl(merged.apkDownloadUrl, merged.appVersion);
            this.data.settings = merged;
            this.save();
            this.emit('settings_updated', this.data.settings);
            return json({ success: true, settings: this.data.settings });
          }
        }

        if (method === 'POST' && pathname === '/api/admin/deposit-markets') {
          const clean = this.sanitizeDepositNetwork(body);
          const current = [...(this.data.settings.depositNetworks || [])];
          if (current.some((m) => m.id.toUpperCase() === clean.id.toUpperCase())) {
            return json({ error: `Market "${clean.id}" already exists.` }, 400);
          }
          this.data.settings = {
            ...this.data.settings,
            depositNetworks: [...current, clean]
          };
          this.save();
          this.emit('settings_updated', this.data.settings);
          return json({ success: true, settings: this.data.settings });
        }

        const marketMatch = pathname.match(/^\/api\/admin\/deposit-markets\/([^/]+)$/);
        if (marketMatch) {
          const targetId = decodeURIComponent(marketMatch[1]).toUpperCase();
          const current = [...(this.data.settings.depositNetworks || [])];
          const idx = current.findIndex((m) => m.id.toUpperCase() === targetId);
          if (idx === -1) return json({ error: `Market not found: ${targetId}` }, 400);
          if (method === 'PUT') {
            current[idx] = this.sanitizeDepositNetwork({ ...current[idx], ...(body || {}), id: current[idx].id });
            this.data.settings = { ...this.data.settings, depositNetworks: current };
            this.save();
            this.emit('settings_updated', this.data.settings);
            return json({ success: true, settings: this.data.settings });
          }
          if (method === 'DELETE') {
            this.data.settings = {
              ...this.data.settings,
              depositNetworks: current.filter((m) => m.id.toUpperCase() !== targetId)
            };
            this.save();
            this.emit('settings_updated', this.data.settings);
            return json({ success: true, settings: this.data.settings });
          }
        }

        if (pathname === '/api/admin/banners') {
          if (method === 'GET') return json({ banners: this.data.banners });
          if (method === 'POST') {
            this.data.banners = body?.banners || [];
            this.save();
            this.emit('content_updated', { banners: this.data.banners });
            return json({ success: true, banners: this.data.banners });
          }
        }

        if (pathname === '/api/admin/videos') {
          if (method === 'GET') return json({ videos: this.data.videoBanners });
          if (method === 'POST') {
            this.data.videoBanners = body?.videos || [];
            this.save();
            this.emit('content_updated', { videoBanners: this.data.videoBanners });
            return json({ success: true, videos: this.data.videoBanners });
          }
        }

        if (method === 'GET' && pathname === '/api/admin/audit-logs') {
          return json({ logs: this.data.auditLogs });
        }

        if (method === 'GET' && pathname === '/api/admin/notifications') {
          return json({
            logs: this.data.notificationLogs,
            providers: { pushWebhookConfigured: false, fcmConfigured: false, webPushReady: true },
            webhookPath: '/api/webhooks/push-notifications'
          });
        }

        if (method === 'POST' && pathname === '/api/admin/reset-demo') {
          return json({ success: true, message: 'Database state healthy' });
        }
      }

      return json({ error: `Endpoint not found: ${method} ${pathname}` }, 404);
    } catch (err: any) {
      return json({ error: err?.message || 'Request failed' }, 400);
    }
  }
}

let singletonEngine: NativeBackendEngine | null = null;

export function getNativeBackend(): NativeBackendEngine {
  if (!singletonEngine) {
    singletonEngine = new NativeBackendEngine();
  }
  return singletonEngine;
}

export function handleNativeApiRequest(path: string, init?: RequestInit): Promise<Response> {
  return getNativeBackend().handle(path, init);
}
