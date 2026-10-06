/** In-memory stand-in for the /dw/v1 API so journeys run without a Salesforce org. */

const BRANDS = ['MYNE', 'Concrete', 'Town Team'];
const NAMES = ['Linen Striped Shirt', 'Wide Leg Trousers', 'Oversized Blazer', 'Midi Slip Dress', 'Cropped Knit', 'Denim Jacket'];

export function product(i) {
  const price = 600 + i * 50;
  return {
    productId: `01t000000000${String(i).padStart(3, '0')}AAA`,
    name: `${NAMES[i % NAMES.length]} ${i}`,
    brandId: `001000000000${i % BRANDS.length}AAA`,
    brandName: BRANDS[i % BRANDS.length],
    brandOrigin: 'Local_Maker',
    currentPrice: price,
    compareAtPrice: i % 3 === 0 ? price + 300 : null,
    category: 'Shirts',
    fit: 'Relaxed',
    color: 'Blue',
    images: [`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="4" height="5"><rect width="4" height="5" fill="#c9bfae"/></svg>`)}`],
    fitMatch: 70 + (i % 25),
    matchReasons: ['Relaxed silhouette'],
    sizes: ['S', 'M', 'L'],
    description: 'Breathable linen.',
    hasListing: true,
    available: true,
  };
}

const ok = (data, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify({ ok: true, data }) });
const fail = (status, code, message) => ({ status, contentType: 'application/json', body: JSON.stringify({ ok: false, error: { code, message } }) });

export async function mockApi(page, { minSwipes = 4 } = {}) {
  const state = { rated: 0, saves: new Set(), signedIn: false, clickouts: [], searches: [] };
  const catalogue = Array.from({ length: 60 }, (_, i) => product(i));
  const progress = () => ({ rated: state.rated, styledPercent: Math.min(100, Math.round((state.rated * 100) / (minSwipes * 2))), dnaReady: state.rated >= minSwipes });
  const withSaved = (p) => ({ ...p, isSaved: state.saves.has(p.productId) });

  await page.route('**/api/dw/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api\/dw\//, '');
    const method = req.method();
    const body = req.postDataJSON?.() ?? null;
    const offset = Number(url.searchParams.get('offset') || 0);
    const limit = Number(url.searchParams.get('limit') || 24);
    const pageOf = (list) => ({ items: list.slice(offset, offset + limit).map(withSaved), total: list.length, offset, hasMore: offset + limit < list.length });

    if (path === 'guest/start') return route.fulfill(ok({ guestToken: 'guest-token', expiresInMinutes: 60 }));
    if (path === 'events') return route.fulfill(ok({ accepted: true }));
    if (path === 'feed') return route.fulfill(ok({ ...pageOf(catalogue), personalised: state.rated >= minSwipes }));
    if (path === 'catalog/search') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      state.searches.push(Object.fromEntries(url.searchParams));
      const hits = q === 'zzznothing' ? [] : catalogue.filter((p) => !q || p.name.toLowerCase().includes(q.split(' ')[0]));
      const pg = pageOf(hits);
      return route.fulfill(ok({ products: pg.items, total: pg.total, offset, hasMore: pg.hasMore, intent: q ? { category: 'Shirts' } : null }));
    }
    const productMatch = path.match(/^products\/([^/]+)(\/similar)?$/);
    if (productMatch) {
      const p = catalogue.find((x) => x.productId === productMatch[1]);
      if (!p) return route.fulfill(fail(404, 'NOT_FOUND', 'Product not found'));
      if (productMatch[2]) return route.fulfill(ok({ products: catalogue.slice(1, 7).map(withSaved) }));
      return route.fulfill(ok(withSaved(p)));
    }
    if (path === 'swipe/deck') {
      const deck = catalogue.slice(0, 10).map((p, i) => ({ productId: p.productId, imageIndex: 0, imageUrl: p.images[0], name: p.name, brandName: p.brandName, price: p.currentPrice, pair: Math.floor(i / 2) + 1 }));
      return route.fulfill(ok({ deck, minSwipes, ...progress() }));
    }
    if (path === 'swipe' && method === 'POST') {
      if (body?.verdict !== 'skip') state.rated += 1;
      return route.fulfill(ok(progress()));
    }
    if (path === 'swipe/undo') {
      state.rated = Math.max(0, state.rated - 1);
      return route.fulfill(ok(progress()));
    }
    if (path === 'swipe/finalize') return route.fulfill(ok({ ready: state.rated >= minSwipes }));
    if (path === 'dna') {
      if (state.rated < minSwipes) return route.fulfill(ok({ ready: false, minSwipes, ...progress(), archetypes: [], axes: [], evidence: [] }));
      return route.fulfill(
        ok({
          ready: true,
          ...progress(),
          minSwipes,
          primary: { key: 'Soft_Feminine', label: 'Soft Feminine', tagline: 'Fluid fabrics and gentle colour.' },
          archetypes: [
            { key: 'Soft_Feminine', label: 'Soft Feminine', percent: 60, tagline: 'Fluid fabrics and gentle colour.' },
            { key: 'Modern_Minimalist', label: 'Modern Minimalist', percent: 40, tagline: 'Clean lines.' },
          ],
          axes: ['formality', 'palette', 'silhouette'].map((axis, i) => ({ axis, label: axis, bucketLabel: ['casual', 'light', 'relaxed'][i], strength: 40 + i * 15 })),
          summary: '60% Soft Feminine, 40% Modern Minimalist.',
          evidence: catalogue.slice(0, 4),
        }),
      );
    }
    if (path === 'clickout') {
      state.clickouts.push(body);
      return route.fulfill(ok({ url: 'https://example.com/products/1' }));
    }
    if (path === 'saves' && method === 'POST') {
      if (!state.signedIn) return route.fulfill(fail(401, 'AUTH_REQUIRED', 'Sign in to save'));
      state.saves.add(body.productId);
      return route.fulfill(ok({ saved: true }));
    }
    if (path === 'saves') return route.fulfill(ok({ products: catalogue.filter((p) => state.saves.has(p.productId)).map(withSaved) }));
    if (path.startsWith('saves/') && method === 'DELETE') {
      state.saves.delete(path.split('/')[1]);
      return route.fulfill(ok({ saved: false }));
    }
    if (path === 'auth/register' || path === 'auth/login') {
      if (body?.email === 'taken@example.com') return route.fulfill(fail(409, 'EMAIL_IN_USE', 'Email already registered'));
      state.signedIn = true;
      return route.fulfill(ok({ accessToken: 'shopper-token', expiresAt: Date.now() + 3_600_000, contactId: '003000000000001AAA', firstName: body?.firstName || 'Nour' }));
    }
    if (path === 'me' && method === 'GET') {
      return route.fulfill(ok({ firstName: 'Nour', email: 'nour@example.com', personaArchetype: state.rated >= minSwipes ? 'Soft_Feminine' : null, styledPercent: progress().styledPercent, personalization: true }));
    }
    if (path === 'brands') {
      return route.fulfill(ok({ brands: BRANDS.map((name, i) => ({ id: `001000000000${i}AAA`, name, origin: 'Local_Maker', products: catalogue.filter((p) => p.brandName === name).slice(0, 4) })), meta: { total: 3 } }));
    }
    if (path === 'contact') return route.fulfill(ok({ caseNumber: '00001001' }));
    return route.fulfill(fail(404, 'NOT_FOUND', `No mock for ${method} ${path}`));
  });

  return state;
}
