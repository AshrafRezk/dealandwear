/**
 * Netlify Function for Product Search
 * Searches across Egyptian clothing/fashion stores
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
 * Scrape products from a store with retry logic
 * @param {Object} store - Store configuration
 * @param {string} query - Search query
 * @param {number} retries - Number of retry attempts (default: 2)
 */
async function scrapeStore(store, query, retries = 2) {
  const searchUrl = store.searchUrl.replace('{query}', encodeURIComponent(query));
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(searchUrl, {
        timeout: 5000, // Reduced timeout to prevent hanging
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
    $('[class*="product"], [class*="item"], [data-qa*="product"]').slice(0, 10).each((i, elem) => {
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
      
      // Retry on network errors or timeouts
      if (attempt < retries && (
        error.code === 'ECONNABORTED' || 
        error.message.includes('timeout') ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT'
      )) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
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
  const enabledStores = stores.filter(s => s.enabled);
  const allProducts = [];
  
  // Search stores in parallel with timeout
  const searchPromises = enabledStores.map(store => 
    Promise.race([
      scrapeStore(store, query),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]).catch((error) => {
      // Log but don't throw - return empty array
      console.warn(`Store ${store.name} search failed:`, error.message);
      return [];
    })
  );

  const results = await Promise.allSettled(searchPromises);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allProducts.push(...result.value);
    }
  });

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
export async function handler(event, context) {
  // Set function timeout to prevent hanging (Netlify functions have a max timeout)
  const functionTimeout = 25000; // 25 seconds (Netlify free tier limit is 10s, pro is 26s)
  
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Function timeout - search took too long'));
    }, functionTimeout);
  });

  try {
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
    const safeQuery = sanitizedQuery.replace(/[<>\"']/g, '');

    // Search products with timeout protection
    const searchPromise = searchProducts(safeQuery, 20);
    const products = await Promise.race([searchPromise, timeoutPromise]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        query: safeQuery,
        count: products.length,
        products: products
      })
    };
  } catch (error) {
    console.error('Search error:', error);
    
    // Determine appropriate status code
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      statusCode = 504; // Gateway Timeout
      errorMessage = 'Search request timed out. Please try again with a more specific query.';
    } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      statusCode = 503; // Service Unavailable
      errorMessage = 'Unable to reach product stores. Please try again later.';
    }
    
    return {
      statusCode,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        message: error.message,
        products: []
      })
    };
  }
}

