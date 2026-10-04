import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_SESSION_EXPIRY_KEY,
  AUTH_SESSION_TTL_MS,
  clearSessionExpiry,
  ensureSessionExpiry,
  getSessionExpiresAt,
  startSessionExpiry,
} from "../../src/api/sessionExpiry.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("session expiry is fixed at seven days and is not extended by restoration", () => {
  const storage = createStorage();
  const startedAt = 1_800_000_000_000;

  assert.equal(startSessionExpiry(storage, startedAt), startedAt + AUTH_SESSION_TTL_MS);
  assert.equal(getSessionExpiresAt(storage), startedAt + AUTH_SESSION_TTL_MS);
  assert.equal(ensureSessionExpiry(storage, startedAt + 3_000), startedAt + AUTH_SESSION_TTL_MS);
});

test("a pre-existing session without a timestamp gets one initial seven-day window", () => {
  const storage = createStorage();
  const firstCheckAt = 1_800_000_000_000;

  assert.equal(ensureSessionExpiry(storage, firstCheckAt), firstCheckAt + AUTH_SESSION_TTL_MS);
  assert.equal(storage.getItem(AUTH_SESSION_EXPIRY_KEY), String(firstCheckAt));
  assert.equal(ensureSessionExpiry(storage, firstCheckAt + 1_000), firstCheckAt + AUTH_SESSION_TTL_MS);
});

test("invalid timestamps fail closed and logout clears the shared marker", () => {
  const storage = createStorage();
  storage.setItem(AUTH_SESSION_EXPIRY_KEY, "invalid");

  assert.equal(ensureSessionExpiry(storage), 0);
  clearSessionExpiry(storage);
  assert.equal(getSessionExpiresAt(storage), null);
});
