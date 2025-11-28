/**
 * Netlify Function for Product Search
 * Multi-source product search with fallback chain:
 * 1. Direct scraping (if enabled)
 * 2. Mock/fallback data
 * 
 * Note: For production, integrate:
 * - Google Shopping API
 * - ScraperAPI service
 * - Affiliate program APIs
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Store configurations (simplified for Netlify Function)
const stores = [
  {
    id: 'noon-egypt',
    name: 'Noon Egypt',
    baseUrl: 'https://www.noon.com',
    searchUrl: 'https://www.noon.com/egypt-en/search?q={query}',
    enabled: true,
    currency: 'EGP'
  },
  {
    id: 'namshi',
    name: 'Namshi',
    baseUrl: 'https://www.namshi.com',
    searchUrl: 'https://www.namshi.com/eg-en/search?q={query}',
    enabled: true,
    currency: 'EGP'
  },
  {
    id: 'shein',
    name: 'Shein',
    baseUrl: 'https://eg.shein.com',
    searchUrl: 'https://eg.shein.com/search?keyword={query}',
    enabled: true,
    currency: 'EGP'
  },
  {
    id: 'hm-egypt',
    name: 'H&M Egypt',
    baseUrl: 'https://www2.hm.com',
    searchUrl: 'https://www2.hm.com/en_eg/shop/search.html?q={query}',
    enabled: true,
    currency: 'EGP'
  },
  {
    id: 'zara-egypt',
    name: 'Zara Egypt',
    baseUrl: 'https://www.zara.com',
    searchUrl: 'https://www.zara.com/eg/en/search?searchTerm={query}',
    enabled: true,
    currency: 'EGP'
  },
  {
    id: 'max-fashion',
    name: 'Max Fashion',
    baseUrl: 'https://www.maxfashion.com',
    searchUrl: 'https://www.maxfashion.com/eg/en/search?q={query}',
    enabled: true,
    currency: 'EGP'
  }
];

/**
 * Get mock/fallback products for common searches
 * Ensures users always get results even when scraping fails
 */
function getMockProducts(query, maxResults = 10) {
  const lowerQuery = query.toLowerCase();
  const mockProducts = [];

  // Generate mock products based on query
  if (lowerQuery.includes('dress')) {
    for (let i = 1; i <= Math.min(5, maxResults); i++) {
      mockProducts.push({
        id: `mock-dress-${i}`,
        title: `${['Elegant', 'Casual', 'Formal', 'Summer', 'Evening'][i - 1]} Dress`,
        price: (200 + i * 50).toString(),
        currency: 'EGP',
        image: '',
        link: 'https://www.noon.com/egypt-en',
        store: 'Noon Egypt',
        availability: 'In Stock'
      });
    }
  } else if (lowerQuery.includes('jean') || lowerQuery.includes('pant')) {
    for (let i = 1; i <= Math.min(5, maxResults); i++) {
      mockProducts.push({
        id: `mock-jeans-${i}`,
        title: `${['Classic', 'Slim Fit', 'Skinny', 'Straight', 'Relaxed'][i - 1]} Jeans`,
        price: (300 + i * 50).toString(),
        currency: 'EGP',
        image: '',
        link: 'https://www.namshi.com',
        store: 'Namshi',
        availability: 'In Stock'
      });
    }
  } else if (lowerQuery.includes('shirt') || lowerQuery.includes('top')) {
    for (let i = 1; i <= Math.min(5, maxResults); i++) {
      mockProducts.push({
        id: `mock-shirt-${i}`,
        title: `${['Classic', 'Casual', 'Formal', 'Polo', 'T-Shirt'][i - 1]} Shirt`,
        price: (150 + i * 30).toString(),
        currency: 'EGP',
        image: '',
        link: 'https://www.noon.com/egypt-en',
        store: 'Noon Egypt',
        availability: 'In Stock'
      });
    }
  } else {
    // Generic products
    for (let i = 1; i <= Math.min(3, maxResults); i++) {
      mockProducts.push({
        id: `mock-product-${i}`,
        title: `Product for "${query}"`,
        price: (200 + i * 100).toString(),
        currency: 'EGP',
        image: '',
        link: 'https://www.noon.com/egypt-en',
        store: 'Noon Egypt',
        availability: 'In Stock'
      });
    }
  }

  return mockProducts.slice(0, maxResults);
}

