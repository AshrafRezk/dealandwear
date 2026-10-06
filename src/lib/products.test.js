import { formatPrice, normalizeList, normalizeProduct } from './products';

describe('normalizeProduct', () => {
  it('maps the ranked product DTO', () => {
    const p = normalizeProduct({
      productId: '01t000000000001AAA',
      name: 'Linen Shirt',
      brandAccountId: '001000000000001AAA',
      brandName: 'MYNE',
      currentPrice: 800,
      compareAtPrice: 1000,
      discountPercent: 20,
      images: ['https://img/1.jpg', 'https://img/2.jpg'],
      fitMatch: 92,
      matchReasons: ['Relaxed cuts you like'],
      isSaved: true,
      hasListing: true,
    });
    expect(p).toMatchObject({
      id: '01t000000000001AAA',
      brandId: '001000000000001AAA',
      price: 800,
      compareAtPrice: 1000,
      discountPercent: 20,
      image: 'https://img/1.jpg',
      fitMatch: 92,
      isSaved: true,
    });
  });

  it('maps the older brand-directory DTO and derives the discount', () => {
    const p = normalizeProduct({ productId: 'x1', name: 'Dress', currentPrice: '750', compareAtPrice: '1000', imageUrl1: 'a.jpg', imageUrl2: null, imageUrl3: 'c.jpg' });
    expect(p.images).toEqual(['a.jpg', 'c.jpg']);
    expect(p.discountPercent).toBe(25);
    expect(p.fitMatch).toBeNull();
  });

  it('ignores a compare price that is not higher than the price', () => {
    const p = normalizeProduct({ productId: 'x2', currentPrice: 500, compareAtPrice: 500 });
    expect(p.compareAtPrice).toBeNull();
    expect(p.discountPercent).toBeNull();
  });

  it('drops rows without an id', () => {
    expect(normalizeList([{ name: 'no id' }, { productId: 'ok' }, null])).toHaveLength(1);
    expect(normalizeList(undefined)).toEqual([]);
  });
});

describe('formatPrice', () => {
  it('formats Egyptian pounds without decimals', () => {
    expect(formatPrice(1250)).toMatch(/1,250/);
    expect(formatPrice(1250)).toMatch(/EGP|E£/);
  });
  it('returns an empty string for missing prices', () => {
    expect(formatPrice(null)).toBe('');
  });
});
