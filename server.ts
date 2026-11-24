import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './data/db.js';
import {
  getPublicAppBaseUrl,
  isNonPublicOrigin,
  resolveAbsoluteApkUrl,
  normalizeReferralCodeInput
} from './src/utils/publicUrl.js';
import {
  dispatchTransactionNotification,
  getNotificationProviderStatus
} from './server/notifications.js';

dotenv.config();

// Automatically dispatch real-time Push Notification after successful deposits and withdrawals
db.onSuccessfulTransaction(async (tx, user) => {
  try {
    const log = await dispatchTransactionNotification(tx, user);
    if (log) {
      db.addNotificationLog(log);
    }
  } catch (err) {
    console.error('[Transaction Notification Error]:', err);
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', true);
const PORT = Number(process.env.PORT) || 3000;

function getServerPublicBaseUrl(req?: Request): string {
  if (req) {
    const forwardedHost = String(req.headers['x-forwarded-host'] || '');
    const rawHost = (forwardedHost.split(',')[0] || req.get('host') || '').trim();
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '');
    const rawProto = (forwardedProto.split(',')[0] || req.protocol || 'https').trim();
    if (rawHost && !isNonPublicOrigin(rawHost)) {
      const proto = rawHost.includes('.run.app') ? 'https' : rawProto;
      return `${proto}://${rawHost}`.replace(/\/+$/, '');
    }
  }
  return getPublicAppBaseUrl();
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS support for mobile/Capacitor and external API requests
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-admin-token, x-user-id, x-webhook-secret'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Request logger
app.use((req, res, next) => {
  if (!req.path.startsWith('/@') && !req.path.startsWith('/src')) {
    // console.log(`[${req.method}] ${req.path}`);
  }
  next();
});

// ==========================================
// 1. REAL-TIME SERVER-SENT EVENTS (SSE)
// ==========================================
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to Crypto Earn Go Realtime Stream' })}\n\n`);

  const unsubscribe = db.subscribeSSE((event, data) => {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      unsubscribe();
    }
  });

  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAlive);
      unsubscribe();
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});

// ==========================================
// 2. PUBLIC SETTINGS & APP INFO
// ==========================================
app.get('/api/settings/public', (req: Request, res: Response) => {
  const baseUrl = getServerPublicBaseUrl(req);
  const rawSettings = db.getSettings();
  const settings = {
    ...rawSettings,
    apkDownloadUrl: resolveAbsoluteApkUrl(rawSettings.apkDownloadUrl, rawSettings.appVersion, baseUrl)
  };
  const banners = db.getBanners();
  const videoBanners = db.getVideoBanners();
  res.json({
    publicAppUrl: baseUrl,
    settings,
    banners,
    videoBanners
  });
});

// Real-time public feed of verified/approved deposits & withdrawals (privacy-masked)
app.get('/api/activity/public-feed', (req: Request, res: Response) => {
  const maskName = (name: string) => {
    const parts = (name || 'User').trim().split(/\s+/);
    if (parts.length > 1) {
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return parts[0].length > 3 ? `${parts[0].slice(0, 3)}***` : parts[0];
  };

  const maskUserId = (id: string) => {
    if (!id) return 'CEG-***';
    return id.length > 6 ? `${id.slice(0, 4)}***${id.slice(-3)}` : id;
  };

  const userMap = new Map(db.getUsers().map(u => [u.id, u]));

  const approvedDeposits = db
    .getAllDeposits()
    .filter(d => d.status === 'approved')
    .map(d => {
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

  const approvedWithdrawals = db
    .getAllWithdrawals()
    .filter(w => w.status === 'approved')
    .map(w => {
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

  res.json({ feed });
});

// Serve the real built & signed Android APK binary (and track referral attribution when ?ref= is provided)
app.get(['/downloads/:filename', '/api/app/download-apk'], (req: Request, res: Response) => {
  const candidates = [
    path.resolve(__dirname, 'APK_DOWNLOAD', 'app-debug.apk'),
    path.resolve(__dirname, '.build-outputs', 'app-debug.apk'),
    path.resolve(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
  ];
  const apkPath = candidates.find((p) => fs.existsSync(p));
  if (!apkPath) {
    return res.status(404).json({ error: 'Android APK binary is not available yet.' });
  }
  const refParam = typeof req.query.ref === 'string' ? req.query.ref.trim() : '';
  if (refParam && req.query.tracked !== '1') {
    db.trackReferralEvent(refParam, 'apk_download', 'apk_direct_link');
  }
  const rawName = req.params?.filename ? path.basename(req.params.filename) : 'CryptoEarnGo.apk';
  const safeFilename = rawName.endsWith('.apk') ? rawName : 'CryptoEarnGo.apk';
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.sendFile(apkPath);
});

// ==========================================
// 3. AUTHENTICATION & USERS
// ==========================================
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, referralCode } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const cleanReferralCode = normalizeReferralCodeInput(referralCode) || undefined;
    const user = db.createUser({
      name,
      email,
      referredByCode: cleanReferralCode
    });

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please register.' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        error: `Account Banned: ${user.banReason || 'Violation of terms'}`,
        status: 'banned',
        user
      });
    }

    user.lastLoginAt = new Date().toISOString();
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Login failed' });
  }
});

