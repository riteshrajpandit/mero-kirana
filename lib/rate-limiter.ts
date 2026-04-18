import { API_RATE_LIMIT } from "@/lib/constants";

type RateLimitStore = Map<string, { count: number; resetAt: number }>;

const store: RateLimitStore = new Map();

function cleanup() {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) {
      store.delete(key);
    }
  }
}

setInterval(cleanup, 60000);

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

export function checkRateLimit(
  identifier: string,
  type: "LOGIN" | "REGISTER" = "LOGIN",
): RateLimitResult {
  const config =
    type === "LOGIN"
      ? { attempts: API_RATE_LIMIT.LOGIN_ATTEMPTS, window: API_RATE_LIMIT.LOGIN_WINDOW_SECONDS }
      : { attempts: API_RATE_LIMIT.REGISTER_ATTEMPTS, window: API_RATE_LIMIT.REGISTER_WINDOW_SECONDS };

  const now = Date.now();
  const key = `${type}:${identifier}`;
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    store.set(key, {
      count: 1,
      resetAt: now + config.window * 1000,
    });
    return {
      success: true,
      remaining: config.attempts - 1,
      resetAt: now + config.window * 1000,
      limit: config.attempts,
    };
  }

  if (existing.count >= config.attempts) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
      limit: config.attempts,
    };
  }

  existing.count++;
  store.set(key, existing);

  return {
    success: true,
    remaining: config.attempts - existing.count,
    resetAt: existing.resetAt,
    limit: config.attempts,
  };
}

export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
  };
}
