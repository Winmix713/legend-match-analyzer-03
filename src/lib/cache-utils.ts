// Cache utilities for optimized data storage and retrieval

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, value: T, ttl: number = 300000): void { // 5 min default
    // Remove old entries if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    // This would need to be tracked separately in a real implementation
    return 0;
  }
}

class PersistentCache<T> {
  private memoryCache: MemoryCache<T>;
  private storageKey: string;
  private serialize: (value: any) => string;
  private deserialize: (value: string) => any;

  constructor(
    storageKey: string, 
    options: CacheOptions = {}
  ) {
    this.storageKey = storageKey;
    this.memoryCache = new MemoryCache(options.maxSize);
    this.serialize = options.serialize || JSON.stringify;
    this.deserialize = options.deserialize || JSON.parse;
  }

  async set(key: string, value: T, ttl: number = 300000): Promise<void> {
    // Set in memory cache
    this.memoryCache.set(key, value, ttl);

    // Set in localStorage with metadata
    try {
      const cacheEntry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now()
      };

      localStorage.setItem(
        `${this.storageKey}:${key}`, 
        this.serialize(cacheEntry)
      );
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  async get(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult !== null) {
      return memoryResult;
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`${this.storageKey}:${key}`);
      if (!stored) return null;

      const entry: CacheEntry<T> = this.deserialize(stored);
      
      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(`${this.storageKey}:${key}`);
        return null;
      }

      // Restore to memory cache
      this.memoryCache.set(key, entry.value, entry.ttl);
      
      return entry.value;
    } catch (error) {
      console.warn('Failed to retrieve cache entry:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    localStorage.removeItem(`${this.storageKey}:${key}`);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    // Clear all keys with our prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.storageKey}:`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  getStats() {
    return this.memoryCache.getStats();
  }
}

// Cache factory for creating typed caches
export function createCache<T>(
  storageKey: string, 
  options: CacheOptions = {}
): PersistentCache<T> {
  return new PersistentCache<T>(storageKey, options);
}

// Pre-configured caches for common use cases
export const matchesCache = createCache<any[]>('matches', { ttl: 600000 }); // 10 min
export const statisticsCache = createCache<any>('statistics', { ttl: 300000 }); // 5 min
export const teamNamesCache = createCache<string[]>('teamNames', { ttl: 3600000 }); // 1 hour
export const legendModeCache = createCache<any>('legendMode', { ttl: 600000 }); // 10 min

// Cache key generators
export const cacheKeys = {
  matches: (homeTeam: string, awayTeam: string) => 
    `matches:${homeTeam.toLowerCase()}:${awayTeam.toLowerCase()}`,
  statistics: (homeTeam: string, awayTeam: string) => 
    `stats:${homeTeam.toLowerCase()}:${awayTeam.toLowerCase()}`,
  legendMode: (homeTeam: string, awayTeam: string) => 
    `legend:${homeTeam.toLowerCase()}:${awayTeam.toLowerCase()}`,
  teamNames: () => 'teamNames:all'
};

// Cache invalidation utilities
export const cacheInvalidation = {
  invalidateTeamData: async (teamName: string) => {
    // Find and remove all cache entries containing this team
    const patterns = [
      teamName.toLowerCase(),
      teamName.toLowerCase().replace(/\s+/g, '')
    ];

    // This is a simplified version - in a real app you'd want more sophisticated pattern matching
    await Promise.all([
      matchesCache.clear(),
      statisticsCache.clear(),
      legendModeCache.clear()
    ]);
  },

  invalidateAll: async () => {
    await Promise.all([
      matchesCache.clear(),
      statisticsCache.clear(),
      legendModeCache.clear(),
      teamNamesCache.clear()
    ]);
  }
};