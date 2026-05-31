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

const inFlight = new Map<string, Promise<unknown>>();

export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttl: number = 300): Promise<T> {
  if (!redis) {
    return fetcher();
  }

  const cached = await redis.get<T>(key);
  if (cached) {
    return cached;
  }

  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = (async () => {
    const data = await fetcher();
    const jitter = Math.floor(Math.random() * Math.max(1, ttl * 0.1));
    await redis.set(key, data, { ex: ttl + jitter });
    return data;
  })();

  inFlight.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (!redis) return;

  let cursor = '0';
  const keys: string[] = [];

  do {
    const [nextCursor, batch] = await redis.scan(cursor, { match: pattern, count: 100 });
    cursor = nextCursor;
    keys.push(...batch);

    if (keys.length >= 100) {
      await redis.del(...keys.splice(0, keys.length));
    }
  } while (cursor !== '0');

  if (keys.length > 0) await redis.del(...keys);
}
