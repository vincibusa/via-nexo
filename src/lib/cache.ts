interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttl: number = 300000): void {
    // Default 5 minutes
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(
        `Cache cleanup: removed ${keysToDelete.length} expired entries`
      );
    }
  }
}

// Cache instances for different data types
const embeddingsCache = new MemoryCache(500); // Cache for embeddings
const searchCache = new MemoryCache(1000); // Cache for search results
const agentCache = new MemoryCache(200); // Cache for agent responses

export { MemoryCache, embeddingsCache, searchCache, agentCache };

// Utility functions
export function createCacheKey(
  ...parts: (string | number | boolean | undefined)[]
): string {
  return parts
    .filter(part => part !== undefined && part !== null)
    .map(part => String(part).toLowerCase().trim())
    .join(":");
}

export async function withCache<T>(
  cache: MemoryCache,
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300000 // 5 minutes default
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    console.log(`Cache hit: ${key}`);
    return cached;
  }

  console.log(`Cache miss: ${key}`);

  // Fetch and cache the result
  const result = await fetcher();
  cache.set(key, result, ttl);

  return result;
}

// Hash function for creating consistent cache keys
export function hashString(str: string): string {
  let hash = 0;
  if (str.length === 0) return "0";

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}
