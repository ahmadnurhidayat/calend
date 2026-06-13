const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now - record.timestamp > config.windowMs) {
        rateLimitMap.set(key, { count: 1, timestamp: now });
        return true;
    }

    if (record.count >= config.maxRequests) {
        return false;
    }

    record.count++;
    return true;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap) {
        if (now - record.timestamp > 300_000) {
            rateLimitMap.delete(key);
        }
    }
}, 300_000);

export const RATE_LIMITS = {
    signup: { windowMs: 60 * 60 * 1000, maxRequests: 5 } as RateLimitConfig,
    booking: { windowMs: 60 * 60 * 1000, maxRequests: 30 } as RateLimitConfig,
} as const;
