import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

let _searchLimiter: Ratelimit | null = null;
let _apiLimiter: Ratelimit | null = null;
let _aiLimiter: Ratelimit | null = null;
let _authLimiter: Ratelimit | null = null;

export function getAuthLimiter(): Ratelimit {
  if (!_authLimiter) {
    _authLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: true,
      prefix: "ratelimit:auth",
    });
  }
  return _authLimiter;
}

export function getSearchLimiter(): Ratelimit {
  if (!_searchLimiter) {
    _searchLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 searches per minute
      analytics: true,
      prefix: "ratelimit:search",
    });
  }
  return _searchLimiter;
}

export function getApiLimiter(): Ratelimit {
  if (!_apiLimiter) {
    _apiLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 API calls per minute
      analytics: true,
      prefix: "ratelimit:api",
    });
  }
  return _apiLimiter;
}

export function getAiLimiter(): Ratelimit {
  if (!_aiLimiter) {
    _aiLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 AI generations per hour
      analytics: true,
      prefix: "ratelimit:ai",
    });
  }
  return _aiLimiter;
}

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { success, remaining, reset } = await limiter.limit(identifier);
  return { success, remaining, reset };
}
