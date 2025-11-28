/**
 * Product Search Service
 * Multi-source product search with caching and fallback chain:
 * 1. Check cache
 * 2. Netlify Function (scraping + mock fallback)
 * 3. Google Shopping API (if configured)
 * 4. Mock data (final fallback)
 */

import { getCachedResults, setCachedResults } from './searchCache';
import { searchWithGoogle, isGoogleAPIConfigured } from './googleShoppingAPI';
import { getMockProducts } from './productDatabase';

const SEARCH_API_URL = '/.netlify/functions/searchProducts';

/**
 * Search for products across stores with multi-source fallback
 * @param {string} query - Search query
 * @param {Object} options - Search options (maxResults, useCache, etc.)
 * @returns {Promise<Array>} - Array of product objects
 */
export const searchProducts = async (query, options = {}) => {
  try {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    const { 
      maxResults = 20, 
      timeout = 25000,
      useCache = true,
      useGoogleAPI = true,
      useMockFallback = true
    } = options;

    const trimmedQuery = query.trim();

    // 1. Check cache first
    if (useCache) {
      const cached = getCachedResults(trimmedQuery);
      if (cached && cached.length > 0) {
        console.log('Returning cached results');
        return cached.slice(0, maxResults);
      }
    }

    // 2. Try Netlify Function (scraping + mock fallback)
    let products = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(SEARCH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: trimmedQuery,
          maxResults
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          products = data.products;
          // Cache successful results
          if (useCache && products.length > 0) {
            setCachedResults(trimmedQuery, products);
          }
        }
      }
    } catch (netlifyError) {
      console.warn('Netlify function search failed:', netlifyError.message);
      // Continue to next source
    }

    // 3. Try Google Shopping API if configured and no results yet
    if (products.length === 0 && useGoogleAPI && isGoogleAPIConfigured()) {
      try {
        const googleProducts = await searchWithGoogle(trimmedQuery, { maxResults });
        if (googleProducts.length > 0) {
          products = googleProducts;
          // Cache Google results
          if (useCache) {
            setCachedResults(trimmedQuery, products);
          }
        }
      } catch (googleError) {
        console.warn('Google Shopping API search failed:', googleError.message);
        // Continue to fallback
      }
    }

    // 4. Final fallback: Mock data
    if (products.length === 0 && useMockFallback) {
      products = getMockProducts(trimmedQuery, maxResults);
      console.log('Using mock data as final fallback');
    }

    return products.slice(0, maxResults);
  } catch (error) {
    console.error('Product search error:', error);
    // Return mock data as last resort
    if (options.useMockFallback !== false) {
      return getMockProducts(query.trim(), options.maxResults || 20);
    }
    throw error;
  }
};

/**
 * Parse natural language query to extract search parameters
 * @param {string} query - Natural language query
 * @returns {Object} - Parsed search parameters
 */
export const parseSearchQuery = (query) => {
  const lowerQuery = query.toLowerCase();
  
  // Extract price range
  const pricePatterns = [
    { pattern: /under\s+(\d+)/i, type: 'max' },
    { pattern: /below\s+(\d+)/i, type: 'max' },
    { pattern: /less\s+than\s+(\d+)/i, type: 'max' },
    { pattern: /over\s+(\d+)/i, type: 'min' },
    { pattern: /above\s+(\d+)/i, type: 'min' },
    { pattern: /more\s+than\s+(\d+)/i, type: 'min' },
    { pattern: /(\d+)\s*-\s*(\d+)/i, type: 'range' }
  ];

  let maxPrice = null;
  let minPrice = null;

  for (const { pattern, type } of pricePatterns) {
    const match = query.match(pattern);
    if (match) {
      if (type === 'max') {
        maxPrice = parseInt(match[1]);
      } else if (type === 'min') {
        minPrice = parseInt(match[1]);
      } else if (type === 'range') {
        minPrice = parseInt(match[1]);
        maxPrice = parseInt(match[2]);
      }
      break;
    }
  }

  // Extract currency (EGP, USD, etc.)
  const currencyMatch = query.match(/\b(egp|usd|eur|£|€|\$)\b/i);
  const currency = currencyMatch ? currencyMatch[1].toUpperCase() : 'EGP';

  // Clean query - remove price-related words
  let cleanQuery = query
    .replace(/under\s+\d+/gi, '')
    .replace(/below\s+\d+/gi, '')
    .replace(/over\s+\d+/gi, '')
    .replace(/above\s+\d+/gi, '')
    .replace(/\d+\s*-\s*\d+/gi, '')
    .replace(/\b(egp|usd|eur|£|€|\$)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    query: cleanQuery,
    maxPrice,
    minPrice,
    currency
  };
};

