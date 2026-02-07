import { describe, it, expect, beforeEach } from 'vitest'
import { RateLimiter, uploadRateLimiter } from '@/lib/utils/rate-limit'

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter({
      windowMs: 1000,
      maxRequests: 3,
    })
  })

  describe('check', () => {
    it('should allow first request', () => {
      const result = limiter.check('ip-1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('should decrement remaining on each request', () => {
      limiter.check('ip-1')
      const result = limiter.check('ip-1')
      expect(result.remaining).toBe(1)
    })

    it('should block after max requests exceeded', () => {
      limiter.check('ip-1')
      limiter.check('ip-1')
      limiter.check('ip-1')
      const result = limiter.check('ip-1')
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should track different IPs separately', () => {
      limiter.check('ip-1')
      limiter.check('ip-1')
      limiter.check('ip-1')
      
      const ip1Result = limiter.check('ip-1')
      const ip2Result = limiter.check('ip-2')
      
      expect(ip1Result.allowed).toBe(false)
      expect(ip2Result.allowed).toBe(true)
    })

    it('should reset after window expires', async () => {
      limiter.check('ip-1')
      limiter.check('ip-1')
      limiter.check('ip-1')
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      const result = limiter.check('ip-1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })
  })

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      limiter.check('ip-1')
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      limiter.cleanup()
      
      // Should be a fresh request
      const result = limiter.check('ip-1')
      expect(result.remaining).toBe(2)
    })
  })

  describe('reset', () => {
    it('should clear all entries', () => {
      limiter.check('ip-1')
      limiter.check('ip-2')
      limiter.reset()
      
      const result1 = limiter.check('ip-1')
      const result2 = limiter.check('ip-2')
      
      expect(result1.remaining).toBe(2)
      expect(result2.remaining).toBe(2)
    })
  })
})

describe('uploadRateLimiter', () => {
  beforeEach(() => {
    uploadRateLimiter.reset()
  })

  it('should be configured for upload limits', () => {
    // Should allow 10 requests
    for (let i = 0; i < 10; i++) {
      const result = uploadRateLimiter.check('test-ip')
      expect(result.allowed).toBe(true)
    }
    
    // 11th should be blocked
    const result = uploadRateLimiter.check('test-ip')
    expect(result.allowed).toBe(false)
  })
})
