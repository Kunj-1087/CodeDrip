// =============================================================================
// Typed fetch wrapper for the CodeDrip API.
//   * credentials:'include' so the HTTP-only auth cookies travel with requests.
//   * Guest cart identity is sent via the X-Session-Id header (see CartContext).
//   * On a 401, it transparently attempts ONE token refresh, then retries.
// No access token is ever stored in JS — the browser holds it as an HTTP-only
// cookie, which this code cannot read (by design / INVARIANT #1).
// =============================================================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  sessionId?: string;
  // Set true for endpoints where a 401 should NOT trigger a refresh attempt
  // (the auth endpoints themselves), preventing refresh loops.
  skipRefresh?: boolean;
  // FormData passes through untouched (file uploads).
  formData?: FormData;
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // De-dupe concurrent refreshes into a single in-flight request.
  if (!refreshing) {
    refreshing = fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.sessionId) headers['X-Session-Id'] = options.sessionId;

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData; // browser sets multipart boundary
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers,
    body,
  });

  if (res.status === 401 && !options.skipRefresh && !isRetry) {
    if (await tryRefresh()) return request<T>(path, options, true);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, (data && data.error) || res.statusText || 'Request failed', data?.details);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'PATCH', body }),
  del: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', formData }),
};

export { API_URL };
