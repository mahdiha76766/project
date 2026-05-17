const hits = new Map<string, { count: number; resetAt: number }>();

export const checkRateLimit = (key: string, limit = 20, windowMs = 60_000) => {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (current.count >= limit) return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1;
  hits.set(key, current);
  return { allowed: true };
};
