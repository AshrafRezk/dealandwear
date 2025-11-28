/**
 * Search Cache Service
 * Caches search results to reduce API calls and improve performance
 * Uses localStorage for client-side caching
 */

const CACHE_PREFIX = 'product_search_cache_';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

/**
 * Generate cache key from query
 */
const getCacheKey = (query) => {
  return `${CACHE_PREFIX}${query.toLowerCase().trim().replace(/\s+/g, '_')}`;
};

/**
 * Get cached search results
 * @param {string} query - Search query
 * @returns {Array|null} - Cached products or null if not found/expired
 */
export const getCachedResults = (query) => {
  try {
    const cacheKey = getCacheKey(query);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }

    const { products, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    // Check if cache is still valid
    if (age > CACHE_TTL) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return products;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

/**
 * Cache search results
 * @param {string} query - Search query
 * @param {Array} products - Products to cache
 */
export const setCachedResults = (query, products) => {
  try {
    const cacheKey = getCacheKey(query);
    const cacheData = {
      products,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing cache:', error);
    // If storage is full, try to clear old entries
    clearOldCacheEntries();
  }
};

/**
 * Clear old cache entries to free up space
 */
const clearOldCacheEntries = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    // Sort by timestamp and remove oldest 50%
    const entries = cacheKeys.map(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        return { key, timestamp: data.timestamp };
      } catch {
        return { key, timestamp: 0 };
      }
    }).sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest half
    const toRemove = entries.slice(0, Math.floor(entries.length / 2));
    toRemove.forEach(({ key }) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing old cache:', error);
  }
};

/**
 * Clear all cached search results
 */
export const clearCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.filter(key => key.startsWith(CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
export const getCacheStats = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    let totalSize = 0;
    let validEntries = 0;
    let expiredEntries = 0;

    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          totalSize += cached.length;
          const { timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (age <= CACHE_TTL) {
            validEntries++;
          } else {
            expiredEntries++;
          }
        }
      } catch {
        expiredEntries++;
      }
    });

    return {
      totalEntries: cacheKeys.length,
      validEntries,
      expiredEntries,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`
    };
  } catch (error) {
    return { error: error.message };
  }
};

