import { Redis } from '@upstash/redis';

function createRedisClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export const redis = createRedisClient();

export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttl: number = 300): Promise<T> {
  if (!redis) {
    return fetcher();
  }

  const cached = await redis.get<T>(key);
  if (cached) {
    return cached;
  }

  const data = await fetcher();
  await redis.set(key, data, { ex: ttl });
  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (!redis) return;

  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
