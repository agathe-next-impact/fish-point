import { Ratelimit, type Duration } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

function createRateLimiter(requests: number, window: Duration) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
  });
}

export const apiRateLimit = createRateLimiter(60, '1 m' as Duration);
export const writeRateLimit = createRateLimiter(10, '1 m' as Duration);
export const searchRateLimit = createRateLimiter(30, '1 m' as Duration);

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ limited: boolean; headers: Record<string, string> }> {
  if (!limiter) return { limited: false, headers: {} };

  const result = await limiter.limit(identifier);
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  return { limited: !result.success, headers };
}
