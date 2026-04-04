const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 900000): boolean {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}

export function resetRateLimit(key: string) {
  attempts.delete(key);
}

// Cleanup old entries every 5 min
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const keys = Array.from(attempts.keys());
    keys.forEach((key: any) => {
      const record = attempts.get(key);
      if (record && now > record.resetAt) attempts.delete(key);
    });
  }, 300000);
}
