import {
  accessTokenExpiring,
  clearSession,
  getAccessToken,
  getRefreshToken,
  hasSession,
  saveTokens,
} from './session';

/** Same-origin by default: the Vite dev proxy (or nginx in the image) forwards /api to the Spring API. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

/** An error from the API's envelope: `{ "error": { "code", "message", "details": [{ field, message }] } }`. */
export class ApiError extends Error {
  constructor(status, { code, message, details } = {}) {
    super(message || `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code ?? (status === 0 ? 'network_error' : 'unknown');
    this.details = details ?? [];
  }

  /** The message for one field from `details[]`, if any. */
  fieldMessage(field) {
    return this.details.find((d) => d.field === field)?.message;
  }
}

export const isApiError = (error, status, code) =>
  error instanceof ApiError &&
  (status == null || error.status === status) &&
  (code == null || error.code === code);

/** Absolute URL (relative bases resolve against the page's origin); arrays become "1,2,3". */
export function buildUrl(path, query) {
  const url = new URL(`${API_BASE_URL}${path}`, globalThis.location?.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  return url.toString();
}

async function parse(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function send(path, { method = 'GET', query, body, ifMatch, signal, token }) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (ifMatch != null) headers['If-Match'] = `"${ifMatch}"`;

  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError(0, {
      code: 'network_error',
      message: "Can't reach the server. Check your connection.",
    });
  }

  const data = await parse(response);
  if (!response.ok) throw new ApiError(response.status, data?.error ?? {});
  return data;
}

/*
 * Refresh tokens are single use and the API revokes the whole session when one is presented twice,
 * so concurrent refreshes (parallel requests, React StrictMode effects) must share one request.
 */
let refreshing = null;

export function refreshSession() {
  refreshing ??= (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new ApiError(401, { code: 'unauthorized', message: 'Sign in first.' });
    try {
      const tokens = await send('/auth/refresh', { method: 'POST', body: { refresh_token: refreshToken } });
      saveTokens(tokens);
      return tokens;
    } catch (error) {
      if (error instanceof ApiError && error.status !== 0) clearSession('expired');
      throw error;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/**
 * Call the API. Adds `Authorization: Bearer` when there's a session, refreshes the access token
 * shortly before it expires, and retries once after a `401` and a successful refresh.
 *
 * @param {string} path e.g. "/playlists/20"
 * @param {{ method?: string, query?: object, body?: unknown, ifMatch?: number|string, signal?: AbortSignal, auth?: boolean }} [options]
 */
export async function api(path, options = {}) {
  const { auth = true, ...rest } = options;
  if (!auth || !hasSession()) return send(path, rest);

  if (accessTokenExpiring() && getRefreshToken()) {
    try {
      await refreshSession();
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) throw error;
      // The session is gone: public reads still work without a token.
      return send(path, rest);
    }
  }

  try {
    return await send(path, { ...rest, token: getAccessToken() });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !getRefreshToken()) throw error;
    await refreshSession();
    return send(path, { ...rest, token: getAccessToken() });
  }
}
