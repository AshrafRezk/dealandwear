# Environment Variables Configuration

## Required Variables

### VITE_GEMINI_API_KEY
- **Purpose**: Google Gemini API key for AI chat functionality
- **Required**: Yes (for AI features)
- **How to get**: 
  1. Go to https://makersuite.google.com/app/apikey
  2. Create a new API key
  3. Copy and add to Netlify environment variables
- **Usage**: Used in `src/services/gemini.js`

## Optional Variables (For Enhanced Features)

### Google Shopping API

#### VITE_GOOGLE_SHOPPING_API_KEY
- **Purpose**: Google Custom Search API key for product search
- **Required**: No (optional enhancement)
- **How to get**:
  1. Go to https://console.cloud.google.com/apis/credentials
  2. Create a new API key
  3. Enable "Custom Search API"
  4. Copy API key
- **Usage**: Used in `src/services/googleShoppingAPI.js`

#### VITE_GOOGLE_CSE_ID
- **Purpose**: Google Custom Search Engine ID
- **Required**: No (only if using Google Shopping API)
- **How to get**:
  1. Go to https://programmablesearchengine.google.com/
  2. Create a new search engine
  3. Add sites: noon.com, namshi.com, shein.com, zara.com, etc.
  4. Copy the Search Engine ID
- **Usage**: Used in `src/services/googleShoppingAPI.js`

### ScraperAPI

#### VITE_SCRAPER_API_KEY
- **Purpose**: ScraperAPI key for reliable web scraping
- **Required**: No (optional enhancement)
- **How to get**:
  1. Sign up at https://www.scraperapi.com/
  2. Get API key from dashboard
  3. Pricing: Starts at $49/month
- **Usage**: Used in `src/services/scraperAPI.js`

## Setting Environment Variables

### Local Development (.env file)

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GOOGLE_SHOPPING_API_KEY=your_google_api_key_here
VITE_GOOGLE_CSE_ID=your_cse_id_here
VITE_SCRAPER_API_KEY=your_scraper_api_key_here
```

### Netlify

1. Go to your Netlify site dashboard
2. Navigate to Site settings → Environment variables
3. Add each variable:
   - Key: `VITE_GEMINI_API_KEY`
   - Value: Your API key
4. Repeat for other variables
5. Redeploy site for changes to take effect

## Feature Flags

The application will gracefully degrade if optional APIs are not configured:
- **No Gemini API**: Chat will use fallback responses
- **No Google Shopping API**: Will use Netlify function + mock data
- **No ScraperAPI**: Will use direct scraping (less reliable)

## Security Notes

- Never commit `.env` files to git
- `.env` is already in `.gitignore`
- API keys are exposed to client (VITE_ prefix)
- Use Netlify environment variables for production
- Consider using server-side API keys for sensitive operations

## Testing Without APIs

The application works without any API keys:
- Mock product data is always available
- Fallback AI responses are provided
- Basic functionality is maintained