/**
 * Scrape products from a store with retry logic
 * @param {Object} store - Store configuration
 * @param {string} query - Search query
 * @param {number} retries - Number of retry attempts (default: 0 - no retries for speed)
 */
async function scrapeStore(store, query, retries = 0) {
  const searchUrl = store.searchUrl.replace('{query}', encodeURIComponent(query));
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(searchUrl, {
        timeout: 2000, // 2 seconds - very aggressive timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      });

      // If we get a non-2xx status, return empty results
      if (response.status >= 400) {
        if (attempt < retries) {
          // Retry on 4xx errors (might be rate limiting)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        console.warn(`${store.name} returned status ${response.status} after ${attempt + 1} attempts`);
        return [];
      }

    const $ = cheerio.load(response.data);
    const products = [];

    // Generic product extraction - try common selectors
    // This is a simplified version - each store would need specific selectors
    // Limit to 5 products per store to speed up processing
    $('[class*="product"], [class*="item"], [data-qa*="product"]').slice(0, 5).each((i, elem) => {
      try {
        const $elem = $(elem);
        
        // Try to find title
        const title = $elem.find('[class*="title"], [class*="name"], h2, h3, a').first().text().trim();
        if (!title || title.length < 3) return;

        // Try to find price
        const priceText = $elem.find('[class*="price"], [data-qa*="price"]').first().text().trim();
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        const price = priceMatch ? priceMatch[0].replace(/,/g, '') : null;

        // Try to find image
        const image = $elem.find('img').first().attr('src') || $elem.find('img').first().attr('data-src') || '';

        // Try to find link
        const link = $elem.find('a').first().attr('href') || '';
        const fullLink = link.startsWith('http') ? link : `${store.baseUrl}${link}`;

        if (title && price) {
          products.push({
            id: `${store.id}-${i}-${Date.now()}`,
            title: title.substring(0, 100),
            price: price,
            currency: store.currency,
            image: image.startsWith('http') ? image : image.startsWith('//') ? `https:${image}` : `${store.baseUrl}${image}`,
            link: fullLink,
            store: store.name,
            availability: 'In Stock'
          });
        }
      } catch (err) {
        console.error(`Error parsing product ${i} from ${store.name}:`, err.message);
      }
    });

      return products;
    } catch (error) {
      // Log error
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.warn(`${store.name} request timed out (attempt ${attempt + 1}/${retries + 1})`);
      } else if (error.response) {
        console.warn(`${store.name} returned error: ${error.response.status} ${error.response.statusText} (attempt ${attempt + 1}/${retries + 1})`);
      } else {
        console.error(`Error scraping ${store.name}:`, error.message, `(attempt ${attempt + 1}/${retries + 1})`);
      }
      
      // Retry on network errors or timeouts (only if we have time)
      if (attempt < retries && (
        error.code === 'ECONNABORTED' || 
        error.message.includes('timeout') ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT'
      )) {
        // Short backoff to save time
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      
      // If all retries failed, return empty array
      if (attempt === retries) {
        return [];
      }
    }
  }
  
  return [];
}

/**
 * Search products across multiple stores
 */
async function searchProducts(query, maxResults = 20) {
  // Check if dependencies are available
  if (!axios || !cheerio) {
    console.warn('Dependencies not available, returning empty results');
    return [];
  }

  const enabledStores = stores.filter(s => s.enabled);
  // Limit to 2 stores max to stay well within timeout
  const storesToSearch = enabledStores.slice(0, 2);
  const allProducts = [];
  
  try {
    // Search stores in parallel with aggressive timeout
    const searchPromises = storesToSearch.map(store => 
      Promise.race([
        scrapeStore(store, query),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ]).catch((error) => {
        // Log but don't throw - return empty array
        console.warn(`Store ${store.name} search failed:`, error.message);
        return [];
      })
    );

    const results = await Promise.allSettled(searchPromises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allProducts.push(...result.value);
      }
    });
  } catch (error) {
    console.error('Error in searchProducts:', error);
    return [];
  }

  // Remove duplicates based on title similarity
  const uniqueProducts = [];
  const seenTitles = new Set();
  
  for (const product of allProducts) {
    const normalizedTitle = product.title.toLowerCase().trim();
    if (!seenTitles.has(normalizedTitle) && uniqueProducts.length < maxResults) {
      seenTitles.add(normalizedTitle);
      uniqueProducts.push(product);
    }
  }

  return uniqueProducts;
}

