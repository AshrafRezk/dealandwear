/** One product shape for every screen; the brand directory still returns the older DTO, so both are accepted. */
export function normalizeProduct(p) {
  if (!p) return null;
  const images = (Array.isArray(p.images) && p.images.length ? p.images : [p.imageUrl1, p.imageUrl2, p.imageUrl3]).filter(Boolean);
  const current = numberOrNull(p.currentPrice ?? p.price);
  const compare = numberOrNull(p.compareAtPrice);
  const discount =
    p.discountPercent ?? (current && compare && compare > current ? Math.round(((compare - current) * 100) / compare) : null);
  return {
    id: p.productId || p.id,
    name: p.name || '',
    brandId: p.brandAccountId || p.brandId || null,
    brandName: p.brandName || '',
    brandLogoUrl: p.brandLogoUrl || null,
    brandOrigin: p.brandOrigin || null,
    price: current,
    compareAtPrice: compare && current && compare > current ? compare : null,
    discountPercent: discount && discount > 0 ? discount : null,
    category: p.category || null,
    fit: p.fit || null,
    garmentType: p.garmentType || null,
    color: p.color || null,
    material: p.material || null,
    images,
    image: images[0] || null,
    fitMatch: Number.isFinite(p.fitMatch) ? p.fitMatch : null,
    matchReasons: Array.isArray(p.matchReasons) ? p.matchReasons : [],
    isSaved: Boolean(p.isSaved),
    hasListing: p.hasListing !== false,
    description: p.description || '',
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    available: p.available !== false,
    priceDropped: Boolean(p.priceDropped),
  };
}

export function normalizeList(list) {
  return (Array.isArray(list) ? list : []).map(normalizeProduct).filter((p) => p && p.id);
}

function numberOrNull(v) {
  const n = Number(v);
  return v === null || v === undefined || v === '' || !Number.isFinite(n) ? null : n;
}

const formatters = new Map();

export function formatPrice(amount, locale = 'en', currency = 'EGP') {
  if (amount === null || amount === undefined) return '';
  const key = `${locale}|${currency}`;
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', { style: 'currency', currency, maximumFractionDigits: 0 }));
  }
  return formatters.get(key).format(amount);
}

export const CATEGORIES = [
  'Tops',
  'Shirts',
  'Knitwear',
  'Dresses',
  'Skirts',
  'Trousers',
  'Jeans',
  'Shorts',
  'Outerwear',
  'Suits',
  'Activewear',
  'Modest_Wear',
  'Loungewear',
  'Intimates',
  'Swimwear',
  'Shoes',
  'Bags',
  'Accessories',
];

export const FITS = ['Relaxed', 'Tailored', 'Oversized', 'Fitted', 'True_to_size', 'Cropped'];

export const SORTS = ['relevance', 'price_asc', 'price_desc', 'newest', 'discount'];

export const PRICE_BANDS = [
  { key: '0-750', min: null, max: 750 },
  { key: '750-1500', min: 750, max: 1500 },
  { key: '1500-3000', min: 1500, max: 3000 },
  { key: '3000+', min: 3000, max: null },
];
