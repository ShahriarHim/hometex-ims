/**
 * Auth session helpers.
 *
 * Token stored in sessionStorage (safer than localStorage — not shared across tabs,
 * cleared on window close). Ideal is httpOnly Sanctum cookie — see BACKLOG.md AUTH-001.
 *
 * Keys are namespaced with `ht_` to avoid collisions.
 */

const TOKEN_KEY = 'ht_token';

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}
