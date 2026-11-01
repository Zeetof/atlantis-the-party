type Bucket = { count: number; resetAt: number };

const globalForLimiter = globalThis as unknown as { atpRateBuckets?: Map<string, Bucket> };
const buckets = globalForLimiter.atpRateBuckets ?? new Map<string, Bucket>();
globalForLimiter.atpRateBuckets = buckets;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Single-instance limiter used for the local deployment. For multi-instance
 * production deployments, replace with a shared Redis/Upstash limiter.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function resetRateLimits() {
  buckets.clear();
}
