export const DEFAULT_PUBLIC_APP_URL =
  'https://ais-dev-3ss5cnaatd5c5lkz7gr5wj-857917240172.asia-northeast1.run.app';

export const PRODUCTION_APP_URL = DEFAULT_PUBLIC_APP_URL;

const PUBLIC_URL_CACHE_KEY = 'ceg_public_app_url';

export function isNonPublicOrigin(urlOrOrigin: string): boolean {
  const lower = String(urlOrOrigin || '').trim().toLowerCase();
  if (!lower || lower === 'null' || lower === 'my_app_url') return true;
  return (
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('0.0.0.0') ||
    lower.startsWith('capacitor://') ||
    lower.startsWith('ionic://') ||
    lower.startsWith('file://')
  );
}

export function setCachedPublicAppUrl(url?: string | null): void {
  if (typeof window === 'undefined' || !url) return;
  const trimmed = String(url).trim().replace(/\/+$/, '');
  if (!trimmed || isNonPublicOrigin(trimmed) || !/^https?:\/\//i.test(trimmed)) return;
  try {
    window.localStorage.setItem(PUBLIC_URL_CACHE_KEY, trimmed);
  } catch {
    // ignore storage errors
  }
}

export function getPublicAppBaseUrl(baseUrlOverride?: string): string {
  if (baseUrlOverride && !isNonPublicOrigin(baseUrlOverride) && /^https?:\/\//i.test(baseUrlOverride)) {
    return baseUrlOverride.trim().replace(/\/+$/, '');
  }

  // 1. Check live browser origin first when running on any real external HTTPS/HTTP domain
  if (typeof window !== 'undefined') {
    try {
      const cap = (window as any).Capacitor;
      const isNative =
        Boolean(cap?.isNativePlatform?.()) ||
        window.location?.protocol === 'capacitor:' ||
        window.location?.protocol === 'file:';
      const origin = window.location?.origin || '';
      if (!isNative && origin && !isNonPublicOrigin(origin) && /^https?:\/\//i.test(origin)) {
        return origin.replace(/\/+$/, '');
      }
    } catch {
      // ignore
    }
  }

  // 2. Check Vite client env overrides when configured to a public domain
  try {
    const metaEnv = (import.meta as any)?.env;
    const clientEnv = metaEnv?.VITE_PUBLIC_APP_URL || metaEnv?.VITE_APP_URL;
    if (typeof clientEnv === 'string' && clientEnv.trim() && !isNonPublicOrigin(clientEnv)) {
      return clientEnv.trim().replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }

  // 3. Check Node.js server env overrides injected by runtime (e.g. Cloud Run APP_URL)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const serverEnv =
        process.env.PUBLIC_APP_URL ||
        process.env.SHARED_APP_URL ||
        process.env.APP_URL;
      if (typeof serverEnv === 'string' && serverEnv.trim() && !isNonPublicOrigin(serverEnv)) {
        return serverEnv.trim().replace(/\/+$/, '');
      }
    }
  } catch {
    // ignore
  }

  // 4. Check cached live backend URL (useful inside native Capacitor APK after initial sync)
  if (typeof window !== 'undefined') {
    try {
      const cached = window.localStorage.getItem(PUBLIC_URL_CACHE_KEY);
      if (cached && !isNonPublicOrigin(cached) && /^https?:\/\//i.test(cached)) {
        return cached.replace(/\/+$/, '');
      }
    } catch {
      // ignore
    }
  }

  // 5. Active Cloud Run app URL fallback (never returns localhost or relative/capacitor origin)
  return DEFAULT_PUBLIC_APP_URL;
}

