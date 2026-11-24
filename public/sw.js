const APP_SHELL_CACHE = 'ceg-android-shell-v2';
const SHELL_ASSETS = ['/', '/manifest.json', '/assets/aistudio/file_00000000b1a881fa9f8249d48e315dcc_d0d81d28.png', '/pwa-192x192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== APP_SHELL_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Network-first for API & navigation, fallback to cache when offline
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
  );
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Crypto Earn Go Alert',
    body: 'A new transaction has been completed on your account.',
    url: '/?tab=wallet',
    tag: `ceg-tx-${Date.now()}`,
    transactionType: 'deposit',
    amount: 0
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const targetUrl =
    payload.url ||
    (payload.transactionType === 'deposit' || payload.transactionType === 'withdrawal'
      ? '/?tab=wallet'
      : '/');

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.tag || `ceg-tx-${Date.now()}`,
      renotify: true,
      vibrate: [120, 60, 180],
      data: {
        url: targetUrl,
        transactionType: payload.transactionType,
        transactionId: payload.transactionId || null
      }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/?tab=wallet';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_CLICKED',
            data: event.notification.data || {}
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
