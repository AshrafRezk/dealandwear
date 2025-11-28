/**
 * ScraperAPI Service
 * Wrapper for ScraperAPI service to handle web scraping more reliably
 * Handles anti-bot protection, CAPTCHAs, and rate limiting
 */

const SCRAPER_API_KEY = import.meta.env.VITE_SCRAPER_API_KEY;
const SCRAPER_API_URL = 'https://api.scraperapi.com';

/**
 * Scrape a URL using ScraperAPI
 * @param {string} url - URL to scrape
 * @param {Object} options - Scraping options
 * @returns {Promise<string>} - HTML content
 */
export const scrapeWithScraperAPI = async (url, options = {}) => {
  try {
    if (!SCRAPER_API_KEY) {
      console.warn('ScraperAPI key not configured');
      throw new Error('ScraperAPI not configured');
    }

    const {
      render = false, // Set to true for JavaScript rendering
      countryCode = 'eg', // Egypt
      premium = false,
      sessionNumber = null
    } = options;

    const params = new URLSearchParams({
      api_key: SCRAPER_API_KEY,
      url: url,
      render: render.toString(),
      country_code: countryCode
    });

    if (premium) {
      params.append('premium', 'true');
    }

    if (sessionNumber) {
      params.append('session_number', sessionNumber.toString());
    }

    const response = await fetch(`${SCRAPER_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`ScraperAPI error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('ScraperAPI error:', error);
    throw error;
  }
};

/**
 * Check if ScraperAPI is configured
 * @returns {boolean} - True if API key is available
 */
export const isScraperAPIConfigured = () => {
  return !!SCRAPER_API_KEY;
};

/**
 * Get ScraperAPI usage info
 * @returns {Object} - Usage information
 */
export const getScraperAPIInfo = () => {
  return {
    configured: isScraperAPIConfigured(),
    url: SCRAPER_API_URL,
    features: {
      antiBot: true,
      javascriptRendering: true,
      countrySpecific: true,
      sessionManagement: true
    }
  };
};

