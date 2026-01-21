/**
 * Reusable rate limiting utility for API endpoints
 */

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum requests allowed per window */
  maxRequests: number
  /** Maximum map size before cleanup (default: 1000) */
  maxMapSize?: number
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Remaining requests in current window */
  remaining: number
  /** Time until reset in milliseconds */
  resetIn: number
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

/**
 * In-memory rate limiter for single-instance deployments.
 * For multi-instance deployments, consider using Redis.
 */
export class RateLimiter {
  private map = new Map<string, RateLimitRecord>()
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      maxMapSize: config.maxMapSize ?? 1000,
    }
  }

  /**
   * Check if a request is allowed and increment counter
   * @param key - Unique identifier (e.g., IP address, user ID)
   * @returns Rate limit result with allowed status and metadata
   */
  check(key: string): RateLimitResult {
    const now = Date.now()
    const record = this.map.get(key)

    // Cleanup if map is getting too large
    if (this.map.size > this.config.maxMapSize) {
      this.cleanup()
    }

    if (record && now < record.resetTime) {
      // Within existing window
      if (record.count >= this.config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetIn: record.resetTime - now,
        }
      }
      record.count++
      return {
        allowed: true,
        remaining: this.config.maxRequests - record.count,
        resetIn: record.resetTime - now,
      }
    }

    // New window
    this.map.set(key, {
      count: 1,
      resetTime: now + this.config.windowMs,
    })

    return {
      allowed: true,
      remaining: this.config.maxRequests - 1,
      resetIn: this.config.windowMs,
    }
  }

  /**
   * Remove expired entries from the map
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.map.forEach((record, key) => {
      if (now > record.resetTime) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach((key) => this.map.delete(key))
  }

  /**
   * Reset all rate limit records (useful for testing)
   */
  reset(): void {
    this.map.clear()
  }
}

// Pre-configured rate limiter for upload endpoint
export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 60 seconds
  maxRequests: 10, // max 10 uploads per minute per IP
})