/**
 * Handler function
 */
export async function handler(event) {
  // Set function timeout to prevent hanging (Netlify free tier limit is 10s)
  const functionTimeout = 8000; // 8 seconds - more conservative for free tier
  
  // Ensure we always return a valid response
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    // Only allow GET and POST
    if (!['GET', 'POST'].includes(event.httpMethod)) {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Method not allowed',
          products: []
        })
      };
    }

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Function timeout - search took too long'));
      }, functionTimeout);
    });

    // Parse query parameter
    let query = '';
    try {
      if (event.httpMethod === 'GET') {
        query = event.queryStringParameters?.q || event.queryStringParameters?.query || '';
      } else {
        const body = JSON.parse(event.body || '{}');
        query = body.query || body.q || '';
      }
    } catch (parseError) {
      console.error('Error parsing request:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Invalid request format',
          products: []
        })
      };
    }

    // Validate and sanitize query
    const sanitizedQuery = query.trim();
    
    if (!sanitizedQuery || sanitizedQuery.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Query parameter is required (minimum 2 characters)',
          products: []
        })
      };
    }
    
    // Limit query length to prevent abuse
    if (sanitizedQuery.length > 200) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Query is too long (maximum 200 characters)',
          products: []
        })
      };
    }
    
    // Basic sanitization - remove potentially dangerous characters
    const safeQuery = sanitizedQuery.replace(/[<>"']/g, '');

    // Log search start for debugging
    console.log(`Search started for query: "${safeQuery}"`);
    const startTime = Date.now();
    
    // Multi-source search with fallback chain
    let products = [];
    let source = 'none';
    
    try {
      // Try scraping first (if enabled and dependencies available)
      if (axios && cheerio) {
        try {
          const searchPromise = searchProducts(safeQuery, 15);
          products = await Promise.race([searchPromise, timeoutPromise]);
          if (products.length > 0) {
            source = 'scraping';
          }
        } catch (scrapeError) {
          console.warn('Scraping failed, trying fallback:', scrapeError.message);
        }
      }
      
      // Fallback to mock data if scraping failed or returned no results
      if (products.length === 0) {
        products = getMockProducts(safeQuery, 15);
        source = 'mock';
        console.log(`Using mock data for query: "${safeQuery}"`);
      }
      
    } catch (searchError) {
      // Final fallback - always return something
      console.warn('All search methods failed, using mock data:', searchError.message);
      products = getMockProducts(safeQuery, 15);
      source = 'mock';
    }
    
    const duration = Date.now() - startTime;
    console.log(`Search completed in ${duration}ms, found ${products.length} products (source: ${source})`);

    // Always return success with results (even if mock)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        query: safeQuery,
        count: products.length,
        products: products,
        source: source, // Indicate data source for debugging
        cached: false
      })
    };
  } catch (error) {
    console.error('Handler error:', error);
    
    // Always return a valid response - never crash
    // Return empty results instead of error to prevent 502
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        query: event.body ? (JSON.parse(event.body || '{}').query || '') : '',
        count: 0,
        products: [],
        message: 'Search temporarily unavailable. Please try again in a moment.'
      })
    };
  }
}

