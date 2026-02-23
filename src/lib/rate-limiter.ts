/**
 * Simple in-memory rate limiter for contact form submissions
 * For production with multiple instances, use Redis instead
 */

interface RateLimitEntry {
  count: number;
  firstRequestAt: number;
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_IP = 5; // 5 requests per hour per IP
const MAX_REQUESTS_PER_EMAIL = 3; // 3 requests per hour per email

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.firstRequestAt > WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 15 minutes
setInterval(cleanupExpiredEntries, 15 * 60 * 1000);

/**
 * Check if an IP address has exceeded the rate limit
 * @param identifier - IP address or email
 * @param maxRequests - Maximum allowed requests in the window
 */
function checkRateLimit(
  identifier: string,
  maxRequests: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier.toLowerCase().trim();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    // First request from this identifier
    rateLimitStore.set(key, {
      count: 1,
      firstRequestAt: now,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + WINDOW_MS,
    };
  }

  // Check if window has expired
  if (now - entry.firstRequestAt > WINDOW_MS) {
    // Reset the window
    rateLimitStore.set(key, {
      count: 1,
      firstRequestAt: now,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + WINDOW_MS,
    };
  }

  // Window still active - check count
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.firstRequestAt + WINDOW_MS,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.firstRequestAt + WINDOW_MS,
  };
}

/**
 * Check rate limit for an IP address
 * @param ip - The IP address to check
 */
export function checkIpRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  return checkRateLimit(`ip:${ip}`, MAX_REQUESTS_PER_IP);
}

/**
 * Check rate limit for an email address
 * @param email - The email address to check
 */
export function checkEmailRateLimit(email: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  return checkRateLimit(`email:${email}`, MAX_REQUESTS_PER_EMAIL);
}

/**
 * Get the remaining time until rate limit resets (in seconds)
 */
export function getResetTimeSeconds(resetAt: number): number {
  return Math.ceil((resetAt - Date.now()) / 1000);
}

/**
 * Get current rate limit configuration (useful for error messages)
 */
export function getRateLimitConfig() {
  return {
    windowMs: WINDOW_MS,
    maxRequestsPerIp: MAX_REQUESTS_PER_IP,
    maxRequestsPerEmail: MAX_REQUESTS_PER_EMAIL,
  };
}
