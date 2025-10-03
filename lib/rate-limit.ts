const WINDOW_IN_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; firstAttempt: number }>();

export function isRateLimited(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry) {
    attempts.set(key, { count: 1, firstAttempt: now });
    return false;
  }

  if (now - entry.firstAttempt > WINDOW_IN_MS) {
    attempts.set(key, { count: 1, firstAttempt: now });
    return false;
  }

  entry.count += 1;
  attempts.set(key, entry);

  return entry.count > MAX_ATTEMPTS;
}

export function resetRateLimit(key: string) {
  attempts.delete(key);
}
