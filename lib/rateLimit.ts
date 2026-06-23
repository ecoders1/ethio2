// Simple in-memory rate limiter for API routes
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const key = ip;
  const record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}

// Clean up old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetTime) requestCounts.delete(key);
    }
  }, 300000);
}
