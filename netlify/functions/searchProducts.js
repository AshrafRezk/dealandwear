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
 * Scrape products from a store
 */
async function scrapeStore(store, query) {
  try {
    const searchUrl = store.searchUrl.replace('{query}', encodeURIComponent(query));
    
    const response = await axios.get(searchUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

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
    console.error(`Error scraping ${store.name}:`, error.message);
    return [];
  }
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
        setTimeout(() => reject(new Error('Timeout')), 7000)
      )
    ]).catch(() => [])
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

  try {
    // Parse query parameter
    let query = '';
    if (event.httpMethod === 'GET') {
      query = event.queryStringParameters?.q || event.queryStringParameters?.query || '';
    } else {
      const body = JSON.parse(event.body || '{}');
      query = body.query || body.q || '';
    }

    if (!query || query.trim().length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Query parameter is required (minimum 2 characters)',
          products: []
        })
      };
    }

    // Search products
    const products = await searchProducts(query.trim(), 20);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        query: query.trim(),
        count: products.length,
        products: products
      })
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message,
        products: []
      })
    };
  }
}

