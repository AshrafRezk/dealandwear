// Brand data with logos (using placeholder URLs - can be replaced with actual brand logo images)
// The BrandCard component has fallback emojis if images fail to load
export const brands = [
  {
    id: 1,
    name: 'Nike',
    logo: 'https://cdn.simpleicons.org/nike/000000',
    category: 'sportswear',
    priceRange: '$$'
  },
  {
    id: 2,
    name: 'Adidas',
    logo: 'https://cdn.simpleicons.org/adidas/000000',
    category: 'sportswear',
    priceRange: '$$'
  },
  {
    id: 3,
    name: 'Zara',
    logo: 'https://cdn.simpleicons.org/zara/000000',
    category: 'fast-fashion',
    priceRange: '$$'
  },
  {
    id: 4,
    name: 'H&M',
    logo: 'https://cdn.simpleicons.org/hm/000000',
    category: 'fast-fashion',
    priceRange: '$'
  },
  {
    id: 5,
    name: 'Gucci',
    logo: null, // SimpleIcons doesn't have Gucci - will use fallback emoji
    category: 'luxury',
    priceRange: '$$$$'
  },
  {
    id: 6,
    name: 'Prada',
    logo: null, // SimpleIcons doesn't have Prada - will use fallback emoji
    category: 'luxury',
    priceRange: '$$$$'
  },
  {
    id: 7,
    name: 'Uniqlo',
    logo: 'https://cdn.simpleicons.org/uniqlo/000000',
    category: 'casual',
    priceRange: '$$'
  },
  {
    id: 8,
    name: 'Levi\'s',
    logo: 'https://cdn.simpleicons.org/levis/000000',
    category: 'denim',
    priceRange: '$$'
  },
  {
    id: 9,
    name: 'Tommy Hilfiger',
    logo: 'https://cdn.simpleicons.org/tommyhilfiger/000000',
    category: 'casual',
    priceRange: '$$$'
  },
  {
    id: 10,
    name: 'Calvin Klein',
    logo: 'https://cdn.simpleicons.org/calvinklein/000000',
    category: 'casual',
    priceRange: '$$$'
  }
];

// Fallback brand emojis if images don't load
export const brandEmojis = {
  'Nike': '✓',
  'Adidas': '△',
  'Zara': 'Z',
  'H&M': 'H&M',
  'Gucci': 'GG',
  'Prada': 'PRADA',
  'Uniqlo': 'U',
  'Levi\'s': 'L',
  'Tommy Hilfiger': 'TH',
  'Calvin Klein': 'CK'
};