/**
 * Check if a message is a product search query
 * Uses AI intent detection if available, falls back to pattern matching
 * @param {string} message - User message
 * @param {Function} detectIntent - Optional AI intent detection function
 * @returns {Promise<boolean>} - True if message appears to be a search query
 */
export const isSearchQuery = async (message, detectIntent = null) => {
  if (!message || message.trim().length < 2) {
    return false;
  }

  // If AI intent detection is available, use it
  if (detectIntent && typeof detectIntent === 'function') {
    try {
      const intentData = await detectIntent(message);
      return intentData.intent === 'product_search';
    } catch (error) {
      console.warn('Intent detection failed, using fallback:', error);
      // Fall through to pattern matching
    }
  }

  // Fallback to pattern matching
  const lowerMessage = message.toLowerCase().trim();
  
  // Command-based search
  if (lowerMessage.startsWith('/search') || lowerMessage.startsWith('/find')) {
    return true;
  }

  // Natural language search patterns - expanded
  const searchKeywords = ['find', 'search', 'show', 'look for', 'get me', 'i need', 'i want', 'looking for', 'where can i buy', 'where to buy', 'buy', 'purchase', 'show me'];
  const productKeywords = ['clothing', 'clothes', 'fashion', 'dress', 'shirt', 'pants', 'jeans', 'shoes', 'jacket', 'sweater', 't-shirt', 'tshirt', 'top', 'bottom', 'outfit', 'accessory', 'bag', 'watch', 'jewelry'];
  
  const hasSearchKeyword = searchKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasProductKeyword = productKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasPriceQuery = /\b(under|below|over|above|less than|more than)\s+\d+/i.test(lowerMessage);
  
  // More flexible patterns
  const searchPatterns = [
    /(find|search|show|look for|get me|i need|i want|looking for|where can i buy|where to buy|buy|purchase).*(clothing|clothes|fashion|dress|shirt|pants|jeans|shoes|jacket|sweater|t-shirt|tshirt|top|bottom|outfit)/i,
    /(find|search|show|look for|get me|i need|i want|looking for).*\b(under|below|over|above|less than|more than)\s+\d+/i,
    /(where can i buy|where to buy|buy|purchase).*/i,
    /(price|cost|how much).*(for|of).*/i
  ];

  return (hasSearchKeyword && (hasProductKeyword || hasPriceQuery)) || 
         searchPatterns.some(pattern => pattern.test(lowerMessage));
};

/**
 * Extract search query from command or natural language
 * @param {string} message - User message
 * @param {Object} intentData - Optional intent detection data
 * @returns {string} - Extracted search query
 */
export const extractSearchQuery = (message, intentData = null) => {
  if (!message) return '';

  // If intent data is available and has search query, use it
  if (intentData && intentData.extractedData && intentData.extractedData.searchQuery) {
    return intentData.extractedData.searchQuery;
  }

  // Handle command-based search
  if (message.startsWith('/search') || message.startsWith('/find')) {
    const parts = message.split(/\s+/);
    parts.shift(); // Remove command
    return parts.join(' ').trim();
  }

  // For natural language, try to extract the product/item being searched
  // Remove common search phrases - expanded list
  let query = message
    .replace(/^(find|search|show|show me|look for|get me|i need|i want|looking for|where can i buy|where to buy|buy|purchase|need|want)\s+/i, '')
    .replace(/\s+(under|below|over|above|less than|more than|for|of|in|at)\s+\d+/gi, '')
    .replace(/\b(egp|usd|eur|£|€|\$)\b/gi, '')
    .replace(/\b(please|can you|could you|help me)\s+/gi, '')
    .trim();

  return query || message.trim();
};

