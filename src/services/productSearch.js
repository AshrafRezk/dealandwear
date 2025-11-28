/**
 * Product Search Service
 * Calls the Netlify Function API to search for products
 */

const SEARCH_API_URL = '/.netlify/functions/searchProducts';

/**
 * Search for products across stores
 * @param {string} query - Search query
 * @param {Object} options - Search options (maxResults, filters, etc.)
 * @returns {Promise<Array>} - Array of product objects
 */
export const searchProducts = async (query, options = {}) => {
  try {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    const { maxResults = 20, timeout = 25000 } = options;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      // Call Netlify Function
      const response = await fetch(SEARCH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query.trim(),
          maxResults
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Search failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      return data.products || [];
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Search request timed out. Please try again with a more specific query.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Product search error:', error);
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
 * @param {string} message - User message
 * @returns {boolean} - True if message appears to be a search query
 */
export const isSearchQuery = (message) => {
  if (!message || message.trim().length < 2) {
    return false;
  }

  const lowerMessage = message.toLowerCase().trim();
  
  // Command-based search
  if (lowerMessage.startsWith('/search') || lowerMessage.startsWith('/find')) {
    return true;
  }

  // Natural language search patterns
  const searchPatterns = [
    /(find|search|show|look for|get me|i need|i want|looking for).*(clothing|clothes|fashion|dress|shirt|pants|jeans|shoes|jacket|sweater|t-shirt|tshirt)/i,
    /(find|search|show|look for|get me|i need|i want|looking for).*\b(under|below|over|above)\s+\d+/i,
    /(where can i buy|where to buy|buy|purchase).*/i,
    /(price|cost|how much).*(for|of).*/i
  ];

  return searchPatterns.some(pattern => pattern.test(lowerMessage));
};

/**
 * Extract search query from command or natural language
 * @param {string} message - User message
 * @returns {string} - Extracted search query
 */
export const extractSearchQuery = (message) => {
  if (!message) return '';

  // Handle command-based search
  if (message.startsWith('/search') || message.startsWith('/find')) {
    const parts = message.split(/\s+/);
    parts.shift(); // Remove command
    return parts.join(' ').trim();
  }

  // For natural language, try to extract the product/item being searched
  // Remove common search phrases
  let query = message
    .replace(/^(find|search|show|look for|get me|i need|i want|looking for|where can i buy|where to buy|buy|purchase)\s+/i, '')
    .replace(/\s+(under|below|over|above|for|of|in|at)\s+\d+/gi, '')
    .replace(/\b(egp|usd|eur|£|€|\$)\b/gi, '')
    .trim();

  return query || message.trim();
};

