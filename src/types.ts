export type UserStatus = 'active' | 'suspended' | 'banned';
export type UserRole = 'user' | 'admin';
export type PaymentMethodBadge =
  | 'bkash'
  | 'nagad'
  | 'rocket'
  | 'upay'
  | 'phonepe'
  | 'gpay'
  | 'paytm'
  | 'upi'
  | 'esewa'
  | 'khalti'
  | 'imepay'
  | 'binance'
  | 'crypto';

export interface User {
  id: string; // e.g. "CEG-882941"
  name: string;
  email: string;
  googleId?: string;
  avatar: string;
  country?: string;
  balance: number; // USDT
  totalEarned: number;
  totalDeposited: number;
  totalWithdrawn: number;
  referralCode: string;
  referredBy?: string;
  referralEarnings: number;
  referralCount: number;
  status: UserStatus;
  banReason?: string;
  role: UserRole;
  isVerified?: boolean;
  paymentBadges?: PaymentMethodBadge[];
  whatsappNumber?: string;
  telegramLink?: string;
  totalTransactionVolume?: number;
  hasVolumeVBadge?: boolean;
  volumeBadgeUnlockedAt?: string;
  firstTaskCompleted?: boolean;
  firstTaskBonusPaid?: boolean;
  fcmToken?: string;
  pushSubscription?: Record<string, any> | null;
  notificationPrefs?: {
    pushEnabled: boolean;
  };
  createdAt: string;
  lastLoginAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number; // in USDT
  dailyRewardAmount: number; // Daily USDT earning claimable after purchase
  durationDays: number; // Validity duration in days (default 30)
  image: string;
  category: string;
  stock: number;
  isAvailable: boolean;
  features?: string[];
  createdAt: string;
}

export type OrderStatus = 'completed' | 'processing' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  dailyRewardAmount: number;
  durationDays: number;
  daysClaimed: number;
  totalEarnedFromOrder: number;
  lastClaimedAt?: string;
  expiresAt: string;
  status: OrderStatus;
  createdAt: string;
}

export type DepositStatus = 'pending' | 'approved' | 'rejected';

export interface DepositNetworkConfig {
  id: string;
  code: string;
  name: string;
  shortLabel: string;
  logoKey?: string;
  walletAddress: string;
  minDeposit: number;
  estimatedTime: string;
  confirmations: string;
  feeLabel: string;
  explorerTxBase: string;
  enabled: boolean;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number; // USDT
  txHash: string;
  network: string;
  walletAddress: string;
  status: DepositStatus;
  notes?: string;
  createdAt: string;
  processedAt?: string;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number; // USDT
  network: 'USDT BEP-20';
  toAddress: string;
  fee: number;
  finalAmount: number;
  status: WithdrawalStatus;
  txHash?: string;
  notes?: string;
  createdAt: string;
  processedAt?: string;
}

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'purchase'
  | 'referral_commission'
  | 'reward_claim'
  | 'daily_checkin';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // positive for credit, negative for debit
  balanceAfter: number;
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'rejected';
  referenceId?: string;
  createdAt: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  commissionEarned: number;
  firstTaskCompleted?: boolean;
  firstTaskBonusEarned?: number;
  firstTaskCompletedAt?: string;
  isQualified?: boolean;
  qualifiedAt?: string;
  qualificationSource?: 'first_task' | 'deposit' | 'purchase' | 'verified';
  createdAt: string;
}

export interface ReferralTrackingEvent {
  id: string;
  referralCode: string;
  referrerId: string;
  eventType: 'click' | 'apk_download';
  source?: string;
  createdAt: string;
}

export interface ReferralTrackingStats {
  referralCode: string;
  linkClicks: number;
  apkDownloads: number;
  totalSignups: number;
  successfulReferrals: number;
  conversionRate: number;
}

export interface RewardTask {
  id: string;
  title: string;
  description: string;
  rewardAmount: number; // in USDT
  cooldownMinutes: number; // e.g. 60 or 1440 (24h)
  iconName: string;
  category: 'daily' | 'social' | 'learning' | 'activity';
  actionUrl?: string;
  actionText?: string;
}

export interface ClaimHistoryItem {
  id: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  rewardAmount: number;
  claimedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  badge?: string;
  linkUrl?: string;
}

export interface VideoBanner {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration?: string;
}

export interface CompanyLicenseDocument {
  id: string;
  title: string;
  documentNumber?: string;
  issuingAuthority?: string;
  imageUrl: string;
  uploadedAt: string;
}

export interface CompanyProfileInfo {
  companyName: string;
  registrationNumber?: string;
  jurisdiction?: string;
  foundedYear?: string;
  headquarters?: string;
  officialEmail?: string;
  officialWebsite?: string;
  description?: string;
  licenses: CompanyLicenseDocument[];
}

export interface SystemSettings {
  usdtBep20Address: string;
  minDeposit: number;
  depositNetworks?: DepositNetworkConfig[];
  minWithdrawal: number;
  withdrawalFeePercent: number;
  referralCommissionPercent: number;
  firstTaskBonusPercent: number;
  dailyClaimEnabled: boolean;
  dailyClaimTitle: string;
  dailyClaimDescription: string;
  claimIntervalMinutes: number; // 1440 = 24 hours
  claimRewardAmount: number;
  whatsappLink: string;
  telegramLink: string;
  appVersion: string;
  apkDownloadUrl: string;
  apkReleaseNotes: string;
  forceUpdate: boolean;
  announcement: string;
  maintenanceMode: boolean;
  companyInfo?: CompanyProfileInfo;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalVolume: number;
  pendingDepositsCount: number;
  pendingDepositsAmount: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  totalOrdersCount: number;
  totalProductsCount: number;
}

export interface PublicActivityItem {
  id: string;
  type: 'deposit' | 'withdrawal';
  userName: string;
  userIdMasked: string;
  isVerified?: boolean;
  hasVolumeVBadge?: boolean;
  amount: number;
  network: string;
  status: 'Success';
  timestamp: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  userName: string;
  channel: 'push';
  title: string;
  message: string;
  transactionType: 'deposit' | 'withdrawal';
  amount: number;
  transactionId?: string;
  pushStatus: 'sent' | 'skipped' | 'failed';
  providerInfo?: string;
  isRead?: boolean;
  createdAt: string;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  avatar: string;
  country?: string;
  status: UserStatus;
  isVerified: boolean;
  hasVolumeVBadge: boolean;
  volumeBadgeUnlockedAt?: string;
  totalTransactionVolume: number;
  paymentBadges: PaymentMethodBadge[];
  whatsappNumber?: string;
  telegramLink?: string;
  level: number;
  levelTitle: string;
  badgeTitle: string;
  totalDeposited: number;
  totalWithdrawn: number;
  completedTasksCount: number;
  recentCompletedTasks: {
    id: string;
    title: string;
    rewardAmount: number;
    completedAt: string;
  }[];
  joinedAt: string;
}

export interface VerifiedAgent {
  id: string;
  name: string;
  avatar: string;
  country?: string;
  isVerified: boolean;
  hasVolumeVBadge: boolean;
  totalTransactionVolume: number;
  paymentBadges: PaymentMethodBadge[];
  whatsappNumber?: string;
  telegramLink?: string;
  joinedAt: string;
}


