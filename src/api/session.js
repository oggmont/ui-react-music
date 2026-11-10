/**
 * Where the tokens live (UI-Design.md § Implementation notes, API-Design.md § Tokens (JWT)):
 *
 * - The access token (a 15-minute JWT) stays in memory only.
 * - The refresh token (opaque, single use, 14 days) is kept in sessionStorage so a reload keeps
 *   you signed in. It never goes to localStorage, and it's cleared when the tab closes.
 */
const REFRESH_KEY = 'runlist.refresh_token';

let accessToken = null;
let accessExpiresAt = 0;
const listeners = new Set();

function storage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return accessToken;
}

/** True when the access token is missing or expires within `skewMs`. */
export function accessTokenExpiring(skewMs = 30_000) {
  return !accessToken || Date.now() + skewMs >= accessExpiresAt;
}

export function getRefreshToken() {
  return storage()?.getItem(REFRESH_KEY) ?? null;
}

export function hasSession() {
  return Boolean(accessToken || getRefreshToken());
}

/** Store a TokenResponse from /auth/login or /auth/refresh. */
export function saveTokens({ access_token, expires_in, refresh_token }) {
  accessToken = access_token;
  accessExpiresAt = Date.now() + (expires_in ?? 900) * 1000;
  if (refresh_token) storage()?.setItem(REFRESH_KEY, refresh_token);
}

/** Forget the tokens. `reason` tells listeners why ("logout" or "expired"). */
export function clearSession(reason = 'logout') {
  const had = hasSession();
  accessToken = null;
  accessExpiresAt = 0;
  storage()?.removeItem(REFRESH_KEY);
  if (had) listeners.forEach((listener) => listener(reason));
}

/** Called when the session ends. Returns an unsubscribe function. */
export function onSessionEnd(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
