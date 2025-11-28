/**
 * Google Shopping API Service
 * Integrates with Google Shopping API for product search
 * Free, reliable, and legal alternative to web scraping
 */

const GOOGLE_SHOPPING_API_KEY = import.meta.env.VITE_GOOGLE_SHOPPING_API_KEY;
const GOOGLE_CUSTOM_SEARCH_ENGINE_ID = import.meta.env.VITE_GOOGLE_CSE_ID;

// Google Custom Search API (can search shopping results)
const GOOGLE_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';

/**
 * Search products using Google Custom Search API
 * Note: This searches the web, not specifically shopping, but can find product pages
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of product-like results
 */
export const searchWithGoogle = async (query, options = {}) => {
  try {
    if (!GOOGLE_SHOPPING_API_KEY || !GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
      console.warn('Google API keys not configured');
      return [];
    }

    const { maxResults = 10 } = options;
    
    // Search for products on Egyptian e-commerce sites
    const searchQuery = `${query} site:noon.com OR site:namshi.com OR site:shein.com OR site:zara.com`;
    
    const response = await fetch(
      `${GOOGLE_SEARCH_API_URL}?key=${GOOGLE_SHOPPING_API_KEY}&cx=${GOOGLE_CUSTOM_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=${maxResults}`
    );

    if (!response.ok) {
      console.warn('Google Search API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Convert Google search results to product format
    return data.items.map((item, index) => ({
      id: `google-${index}-${Date.now()}`,
      title: item.title,
      price: extractPriceFromSnippet(item.snippet),
      currency: 'EGP',
      image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || '',
      link: item.link,
      store: extractStoreFromUrl(item.link),
      availability: 'In Stock'
    }));
  } catch (error) {
    console.error('Google Search API error:', error);
    return [];
  }
};

/**
 * Extract price from snippet text
 */
const extractPriceFromSnippet = (snippet) => {
  if (!snippet) return null;
  const priceMatch = snippet.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:EGP|LE|£)/i);
  if (priceMatch) {
    return priceMatch[1].replace(/,/g, '');
  }
  return null;
};

/**
 * Extract store name from URL
 */
const extractStoreFromUrl = (url) => {
  if (!url) return 'Unknown Store';
  
  if (url.includes('noon.com')) return 'Noon Egypt';
  if (url.includes('namshi.com')) return 'Namshi';
  if (url.includes('shein.com')) return 'Shein';
  if (url.includes('zara.com')) return 'Zara';
  if (url.includes('hm.com')) return 'H&M';
  if (url.includes('maxfashion.com')) return 'Max Fashion';
  
  // Extract domain name
  try {
    const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Online Store';
  }
};

/**
 * Check if Google API is configured
 * @returns {boolean} - True if API keys are available
 */
export const isGoogleAPIConfigured = () => {
  return !!(GOOGLE_SHOPPING_API_KEY && GOOGLE_CUSTOM_SEARCH_ENGINE_ID);
};