// Google Sign-In Endpoint
app.post('/api/auth/google', (req: Request, res: Response) => {
  try {
    const { email, name, googleId, avatar, referralCode } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google' });
    }

    const cleanReferralCode = normalizeReferralCodeInput(referralCode) || undefined;
    let user = db.getUserByEmail(email);
    if (!user) {
      user = db.createUser({
        name: name || email.split('@')[0],
        email,
        googleId: googleId || `google-${Date.now()}`,
        avatar: avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
        referredByCode: cleanReferralCode
      });
    } else {
      user.lastLoginAt = new Date().toISOString();
      if (googleId) user.googleId = googleId;
      if (avatar && !user.avatar) user.avatar = avatar;
      if (!user.referredBy && cleanReferralCode) {
        try {
          db.applyReferralCode(user.id, cleanReferralCode);
        } catch {
          // Optional code on existing login never blocks Google sign-in
        }
      }
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        error: `Account Banned: ${user.banReason || 'Violation of platform rules'}`,
        status: 'banned',
        user
      });
    }

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Google Sign-In failed' });
  }
});

// Helper to extract admin bearer/header token
function extractAdminToken(req: Request): string {
  const headerToken = req.headers['x-admin-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return '';
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractAdminToken(req);
  if (!token || !db.verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Unauthorized: Valid admin authentication required' });
  }
  const boundUserId = db.getAdminTokenOwner(token);
  const headerUserId = typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'].trim() : '';
  const effectiveUserId = headerUserId || boundUserId;
  const owner = effectiveUserId ? db.getUserById(effectiveUserId) : undefined;
  if (!owner || !owner.isVerified || owner.status !== 'active' || (boundUserId && headerUserId && boundUserId !== headerUserId)) {
    return res.status(403).json({
      error: 'Only verified accounts can access the Admin Panel.'
    });
  }
  next();
}

// Admin Login Endpoint
app.post('/api/auth/admin-login', (req: Request, res: Response) => {
  try {
    const { email, password, userId } = req.body || {};
    const token = db.verifyAdminLogin(email || '', password || '', userId);
    if (token) {
      res.json({
        success: true,
        token,
        admin: {
          id: 'ADMIN-001',
          name: 'Chief Platform Administrator',
          email: 'admin@cryptoearngo.com',
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid admin email or password!' });
    }
  } catch (err: any) {
    res.status(403).json({
      error: err.message || 'Only verified accounts can access the Admin Panel.'
    });
  }
});

// Admin Logout Endpoint
app.post('/api/auth/admin-logout', (req: Request, res: Response) => {
  const token = extractAdminToken(req);
  if (token) {
    db.revokeAdminToken(token);
  }
  res.json({ success: true });
});

// Switch / get demo users for testing
app.get('/api/auth/demo-users', (req: Request, res: Response) => {
  res.json({ users: db.getUsers() });
});

// Search public user profile strictly by User ID (never email or name, no private PII leaked)
app.get('/api/users/search', (req: Request, res: Response) => {
  try {
    const rawUserId = typeof req.query.userId === 'string' ? req.query.userId : '';
    const profile = db.searchUserPublicProfileById(rawUserId);
    if (!profile) {
      return res.status(404).json({ error: 'No account found with this User ID.' });
    }
    res.json({ profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid User ID' });
  }
});

// Get active admin-verified agents (public safe fields only)
app.get('/api/agents/verified', (_req: Request, res: Response) => {
  res.json({ agents: db.getVerifiedAgents() });
});

// Get user profile
app.get('/api/user/:userId', (req: Request, res: Response) => {
  const user = db.getUserById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// Consolidated User Data for fast, atomic, resilient fetching
app.get('/api/user/:userId/full-data', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const orders = db.getUserOrders(user.id);
  const deposits = db.getUserDeposits(user.id);
  const withdrawals = db.getUserWithdrawals(user.id);
  const transactions = db.getUserTransactions(user.id);
  const referrals = db.getUserReferrals(user.id, 100, 0);
  const tasks = db.getTasks();
  const claims = db.getUserClaims(user.id);
  const settings = db.getSettings();
  const notifications = db.getUserNotifications(user.id);

  const referralStats = db.getReferralStats(user.id);

  res.json({
    user,
    orders,
    deposits,
    withdrawals,
    transactions,
    tasks,
    claims,
    notifications,
    notificationProviders: getNotificationProviderStatus(),
    referralData: {
      referralCode: user.referralCode,
      referralCount: referralStats.totalSignups,
      totalRecords: referralStats.totalSignups,
      hasMore: referrals.length < referralStats.totalSignups,
      referralEarnings: user.referralEarnings || 0,
      commissionPercent: settings.referralCommissionPercent,
      firstTaskBonusPercent: settings.firstTaskBonusPercent ?? 20,
      tracking: referralStats,
      history: referrals
    }
  });
});

app.put('/api/user/:userId', (req: Request, res: Response) => {
  try {
    const { name, avatar, country, paymentBadges, whatsappNumber, telegramLink } = req.body || {};
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (country !== undefined) updates.country = country;
    if (paymentBadges !== undefined) updates.paymentBadges = paymentBadges;
    if (whatsappNumber !== undefined) updates.whatsappNumber = whatsappNumber;
    if (telegramLink !== undefined) updates.telegramLink = telegramLink;
    const updated = db.updateUserProfile(req.params.userId, updates);
    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// User Real-Time Push Notification endpoints
app.get('/api/user/:userId/notifications', (req: Request, res: Response) => {
  const user = db.getUserById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    notifications: db.getUserNotifications(user.id),
    providers: getNotificationProviderStatus()
  });
});

app.put('/api/user/:userId/notifications', (req: Request, res: Response) => {
  try {
    const { fcmToken, pushSubscription, notificationPrefs } = req.body || {};
    const updated = db.updateUserNotificationSettings(req.params.userId, {
      fcmToken,
      pushSubscription,
      notificationPrefs
    });
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update notification settings' });
  }
});

app.post('/api/user/:userId/notifications/test', async (req: Request, res: Response) => {
  try {
    const user = db.getUserById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const txType: 'deposit' | 'withdrawal' = req.body?.type === 'withdrawal' ? 'withdrawal' : 'deposit';
    const isWithdrawal = txType === 'withdrawal';

    const sampleTx = {
      id: `tx-test-${Date.now()}`,
      userId: user.id,
      type: txType,
      amount: isWithdrawal ? -1.0 : 1.0,
      balanceAfter: user.balance,
      description: isWithdrawal ? 'Test withdrawal push notification' : 'Test deposit push notification',
      status: 'completed' as const,
      createdAt: new Date().toISOString()
    };

    const log = await dispatchTransactionNotification(sampleTx, user, {
      title: isWithdrawal
        ? '🔔 Test Withdrawal Push Alert: CryptoEarnGo Active!'
        : '🔔 Test Deposit Push Alert: CryptoEarnGo Active!',
      message: `Your account (${user.id}) is connected to real-time Deposit & Withdrawal push notifications. Current balance: $${user.balance.toFixed(2)} USDT.`
    });
    if (log) {
      db.addNotificationLog(log);
    }
    res.json({ success: true, log });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Test notification dispatch failed' });
  }
});

// ==========================================
// 3B. PUSH NOTIFICATION WEBHOOK ENDPOINT
// ==========================================
function verifyPushWebhookSecret(req: Request): boolean {
  const configuredSecret = process.env.PUSH_WEBHOOK_SECRET || '';
  if (!configuredSecret) {
    return true;
  }

  const headerSecret =
    typeof req.headers['x-webhook-secret'] === 'string'
      ? req.headers['x-webhook-secret'].trim()
      : '';
  const authHeader =
    typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : '';
  const provided = headerSecret || authHeader;
  if (!provided) return false;

  const expectedDigest = crypto.createHash('sha256').update(configuredSecret).digest();
  const providedDigest = crypto.createHash('sha256').update(provided).digest();
  return crypto.timingSafeEqual(expectedDigest, providedDigest);
}

app.get('/api/webhooks/push-notifications', (req: Request, res: Response) => {
  res.json({
    status: 'active',
    endpoint: '/api/webhooks/push-notifications',
    supportedEvents: ['deposit', 'withdrawal'],
    channel: 'push',
    secretRequired: Boolean(process.env.PUSH_WEBHOOK_SECRET),
    examplePayload: {
      userId: 'CEG-882941',
      type: 'deposit',
      amount: 25.0,
      title: 'Deposit Successful: +$25.00 USDT',
      message: 'Your $25.00 USDT deposit has been approved.'
    }
  });
});

app.post('/api/webhooks/push-notifications', async (req: Request, res: Response) => {
  try {
    if (!verifyPushWebhookSecret(req)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing webhook secret' });
    }

    const body = req.body || {};
    const rawUserId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const rawType = typeof body.type === 'string' ? body.type.trim().toLowerCase() : typeof body.transactionType === 'string' ? body.transactionType.trim().toLowerCase() : '';

    if (!rawUserId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (rawType !== 'deposit' && rawType !== 'withdrawal') {
      return res.status(400).json({
        error: 'Invalid type. Only "deposit" and "withdrawal" are supported.'
      });
    }

    const user = db.getUserById(rawUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const parsedAmount = body.amount !== undefined ? Number(body.amount) : 0;
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: 'Invalid amount value' });
    }

    const txId =
      typeof body.transactionId === 'string' && body.transactionId.trim()
        ? body.transactionId.trim().slice(0, 80)
        : `wh-${Date.now()}`;

    const customTitle =
      typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 120) : '';
    const customMessage =
      typeof body.message === 'string' && body.message.trim() ? body.message.trim().slice(0, 500) : '';

    const customOverride =
      customTitle && customMessage
        ? { title: customTitle, message: customMessage }
        : undefined;

    const syntheticTx = {
      id: txId,
      userId: user.id,
      type: rawType as 'deposit' | 'withdrawal',
      amount: rawType === 'withdrawal' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount),
      balanceAfter: user.balance,
      description: `${rawType === 'deposit' ? 'Deposit' : 'Withdrawal'} Webhook Push Notification`,
      status: 'completed' as const,
      createdAt: new Date().toISOString()
    };

    const log = await dispatchTransactionNotification(syntheticTx, user, customOverride, {
      skipExternalWebhook: true,
      sourceLabel: 'Webhook Endpoint -> Real-time Web Push (SSE + Service Worker)'
    });

    if (log) {
      db.addNotificationLog(log);
      db.logAudit(
        'PUSH_WEBHOOK_TRIGGERED',
        `Push notification webhook triggered (${rawType}, $${Math.abs(parsedAmount).toFixed(2)}) for ${user.name} (${user.id})`
      );
    }

    return res.json({
      success: true,
      event: 'push_notification',
      notification: log
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Webhook dispatch failed' });
  }
});

// ==========================================
// 4. PRODUCTS & ORDERS
// ==========================================
app.get('/api/products', (req: Request, res: Response) => {
  res.json({ products: db.getProducts() });
});

app.post('/api/products/buy', (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ error: 'userId and productId are required' });
    }
    const result = db.buyProduct(userId, productId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Purchase failed' });
  }
});

app.get('/api/orders/:userId', (req: Request, res: Response) => {
  res.json({ orders: db.getUserOrders(req.params.userId) });
});

app.post('/api/orders/:orderId/claim', (req: Request, res: Response) => {
  try {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
    const orderId = (req.params.orderId || '').trim();
    if (!userId || !orderId) {
      return res.status(400).json({ error: 'userId and orderId are required' });
    }
    const result = db.claimProductDailyReward(userId, orderId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Product daily claim failed' });
  }
});

// ==========================================
// 5. DEPOSITS
// ==========================================
app.get('/api/deposits/:userId', (req: Request, res: Response) => {
  res.json({ deposits: db.getUserDeposits(req.params.userId) });
});

app.post('/api/deposits/submit', (req: Request, res: Response) => {
  try {
    const { userId, amount, txHash, network } = req.body || {};
    if (!userId || !amount || !txHash) {
      return res.status(400).json({ error: 'userId, amount, and txHash are required' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }
    const networkStr = typeof network === 'string' && network.trim() ? network.trim() : undefined;
    const deposit = db.submitDeposit(userId, numAmount, txHash, networkStr);
    res.json({ success: true, deposit });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Deposit submission failed' });
  }
});

// ==========================================
// 6. WITHDRAWALS
// ==========================================
app.get('/api/withdrawals/:userId', (req: Request, res: Response) => {
  res.json({ withdrawals: db.getUserWithdrawals(req.params.userId) });
});

app.post('/api/withdrawals/submit', (req: Request, res: Response) => {
  try {
    const { userId, amount, toAddress } = req.body;
    if (!userId || !amount || !toAddress) {
      return res.status(400).json({ error: 'userId, amount, and toAddress are required' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }
    const withdrawal = db.submitWithdrawal(userId, numAmount, toAddress);
    res.json({ success: true, withdrawal });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Withdrawal submission failed' });
  }
});

// ==========================================
// 7. EARNING & REWARDS
// ==========================================
app.get('/api/rewards/tasks', (req: Request, res: Response) => {
  const tasks = db.getTasks();
  const userId = req.query.userId as string;
  let userClaims: any[] = [];
  if (userId) {
    userClaims = db.getUserClaims(userId);
  }
  res.json({ tasks, userClaims });
});

app.post('/api/daily-claim', (req: Request, res: Response) => {
  try {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const result = db.claimDailyReward(userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Daily claim failed' });
  }
});

app.post('/api/rewards/claim', (req: Request, res: Response) => {
  try {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
    const taskId = typeof req.body?.taskId === 'string' && req.body.taskId.trim() ? req.body.taskId.trim() : 'daily-claim';
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const result = db.claimTaskReward(userId, taskId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Claim failed' });
  }
});

// ==========================================
// 8. REFERRALS & TRANSACTIONS
// ==========================================
app.get('/api/referrals/validate/:code', (req: Request, res: Response) => {
  const baseUrl = getServerPublicBaseUrl(req);
  const code = normalizeReferralCodeInput(req.params.code || '');
  const referrer = db.getUserByReferralCode(code);
  const settings = db.getSettings();
  const tracking = referrer ? db.getReferralStats(referrer.id) : null;
  res.json({
    valid: Boolean(referrer),
    publicAppUrl: baseUrl,
    referrerName: referrer ? referrer.name : null,
    referrerAvatar: referrer ? referrer.avatar : null,
    referrerVerified: referrer ? Boolean(referrer.isVerified) : false,
    referralCode: referrer ? referrer.referralCode : null,
    firstTaskBonusPercent: settings.firstTaskBonusPercent ?? 20,
    commissionPercent: settings.referralCommissionPercent ?? 10,
    appVersion: settings.appVersion || 'v2.4.1',
    apkDownloadUrl: resolveAbsoluteApkUrl(settings.apkDownloadUrl, settings.appVersion, baseUrl),
    apkReleaseNotes: settings.apkReleaseNotes,
    tracking
  });
});

app.post('/api/referrals/track', (req: Request, res: Response) => {
  const { referralCode, eventType, source } = req.body || {};
  const normalizedEvent = eventType === 'apk_download' ? 'apk_download' : 'click';
  const result = db.trackReferralEvent(String(referralCode || ''), normalizedEvent, String(source || 'landing'));
  res.json({ success: true, ...result });
});

app.post('/api/referrals/apply', (req: Request, res: Response) => {
  try {
    const userId = String(req.body?.userId || '').trim();
    const rawCode = String(req.body?.referralCode || req.body?.code || '').trim();
    if (!userId) {
      return res.status(400).json({ error: 'Please sign in first to apply a referral code.' });
    }
    const { referrer, user, referralRecord, stats } = db.applyReferralCode(userId, rawCode);
    res.json({
      success: true,
      user,
      referrerName: referrer.name,
      referrerId: referrer.id,
      referralCode: referrer.referralCode,
      referralRecord,
      tracking: stats
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Unable to apply referral code.' });
  }
});

app.get('/api/referrals/:userId', (req: Request, res: Response) => {
  const user = db.getUserById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const rawLimit = Number(req.query.limit ?? 100);
  const rawOffset = Number(req.query.offset ?? 0);
  const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(500, Math.floor(rawLimit)) : 100;
  const safeOffset = Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;

  const referrals = db.getUserReferrals(user.id, safeLimit, safeOffset);
  const settings = db.getSettings();
  const tracking = db.getReferralStats(user.id);
  res.json({
    referralCode: user.referralCode,
    referralCount: tracking.totalSignups,
    totalRecords: tracking.totalSignups,
    hasMore: safeOffset + referrals.length < tracking.totalSignups,
    referralEarnings: user.referralEarnings || 0,
    commissionPercent: settings.referralCommissionPercent,
    firstTaskBonusPercent: settings.firstTaskBonusPercent ?? 20,
    tracking,
    history: referrals
  });
});

app.get('/api/transactions/:userId', (req: Request, res: Response) => {
  res.json({ transactions: db.getUserTransactions(req.params.userId) });
});

// ==========================================
// 9. ADMIN DASHBOARD APIS (PROTECTED)
// ==========================================
app.use('/api/admin', requireAdminAuth);

app.post('/api/admin/change-password', (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const token = extractAdminToken(req);
    const ownerUserId = db.getAdminTokenOwner(token);
    const newToken = db.changeAdminPassword(currentPassword, newPassword, ownerUserId);
    res.json({
      success: true,
      token: newToken,
      message: 'Admin password updated successfully!'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to change admin password' });
  }
});

app.get('/api/admin/stats', (req: Request, res: Response) => {
  res.json({ stats: db.getAdminStats() });
});

app.get('/api/admin/users', (req: Request, res: Response) => {
  res.json({ users: db.getUsers() });
});

app.post('/api/admin/users/:userId/status', (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body;
    const user = db.updateUserStatus(req.params.userId, status, reason);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Toggle User Verified Status (Blue badge)
app.post('/api/admin/users/:userId/verify', (req: Request, res: Response) => {
  try {
    const { isVerified } = req.body;
    const user = db.toggleUserVerified(req.params.userId, Boolean(isVerified));
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Edit Verified User ID from Admin Panel
app.put('/api/admin/users/:userId/id', (req: Request, res: Response) => {
  try {
    const { newUserId } = req.body || {};
    const result = db.adminUpdateVerifiedUserId(req.params.userId, newUserId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/users/:userId/ledger', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    user,
    transactions: db.getUserTransactions(userId),
    deposits: db.getUserDeposits(userId),
    withdrawals: db.getUserWithdrawals(userId),
    orders: db.getUserOrders(userId),
    referrals: db.getUserReferrals(userId),
    claims: db.getUserClaims(userId)
  });
});

// Product Management
app.post('/api/admin/products', (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const product = db.addProduct({
      ...body,
      price: Number(body.price),
      dailyRewardAmount: Number(body.dailyRewardAmount),
      durationDays: Number(body.durationDays) || 30
    });
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/products/:id', (req: Request, res: Response) => {
  try {
    const product = db.updateProduct(req.params.id, req.body || {});
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/products/:id', (req: Request, res: Response) => {
  try {
    const deleted = db.deleteProduct(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/orders', (req: Request, res: Response) => {
  res.json({ orders: db.getAllOrders() });
});

// Financial Management: Deposits Queue
app.get('/api/admin/deposits', (req: Request, res: Response) => {
  res.json({ deposits: db.getAllDeposits() });
});

app.post('/api/admin/deposits/:id/approve', (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    const deposit = db.approveDeposit(req.params.id, notes);
    res.json({ success: true, deposit });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/deposits/:id/reject', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const deposit = db.rejectDeposit(req.params.id, reason);
    res.json({ success: true, deposit });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Financial Management: Withdrawals Queue
app.get('/api/admin/withdrawals', (req: Request, res: Response) => {
  res.json({ withdrawals: db.getAllWithdrawals() });
});

app.post('/api/admin/withdrawals/:id/approve', (req: Request, res: Response) => {
  try {
    const { txHash, notes } = req.body;
    const withdrawal = db.approveWithdrawal(req.params.id, txHash, notes);
    res.json({ success: true, withdrawal });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/withdrawals/:id/reject', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const withdrawal = db.rejectWithdrawal(req.params.id, reason);
    res.json({ success: true, withdrawal });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Admin All Transactions
app.get('/api/admin/transactions', (req: Request, res: Response) => {
  res.json({ transactions: db.getAllTransactions() });
});

// Settings & Rules Config
app.get('/api/admin/settings', (req: Request, res: Response) => {
  res.json({ settings: db.getSettings() });
});

app.post('/api/admin/settings', (req: Request, res: Response) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Admin Deposit Market Management (Add, Toggle/Edit Address, Delete)
app.post('/api/admin/deposit-markets', (req: Request, res: Response) => {
  try {
    const settings = db.addDepositMarket(req.body || {});
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/deposit-markets/:id', (req: Request, res: Response) => {
  try {
    const settings = db.updateDepositMarket(req.params.id, req.body || {});
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/deposit-markets/:id', (req: Request, res: Response) => {
  try {
    const settings = db.deleteDepositMarket(req.params.id);
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Content Management: Banners & Videos
app.get('/api/admin/banners', (req: Request, res: Response) => {
  res.json({ banners: db.getBanners() });
});

app.post('/api/admin/banners', (req: Request, res: Response) => {
  try {
    const banners = db.updateBanners(req.body.banners);
    res.json({ success: true, banners });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/videos', (req: Request, res: Response) => {
  res.json({ videos: db.getVideoBanners() });
});

app.post('/api/admin/videos', (req: Request, res: Response) => {
  try {
    const videos = db.updateVideoBanners(req.body.videos);
    res.json({ success: true, videos });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Audit Logs
app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  res.json({ logs: db.getAuditLogs() });
});

// Notification Delivery Logs & Gateway Status
app.get('/api/admin/notifications', (req: Request, res: Response) => {
  res.json({
    logs: db.getAllNotificationLogs(),
    providers: getNotificationProviderStatus(),
    webhookPath: '/api/webhooks/push-notifications'
  });
});

// Reset / Seed DB helper for admin testing
app.post('/api/admin/reset-demo', (req: Request, res: Response) => {
  // Can re-initialize if needed
  res.json({ success: true, message: 'Database state healthy' });
});

// ==========================================
// 10. VITE & PRODUCTION SPA ROUTING
// ==========================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');
  const distIndexPath = path.resolve(distPath, 'index.html');
  const devIndexPath = path.resolve(__dirname, 'index.html');

  // Ensure /api/* and /downloads/* unmatched routes return clean JSON 404 rather than HTML
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API route not found' });
  });

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // Explicit fallback for referral landing paths (/invite/:code, /r/:code, /ref/:code)
    app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/downloads/')) {
        return next();
      }
      try {
        const rawHtml = fs.readFileSync(devIndexPath, 'utf-8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawHtml);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed);
      } catch (err) {
        next(err);
      }
    });
  } else {
    app.use(express.static(distPath, { index: 'index.html' }));

    app.get(
      ['/', '/invite', '/invite/:code', '/r/:code', '/ref/:code', '/admin', '/admin/*', '*'],
      (req: Request, res: Response) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/downloads/')) {
          return res.status(404).json({ error: 'Endpoint not found' });
        }
        if (fs.existsSync(distIndexPath)) {
          return res.sendFile(distIndexPath);
        }
        return res.sendFile(devIndexPath);
      }
    );
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CryptoEarnGo] Full-Stack Cloud Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
