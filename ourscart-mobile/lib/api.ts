import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  getAccessToken,
  getRefreshToken,
  isTokenExpired as checkTokenExpired,
  saveAccessToken,
  clearTokens,
} from './auth';
import { captureMessage } from './monitoring';
import type { APIErrorShape } from '../types';

// =============================================================================
// Typed fetch wrapper with security hardening, request timing, and retry logic.
//
// Key features:
//   • Transparent access-token refresh on 401 (with deduplication)
//   • Exponential backoff for network/server errors (GET only — POST is unsafe)
//   • Request timing with Sentry alerts for slow calls (>5s)
//   • Session-id tracking for guest carts
//   • HTTPS enforcement in production
// =============================================================================

/*
 * SSL/TLS SECURITY NOTE:
 *
 * React Native uses the device's native TLS stack for HTTPS requests,
 * which validates certificates against the system's trusted CA store.
 * This is sufficient for production if:
 * 1. Your API uses HTTPS (enforced by EXPO_PUBLIC_API_URL starting with https://)
 * 2. Your SSL certificate is from a trusted CA (Let's Encrypt, DigiCert, etc.)
 *
 * Certificate pinning requires the bare workflow (ejecting from Expo). Since
 * we're on Expo managed workflow, we rely on proper HTTPS + CA validation.
 *
 * Action required before Play Store submission:
 * - Verify EXPO_PUBLIC_API_URL starts with https:// in production .env
 * - Never allow http:// in production under any circumstance
 */

if (
  !__DEV__ &&
  process.env.EXPO_PUBLIC_API_URL?.startsWith('http://')
) {
  throw new Error(
    'SECURITY: EXPO_PUBLIC_API_URL must use HTTPS in production. http:// is not allowed.'
  );
}

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const API_PREFIX = '/api';
const SESSION_KEY = 'focuskit_session_id';

export class APIError extends Error implements APIErrorShape {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

// AuthContext registers a handler so a hard 401 can drop the user back to login
// without lib/ importing the router (which would create a cycle).
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
}

// --- guest session id -------------------------------------------------------
let cachedSessionId: string | null = null;

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getSessionId(): Promise<string> {
  if (cachedSessionId) return cachedSessionId;
  let id = await AsyncStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuid();
    await AsyncStorage.setItem(SESSION_KEY, id);
  }
  cachedSessionId = id;
  return id;
}

// --- cookie capture ----------------------------------------------------------
function extractCookie(setCookie: string, name: string): string | null {
  const match = new RegExp(`${name}=([^;,\\s]+)`).exec(setCookie);
  return match && match[1] ? match[1] : null;
}

async function captureTokensFromResponse(res: Response): Promise<void> {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return;
  const access = extractCookie(setCookie, 'accessToken');
  const refresh = extractCookie(setCookie, 'refreshToken');
  // IMPORTANT: Only save tokens here — userId and role are stored separately
  // by AuthContext on login/register/refresh. Passing empty strings for userId
  // and role would overwrite previously stored values, so we use the two-arg
  // saveTokens variant that preserves existing user info.
  if (access && refresh) {
    await SecureStore.setItemAsync('focuskit_access_token', access);
    // Only update refresh token if it was returned (most refresh responses do).
    await SecureStore.setItemAsync('focuskit_refresh_token', refresh);
  } else if (access) {
    await saveAccessToken(access);
  }
}

