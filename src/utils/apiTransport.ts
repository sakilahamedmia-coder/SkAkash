import { handleNativeApiRequest } from './nativeBackend';
import { getPublicAppBaseUrl, isNonPublicOrigin } from './publicUrl';

let interceptorInstalled = false;

export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cap = (window as any).Capacitor;
    if (cap) {
      if (typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
        return true;
      }
      if (typeof cap.getPlatform === 'function') {
        const platform = cap.getPlatform();
        if (platform === 'android' || platform === 'ios') {
          return true;
        }
      }
    }
    const protocol = window.location?.protocol || '';
    if (protocol === 'capacitor:' || protocol === 'file:') {
      return true;
    }
  } catch {
    // ignore detection errors
  }
  return false;
}

export function getRemoteApiBaseUrl(): string {
  try {
    const envBase = (import.meta as any)?.env?.VITE_API_BASE_URL;
    if (typeof envBase === 'string' && envBase.trim() && !isNonPublicOrigin(envBase)) {
      return envBase.trim().replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }

  try {
    if (typeof window !== 'undefined') {
      const override = window.localStorage.getItem('ceg_api_base_url');
      if (override && override.trim() && !isNonPublicOrigin(override)) {
        return override.trim().replace(/\/+$/, '');
      }
    }
  } catch {
    // ignore
  }

  // Inside Android/iOS Capacitor APKs, route all API & SSE traffic to the live Cloud server
  // so mobile users and Admin Panel stay synced in real time across devices.
  if (isCapacitorNative()) {
    return getPublicAppBaseUrl();
  }

  return '';
}

export function hasRemoteApiBase(): boolean {
  return Boolean(getRemoteApiBaseUrl());
}

function extractApiPath(input: RequestInfo | URL): string | null {
  let rawUrl = '';
  if (typeof input === 'string') {
    rawUrl = input;
  } else if (input instanceof URL) {
    rawUrl = input.toString();
  } else if (typeof Request !== 'undefined' && input instanceof Request) {
    rawUrl = input.url;
  }

  if (!rawUrl) return null;

  if (rawUrl.startsWith('/api/')) {
    return rawUrl;
  }

  try {
    if (typeof window !== 'undefined') {
      const parsed = new URL(rawUrl, window.location.origin);
      if (parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/')) {
        return parsed.pathname + parsed.search;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

const nativeFetchRef =
  typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function'
    ? globalThis.fetch.bind(globalThis)
    : undefined;

async function fetchWithTimeout(
  baseFetch: typeof fetch,
  targetUrl: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 10000
): Promise<Response> {
  if (init?.signal || typeof AbortController === 'undefined') {
    return baseFetch(targetUrl, init);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await baseFetch(targetUrl, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const baseFetch =
    nativeFetchRef ||
    (typeof window !== 'undefined' && typeof window.fetch === 'function' ? window.fetch.bind(window) : undefined);

  const apiPath = extractApiPath(input);
  if (!apiPath) {
    if (!baseFetch) {
      throw new Error('Fetch API is unavailable in this environment.');
    }
    return baseFetch(input, init);
  }

  const native = isCapacitorNative();
  const remoteBase = getRemoteApiBaseUrl();

  // Only bypass network if running natively without any reachable remote base or if fetch is missing
  if (!baseFetch || (native && !remoteBase)) {
    return handleNativeApiRequest(apiPath, init);
  }

  const targetUrl = remoteBase ? `${remoteBase}${apiPath}` : input;

  try {
    const response = native
      ? await fetchWithTimeout(baseFetch, targetUrl, init, 10000)
      : await baseFetch(targetUrl, init);
    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    // Fall back to on-device engine only if upstream gateway/static host failed to serve /api/* (502/503/504 or HTML page)
    if (native && (response.status >= 502 || contentType.includes('text/html'))) {
      return handleNativeApiRequest(apiPath, init);
    }
    return response;
  } catch (err) {
    // If the device is completely offline, keep the app responsive via local fallback
    if (native) {
      return handleNativeApiRequest(apiPath, init);
    }
    throw err;
  }
}

export function installApiFetchInterceptor(): void {
  if (interceptorInstalled || typeof window === 'undefined') {
    return;
  }
  interceptorInstalled = true;

  // Never override window.fetch on standard web runtime when no remote base is needed
  const remoteBase = getRemoteApiBaseUrl();
  if (!isCapacitorNative() && !remoteBase) {
    return;
  }

  try {
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (desc && !desc.configurable && !desc.writable) {
      return;
    }
    Object.defineProperty(window, 'fetch', {
      value: apiFetch,
      configurable: true,
      writable: true
    });
  } catch {
    // Gracefully skip if host environment exposes read-only getter for window.fetch; apiFetch handles all calls directly.
  }
}
