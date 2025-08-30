interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cleanup();
  }

  private getKey(identifier: string): string {
    return `rate_limit:${identifier}`;
  }

  private cleanup(): void {
    setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetTime <= now) {
          delete this.store[key];
        }
      });
    }, this.config.windowMs);
  }

  public isAllowed(identifier: string): boolean {
    const key = this.getKey(identifier);
    const now = Date.now();
    
    if (!this.store[key] || this.store[key].resetTime <= now) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      return true;
    }

    if (this.store[key].count >= this.config.maxRequests) {
      return false;
    }

    this.store[key].count++;
    return true;
  }

  public getRemainingRequests(identifier: string): number {
    const key = this.getKey(identifier);
    const now = Date.now();

    if (!this.store[key] || this.store[key].resetTime <= now) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - this.store[key].count);
  }

  public getResetTime(identifier: string): number {
    const key = this.getKey(identifier);
    return this.store[key]?.resetTime || Date.now();
  }
}

// Pre-configured rate limiters for different use cases
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5
});

export const searchRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30
});

export const exportRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10
});

export { RateLimiter };