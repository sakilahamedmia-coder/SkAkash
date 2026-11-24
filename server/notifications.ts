import { NotificationLog, Transaction, User } from '../src/types.js';

export interface NotificationProviderStatus {
  pushWebhookConfigured: boolean;
  webhookSecretConfigured: boolean;
  fcmConfigured: boolean;
  webPushReady: boolean;
}

export function getNotificationProviderStatus(): NotificationProviderStatus {
  const pushWebhookConfigured = Boolean(process.env.PUSH_WEBHOOK_URL);
  const webhookSecretConfigured = Boolean(process.env.PUSH_WEBHOOK_SECRET);
  const fcmConfigured = Boolean(process.env.FCM_SERVER_KEY);

  return {
    pushWebhookConfigured,
    webhookSecretConfigured,
    fcmConfigured,
    webPushReady: true // Real-time SSE + Service Worker Web Push always active
  };
}

function isSafeExternalWebhookUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false;
    }
    if (parsed.pathname.includes('/api/webhooks/push-notifications')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function formatTransactionNotification(
  tx: Transaction,
  user: User
): {
  title: string;
  message: string;
} {
  const absAmount = Math.abs(tx.amount).toFixed(2);
  const bal = Number(tx.balanceAfter ?? user.balance).toFixed(2);

  if (tx.type === 'deposit') {
    return {
      title: `Deposit Successful: +$${absAmount} USDT`,
      message: `Your $${absAmount} USDT (BEP-20) deposit has been approved. New balance: $${bal} USDT.`
    };
  }

  return {
    title: `Withdrawal Successful: $${absAmount} USDT`,
    message: `Your $${absAmount} USDT withdrawal has been sent successfully. Current balance: $${bal} USDT.`
  };
}

async function sendExternalPush(
  user: User,
  title: string,
  message: string,
  tx: Transaction,
  skipExternalWebhook = false
): Promise<{ ok: boolean; detail: string } | null> {
  const fcmKey = process.env.FCM_SERVER_KEY;
  if (fcmKey && user.fcmToken) {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        Authorization: `key=${fcmKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: user.fcmToken,
        notification: { title, body: message },
        data: { transactionId: tx.id, type: tx.type, amount: String(tx.amount) }
      })
    });
    if (!response.ok) {
      throw new Error(`FCM ${response.status}`);
    }
    return { ok: true, detail: 'FCM Push delivered' };
  }

  const pushWebhook = process.env.PUSH_WEBHOOK_URL;
  if (!skipExternalWebhook && pushWebhook && isSafeExternalWebhookUrl(pushWebhook)) {
    const response = await fetch(pushWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        title,
        message,
        transactionId: tx.id,
        type: tx.type,
        amount: tx.amount,
        pushSubscription: user.pushSubscription || null
      })
    });
    if (!response.ok) {
      throw new Error(`Push Webhook ${response.status}`);
    }
    return { ok: true, detail: 'Push Webhook delivered' };
  }

  return null;
}

export async function dispatchTransactionNotification(
  tx: Transaction,
  user: User,
  customOverride?: { title: string; message: string },
  options?: { skipExternalWebhook?: boolean; sourceLabel?: string }
): Promise<NotificationLog | null> {
  // Real-time push notifications are enabled strictly for deposits and withdrawals
  if (tx.type !== 'deposit' && tx.type !== 'withdrawal') {
    return null;
  }

  const { title, message } = customOverride || formatTransactionNotification(tx, user);

  let pushStatus: NotificationLog['pushStatus'] = 'sent';
  let providerInfo = '';

  try {
    const ext = await sendExternalPush(
      user,
      title,
      message,
      tx,
      Boolean(options?.skipExternalWebhook)
    );
    providerInfo = ext
      ? ext.detail
      : options?.sourceLabel || 'Real-time Web Push (SSE + Service Worker)';
    pushStatus = 'sent';
  } catch (err: any) {
    pushStatus = 'failed';
    providerInfo = `Push error: ${err.message}`;
  }

  return {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userName: user.name,
    channel: 'push',
    title,
    message,
    transactionType: tx.type,
    amount: tx.amount,
    transactionId: tx.id,
    pushStatus,
    providerInfo,
    createdAt: new Date().toISOString()
  };
}