// --- refresh -----------------------------------------------------------------
let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refresh = await getRefreshToken();
    if (!refresh) return false;
    try {
      const res = await fetch(`${BASE_URL}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        headers: { Cookie: `refreshToken=${refresh}` },
      });
      if (!res.ok) return false;
      await captureTokensFromResponse(res);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// --- retry with exponential backoff -----------------------------------------
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  isIdempotent = false,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;

      // Only retry on network errors (no status code) or server errors (5xx).
      const apiErr = error as { status?: number };
      const isNetworkError = !apiErr.status;
      const isServerError = apiErr.status != null && apiErr.status >= 500;
      const isRetryable = isNetworkError || (isServerError && isIdempotent);

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms.
      const delay = Math.min(500 * Math.pow(2, attempt), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// --- core request ------------------------------------------------------------
interface RequestOptions extends RequestInit {
  _isRetry?: boolean;
  skipAuth?: boolean;
  /** Number of retries for network/server failures (default 0). Only GET is safe to retry. */
  retries?: number;
}

async function buildHeaders(options: RequestOptions): Promise<Headers> {
  const headers = new Headers(options.headers as HeadersInit | undefined);
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!options.skipAuth) {
    const token = await getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('X-Session-Id', await getSessionId());
  headers.set('X-App-Version', process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0');
  headers.set('X-Platform', 'android');
  return headers;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method || 'GET') as string;
  const isIdempotent = method === 'GET' || method === 'DELETE';
  const retries = options.retries ?? (isIdempotent ? 2 : 0);

  return retryWithBackoff(async () => {
    const start = Date.now();
    const url = `${BASE_URL}${API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = await buildHeaders(options);

    // Proactive token refresh — check expiry before the request fires.
    // This prevents a predictable 401 on tokens about to expire, avoiding
    // the latency of a round-trip failure + refresh cycle.
    if (!options.skipAuth && !options._isRetry) {
      const token = headers.get('Authorization')?.replace('Bearer ', '');
      if (token && await checkTokenExpired(token)) {
        const refreshed = await refreshTokens();
        if (refreshed) {
          headers.set('Authorization', `Bearer ${await getAccessToken()}`);
        }
        // If refresh failed, let the request proceed — it'll 401 and we handle that below.
      }
    }

    let res: Response;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (netError) {
      const duration = Date.now() - start;
      if (__DEV__) {
        console.error(`❌ ${method} ${path} NETWORK ERROR (${duration}ms):`, netError);
      }
      throw new APIError(0, 'Network error — check your connection and the API URL.');
    }

    // Auth responses carry fresh cookies; grab them whenever present.
    await captureTokensFromResponse(res);

    // Request timing — flag slow calls.
    const duration = Date.now() - start;
    if (__DEV__) {
      const emoji = res.ok ? '✅' : '❌';
      console.log(`${emoji} ${method} ${path} [${res.status}] ${duration}ms`);
    }
    if (duration > 5000 && !__DEV__) {
      captureMessage(`Slow API call: ${method} ${path} took ${duration}ms`, 'warning');
    }

    // Transparent refresh-and-retry on expired access tokens (once).
    if (res.status === 401 && !options._isRetry && !options.skipAuth) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        return api<T>(path, { ...options, _isRetry: true });
      }
      await clearTokens();
      unauthorizedHandler?.();
      throw new APIError(401, 'Your session has expired. Please sign in again.');
    }

    if (res.status === 204) return undefined as T;

    let payload: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    if (!res.ok) {
      const message =
        (payload as { error?: string; message?: string } | null)?.error ??
        (payload as { message?: string } | null)?.message ??
        `Request failed (${res.status})`;
      throw new APIError(res.status, message);
    }

    return payload as T;
  }, retries, isIdempotent);
}

// Convenience verbs ----------------------------------------------------------
export const apiGet = <T>(path: string, options?: RequestOptions) =>
  api<T>(path, { ...options, method: 'GET' });

export const apiPost = <T>(path: string, body?: unknown, options?: RequestOptions) =>
  api<T>(path, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
  });

export const apiPatch = <T>(path: string, body?: unknown, options?: RequestOptions) =>
  api<T>(path, {
    ...options,
    method: 'PATCH',
    body: body != null ? JSON.stringify(body) : undefined,
  });

export const apiDelete = <T>(path: string, options?: RequestOptions) =>
  api<T>(path, { ...options, method: 'DELETE' });

/** Resolve a possibly-relative image path from the API into an absolute URL. */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
