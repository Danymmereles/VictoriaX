export const AUTH_SESSION_EXPIRY_KEY = "victoriax-auth-started-at";
export const AUTH_SESSION_TTL_MS = 604800000; // 7 days in milliseconds

export function startSessionExpiry(storage = globalThis.localStorage, now = Date.now()) {
  storage.setItem(AUTH_SESSION_EXPIRY_KEY, String(now));
  return now + AUTH_SESSION_TTL_MS;
}

export function getSessionExpiresAt(storage = globalThis.localStorage) {
  const savedStart = storage.getItem(AUTH_SESSION_EXPIRY_KEY);
  if (savedStart === null) return null;

  const startedAt = Number(savedStart);
  if (!Number.isSafeInteger(startedAt) || startedAt <= 0) return 0;
  return startedAt + AUTH_SESSION_TTL_MS;
}

export function ensureSessionExpiry(storage = globalThis.localStorage, now = Date.now()) {
  const expiresAt = getSessionExpiresAt(storage);
  return expiresAt === null ? startSessionExpiry(storage, now) : expiresAt;
}

export function clearSessionExpiry(storage = globalThis.localStorage) {
  storage.removeItem(AUTH_SESSION_EXPIRY_KEY);
}