export function resolveAbsolutePublicUrl(
  rawUrl?: string | null,
  fallbackPath = '/',
  baseUrlOverride?: string
): string {
  const baseUrl = getPublicAppBaseUrl(baseUrlOverride);
  const trimmed = String(rawUrl || '').trim();
  const cleanFallback = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`;

  if (!trimmed) {
    return `${baseUrl}${cleanFallback}`;
  }

  // Convert any relative path into an absolute public URL
  if (!/^https?:\/\//i.test(trimmed)) {
    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseUrl}${normalizedPath}`;
  }

  // Replace localhost / capacitor / stale preview origins with the active public domain
  try {
    const parsed = new URL(trimmed);
    const activeHost = new URL(baseUrl).host;
    const shouldNormalizeHost =
      isNonPublicOrigin(parsed.origin) ||
      (parsed.hostname.endsWith('.run.app') && parsed.host !== activeHost);

    if (shouldNormalizeHost) {
      return `${baseUrl}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return parsed.toString();
  } catch {
    return `${baseUrl}${cleanFallback}`;
  }
}

export function buildApkDownloadUrl(appVersion?: string | null, baseUrlOverride?: string): string {
  const cleanVer = String(appVersion || 'v2.4.1')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '');
  const versionTag = cleanVer || 'v2.4.1';
  return resolveAbsolutePublicUrl(`/downloads/CryptoEarnGo-${versionTag}.apk`, '/', baseUrlOverride);
}

export function resolveAbsoluteApkUrl(
  rawUrl?: string | null,
  appVersion?: string | null,
  baseUrlOverride?: string
): string {
  const cleanVer = String(appVersion || 'v2.4.1')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '');
  const fallbackPath = `/downloads/CryptoEarnGo-${cleanVer || 'v2.4.1'}.apk`;
  return resolveAbsolutePublicUrl(rawUrl, fallbackPath, baseUrlOverride);
}

export function buildReferralUrl(refCode?: string | null, baseUrlOverride?: string): string {
  const clean = String(refCode || '').trim().toUpperCase();
  if (!clean) return '';
  return `${getPublicAppBaseUrl(baseUrlOverride)}/?ref=${encodeURIComponent(clean)}`;
}

export function buildTrackedApkDownloadUrl(
  rawUrl?: string | null,
  appVersion?: string | null,
  refCode?: string | null,
  baseUrlOverride?: string
): string {
  const baseApkUrl = resolveAbsoluteApkUrl(rawUrl, appVersion, baseUrlOverride);
  const cleanRef = String(refCode || '').trim().toUpperCase();
  if (!cleanRef) return baseApkUrl;
  try {
    const parsed = new URL(baseApkUrl);
    parsed.searchParams.set('ref', cleanRef);
    return parsed.toString();
  } catch {
    const sep = baseApkUrl.includes('?') ? '&' : '?';
    return `${baseApkUrl}${sep}ref=${encodeURIComponent(cleanRef)}`;
  }
}

export function normalizeReferralCodeInput(raw?: string | null): string {
  const input = String(raw || '').trim();
  if (!input) return '';

  // Support full pasted URLs (https://.../?ref=CODE, /r/CODE, /invite/CODE, /ref/CODE)
  if (/^https?:\/\//i.test(input) || input.includes('?') || input.includes('/')) {
    try {
      const normalized = input.startsWith('/') ? `https://placeholder.local${input}` : input;
      const parsed = new URL(normalized.includes('://') ? normalized : `https://${normalized}`);
      const qRef =
        parsed.searchParams.get('ref') ||
        parsed.searchParams.get('invite') ||
        parsed.searchParams.get('code');
      if (qRef && qRef.trim()) {
        return qRef.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);
      }
      const segMatch = parsed.pathname.match(/\/(?:invite|r|ref)\/([A-Za-z0-9_-]{3,24})/i);
      if (segMatch && segMatch[1]) {
        return segMatch[1].trim().toUpperCase();
      }
    } catch {
      // fall through to direct cleanup
    }
  }

  return input
    .replace(/^@+/, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 24);
}

export function extractReferralCodeFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search || '');
    const queryRef = params.get('ref') || params.get('invite') || params.get('code');
    if (queryRef && queryRef.trim()) {
      const cleaned = normalizeReferralCodeInput(queryRef);
      if (cleaned) return cleaned;
    }
    const pathMatch = (window.location.pathname || '').match(
      /^\/(?:invite|r|ref)\/([A-Za-z0-9_-]{3,24})\/?$/i
    );
    if (pathMatch && pathMatch[1]) {
      return normalizeReferralCodeInput(pathMatch[1]);
    }
  } catch {
    // ignore URL parse issues
  }
  return null;
}
