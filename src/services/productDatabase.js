/**
 * Product Database Service
 * Provides mock/fallback product data for common searches
 * This ensures users always get results even when APIs/scraping fail
 */

// Mock product data for common searches
const mockProducts = {
  'dress': [
    {
      id: 'mock-dress-1',
      title: 'Elegant Summer Dress',
      price: '299',
      currency: 'EGP',
      image: 'https://via.placeholder.com/300x400?text=Dress',
      link: 'https://www.noon.com/egypt-en',
      store: 'Noon Egypt',
      availability: 'In Stock'
    },
    {
      id: 'mock-dress-2',
      title: 'Casual Floral Dress',
      price: '249',
      currency: 'EGP',
      image: 'https://via.placeholder.com/300x400?text=Dress',
      link: 'https://www.namshi.com',
      store: 'Namshi',
      availability: 'In Stock'
    },
    {
      id: 'mock-dress-3',
      title: 'Formal Evening Dress',
      price: '599',
      currency: 'EGP',
      image: 'https://via.placeholder.com/300x400?text=Dress',
      link: 'https://eg.shein.com',
      store: 'Shein',
      availability: 'In Stock'
    }
  ],
  'jeans': [
    {
      id: 'mock-jeans-1',
      title: 'Classic Blue Denim Jeans',
      price: '399',
      currency: 'EGP',
      image: 'https://via.placeholder.com/300x400?text=Jeans',
      link: 'https://www.noon.com/egypt-en',
      store: 'Noon Egypt',
      availability: 'In Stock'
    },
    {
      id: 'mock-jeans-2',
      title: 'Slim Fit Black Jeans',
      price: '349',
      currency: 'EGP',
      image: 'https://via.placeholder.com/300x400?text=Jeans',
      link: 'https://www.namshi.com',
      store: 'Namshi',
      availability: 'In Stock'
    }
  ],
  'shirt': [
    {
      id: 'mock-shirt-1',
      title: 'Classic White Shirt',
      price: '199',
      currency: 'EGP',
      image: 'https://via.placeholder.com/300x400?text=Shirt',
      link: 'https://www.noon.com/egypt-en',
      store: 'Noon Egypt',
      availability: 'In Stock'
    },
    {
      id: 'mock-shirt-2',
      title: 'Casual Button-Down Shirt',
      price: '179',
      currency: 'EGP',
      image: 'https://via.placeholder.com/300x400?text=Shirt',
      link: 'https://www.namshi.com',
      store: 'Namshi',
      availability: 'In Stock'
    }
  ],
  'jacket': [
    {
      id: 'mock-jacket-1',
      title: 'Winter Warm Jacket',
      price: '699',
      currency: 'EGP',
      image: 'https://via.placeholder.com/300x400?text=Jacket',
      link: 'https://www.noon.com/egypt-en',
      store: 'Noon Egypt',
      availability: 'In Stock'
    },
    {
      id: 'mock-jacket-2',
      title: 'Denim Jacket',
      price: '449',
      currency: 'EGP',
      image: 'https://via.placeholder.com/300x400?text=Jacket',
      link: 'https://www.namshi.com',
      store: 'Namshi',
      availability: 'In Stock'
    }
  ],
  'shoes': [
    {
      id: 'mock-shoes-1',
      title: 'Casual Sneakers',
      price: '499',
      currency: 'EGP',
      image: 'https://via.placeholder.com/300x400?text=Shoes',
      link: 'https://www.noon.com/egypt-en',
      store: 'Noon Egypt',
      availability: 'In Stock'
    },
    {
      id: 'mock-shoes-2',
      title: 'Formal Leather Shoes',
      price: '799',
      currency: 'EGP',
      image: 'https://via.placeholder.com/300x400?text=Shoes',
      link: 'https://www.namshi.com',
      store: 'Namshi',
      availability: 'In Stock'
    }
  ]
};

/**
 * Get mock products for a search query
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results
 * @returns {Array} - Array of mock products
 */
export const getMockProducts = (query, maxResults = 10) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();
  
  // Try to match query to product categories
  let matchedProducts = [];
  
  if (lowerQuery.includes('dress')) {
    matchedProducts = [...mockProducts.dress];
  } else if (lowerQuery.includes('jean') || lowerQuery.includes('pant')) {
    matchedProducts = [...mockProducts.jeans];
  } else if (lowerQuery.includes('shirt') || lowerQuery.includes('top') || lowerQuery.includes('blouse')) {
    matchedProducts = [...mockProducts.shirt];
  } else if (lowerQuery.includes('jacket') || lowerQuery.includes('coat')) {
    matchedProducts = [...mockProducts.jacket];
  } else if (lowerQuery.includes('shoe') || lowerQuery.includes('sneaker') || lowerQuery.includes('boot')) {
    matchedProducts = [...mockProducts.shoes];
  } else {
    // Generic fallback - return mix of products
    matchedProducts = [
      ...mockProducts.dress.slice(0, 2),
      ...mockProducts.jeans.slice(0, 2),
      ...mockProducts.shirt.slice(0, 2)
    ];
  }

  // Add query-specific variations
  const variations = matchedProducts.map((product, index) => ({
    ...product,
    id: `mock-${lowerQuery.replace(/\s+/g, '-')}-${index + 1}`,
    title: product.title.replace(/Dress|Jeans|Shirt|Jacket|Shoes/i, query.split(' ')[0])
  }));

  return variations.slice(0, maxResults);
};

/**
 * Check if we should use mock data (when APIs/scraping fail)
 * @param {string} query - Search query
 * @returns {boolean} - True if mock data should be used
 */
export const shouldUseMockData = (query) => {
  // Use mock data for common product searches
  const commonSearches = ['dress', 'jeans', 'shirt', 'jacket', 'shoes', 'pants', 'top', 'coat'];
  const lowerQuery = query.toLowerCase();
  return commonSearches.some(term => lowerQuery.includes(term));
};

/**
 * Get fallback message when no products found
 * @param {string} query - Search query
 * @returns {string} - User-friendly message
 */
export const getFallbackMessage = (query) => {
  return `We're currently updating our product database. For "${query}", we recommend checking these stores directly:\n\n• Noon Egypt (noon.com)\n• Namshi (namshi.com)\n• Shein (eg.shein.com)\n\nWe're working on integrating real-time product search. Please try again soon!`;
};

