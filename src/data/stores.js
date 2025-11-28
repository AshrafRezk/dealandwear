/**
 * Egyptian Clothing & Fashion Stores Configuration
 * Configurable list of stores with scraping configuration
 */

export const stores = [
  {
    id: 'noon-egypt',
    name: 'Noon Egypt',
    baseUrl: 'https://www.noon.com',
    searchUrl: 'https://www.noon.com/egypt-en/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '[data-qa="product-item"]',
      title: '[data-qa="product-name"]',
      price: '[data-qa="product-price"]',
      image: '[data-qa="product-image"] img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'namshi',
    name: 'Namshi',
    baseUrl: 'https://www.namshi.com',
    searchUrl: 'https://www.namshi.com/eg-en/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product-item',
      title: '.product-title',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'shein',
    name: 'Shein',
    baseUrl: 'https://eg.shein.com',
    searchUrl: 'https://eg.shein.com/search?keyword={query}',
    enabled: true,
    selectors: {
      productContainer: '.S-product-item',
      title: '.S-product-item__name',
      price: '.S-product-item__price',
      image: '.S-product-item__img img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'hm-egypt',
    name: 'H&M Egypt',
    baseUrl: 'https://www2.hm.com',
    searchUrl: 'https://www2.hm.com/en_eg/shop/search.html?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product-item',
      title: '.product-item-title',
      price: '.product-item-price',
      image: '.product-item-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'zara-egypt',
    name: 'Zara Egypt',
    baseUrl: 'https://www.zara.com',
    searchUrl: 'https://www.zara.com/eg/en/search?searchTerm={query}',
    enabled: true,
    selectors: {
      productContainer: '.product',
      title: '.product-name',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'max-fashion',
    name: 'Max Fashion',
    baseUrl: 'https://www.maxfashion.com',
    searchUrl: 'https://www.maxfashion.com/eg/en/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product-tile',
      title: '.product-name',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'defacto-egypt',
    name: 'DeFacto Egypt',
    baseUrl: 'https://www.defacto.com.tr',
    searchUrl: 'https://www.defacto.com.tr/en/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product-item',
      title: '.product-title',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'american-eagle-egypt',
    name: 'American Eagle Egypt',
    baseUrl: 'https://www.ae.com',
    searchUrl: 'https://www.ae.com/eg/en/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product-tile',
      title: '.product-name',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'dalydress',
    name: 'Dalydress',
    baseUrl: 'https://www.dalydress.com',
    searchUrl: 'https://www.dalydress.com/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product-item',
      title: '.product-title',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'mona3eni',
    name: 'Mona3eni',
    baseUrl: 'https://www.mona3eni.com',
    searchUrl: 'https://www.mona3eni.com/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product',
      title: '.product-name',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'caesar',
    name: 'Caesar',
    baseUrl: 'https://www.caesar.com.eg',
    searchUrl: 'https://www.caesar.com.eg/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product-item',
      title: '.product-title',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'pharaohs-closet',
    name: "Pharaoh's Closet",
    baseUrl: 'https://www.pharaohscloset.com',
    searchUrl: 'https://www.pharaohscloset.com/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product',
      title: '.product-name',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'mlameh-fashion',
    name: 'Mlameh Fashion',
    baseUrl: 'https://www.mlameh.com',
    searchUrl: 'https://www.mlameh.com/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product-item',
      title: '.product-title',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'seerah',
    name: 'Seerah',
    baseUrl: 'https://www.seerah.com',
    searchUrl: 'https://www.seerah.com/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product',
      title: '.product-name',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'kemet-cult',
    name: 'KEMET Cult',
    baseUrl: 'https://www.kemetcult.com',
    searchUrl: 'https://www.kemetcult.com/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product-item',
      title: '.product-title',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'salah-shop',
    name: 'Salah Shop',
    baseUrl: 'https://www.salahshop.com',
    searchUrl: 'https://www.salahshop.com/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product',
      title: '.product-name',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'shop-like-egyptian',
    name: 'Shop Like an Egyptian',
    baseUrl: 'https://www.shoplikeanegyptian.com',
    searchUrl: 'https://www.shoplikeanegyptian.com/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product-item',
      title: '.product-title',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  },
  {
    id: 'soonaboosh',
    name: 'Soonaboosh',
    baseUrl: 'https://www.soonaboosh.com',
    searchUrl: 'https://www.soonaboosh.com/search?q={query}',
    enabled: true,
    selectors: {
      productContainer: '.product',
      title: '.product-name',
      price: '.product-price',
      image: '.product-image img',
      link: 'a'
    },
    currency: 'EGP'
  }
];

/**
 * Get enabled stores only
 */
export const getEnabledStores = () => {
  return stores.filter(store => store.enabled);
};

/**
 * Get store by ID
 */
export const getStoreById = (id) => {
  return stores.find(store => store.id === id);
};

