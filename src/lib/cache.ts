import { getRedis } from "./redis";

// TTL tiers (in seconds)
const TTL = {
  API_RESPONSE: 5 * 60,         // 5 minutes
  EXTERNAL_API: 24 * 60 * 60,   // 24 hours
  AI_GENERATION: 7 * 24 * 60 * 60, // 7 days
  STATIC_DATA: 30 * 24 * 60 * 60,  // 30 days
} as const;

export type CacheTier = keyof typeof TTL;

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const data = await redis.get(key);
    if (!data) return null;
    return (typeof data === "string" ? JSON.parse(data) : data) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  tier: CacheTier = "API_RESPONSE"
): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(value), { ex: TTL[tier] });
  } catch {
    // Silently fail — cache is not critical
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch {
    // Silently fail
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      for (const key of keys) {
        await redis.del(key);
      }
    }
  } catch {
    // Silently fail
  }
}

// Helper to wrap a function with caching
export function withCache<T>(
  keyFn: (...args: unknown[]) => string,
  tier: CacheTier = "API_RESPONSE"
) {
  return async (fn: () => Promise<T>, ...keyArgs: unknown[]): Promise<T> => {
    const key = keyFn(...keyArgs);
    const cached = await cacheGet<T>(key);
    if (cached) return cached;

    const result = await fn();
    await cacheSet(key, result, tier);
    return result;
  };
}

// Cache key builders
export const cacheKeys = {
  professorSearch: (query: string, page: number) => `search:professors:${query}:${page}`,
  professorDetail: (id: string) => `professor:${id}`,
  paperSummary: (paperId: string) => `paper:summary:${paperId}`,
  researchFit: (userId: string, profId: string) => `fit:${userId}:${profId}`,
  emailDraft: (userId: string, profId: string) => `email:${userId}:${profId}`,
  universities: () => `static:universities`,
};
