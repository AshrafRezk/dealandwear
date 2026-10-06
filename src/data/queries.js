import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ensureGuest } from '../lib/api';
import { normalizeList, normalizeProduct } from '../lib/products';
import { sessionId, setShopFor, shopFor } from '../lib/session';
import { EVENTS, track } from '../lib/analytics';
import { feedback, haptic } from '../lib/feedback';
import { useAuth } from '../auth/AuthContext';

const PAGE = 24;

async function asShopper(fn) {
  await ensureGuest().catch(() => null);
  return fn();
}

function cleanParams(params) {
  const out = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '' && v !== false) out[k] = v;
  }
  return out;
}

// ---------------------------------------------------------------- discovery

export function useFeed(filters = {}, { enabled = true } = {}) {
  const params = cleanParams({ gender: shopFor() ?? undefined, ...filters });
  return useInfiniteQuery({
    queryKey: ['feed', params],
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      asShopper(() => api.get('feed', { ...params, offset: pageParam, limit: PAGE }, { signal })).then((d) => ({
        items: normalizeList(d.items),
        total: d.total ?? 0,
        hasMore: Boolean(d.hasMore),
        personalised: Boolean(d.personalised),
        next: (d.offset ?? pageParam) + (d.items?.length ?? 0),
      })),
    getNextPageParam: (last) => (last.hasMore ? last.next : undefined),
  });
}

export function useSearch(params, { enabled = true } = {}) {
  const clean = cleanParams(params);
  return useInfiniteQuery({
    queryKey: ['search', clean],
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      asShopper(() => api.get('catalog/search', { ...clean, offset: pageParam, limit: PAGE }, { signal })).then((d) => ({
        items: normalizeList(d.products),
        total: d.total ?? 0,
        hasMore: Boolean(d.hasMore),
        personalised: Boolean(d.personalised),
        intent: d.intent || null,
        next: (d.offset ?? pageParam) + (d.products?.length ?? 0),
      })),
    getNextPageParam: (last) => (last.hasMore ? last.next : undefined),
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: ['product', id],
    enabled: Boolean(id),
    queryFn: ({ signal }) => asShopper(() => api.get(`products/${id}`, null, { signal })).then(normalizeProduct),
  });
}

export function useSimilar(id) {
  return useQuery({
    queryKey: ['similar', id],
    enabled: Boolean(id),
    queryFn: ({ signal }) => asShopper(() => api.get(`products/${id}/similar`, { limit: 12 }, { signal })).then((d) => normalizeList(d.products)),
  });
}

export function useBrands(params = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: ['brands', clean],
    queryFn: ({ signal }) =>
      api.get('brands', { limit: 60, productsPerBrand: 4, ...clean }, { signal }).then((d) => ({
        total: d.meta?.total ?? d.brands?.length ?? 0,
        brands: (d.brands || []).map((b) => ({ ...b, products: normalizeList(b.products) })),
      })),
  });
}

export function useBrand(id, params = {}) {
  const clean = cleanParams(params);
  return useInfiniteQuery({
    queryKey: ['brand', id, clean],
    enabled: Boolean(id),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      asShopper(() => api.get(`brands/${id}`, { ...clean, offset: pageParam, limit: PAGE }, { signal })).then((d) => ({
        brand: d.brand,
        items: normalizeList(d.products),
        total: d.total ?? 0,
        hasMore: Boolean(d.hasMore),
        next: pageParam + (d.products?.length ?? 0),
      })),
    getNextPageParam: (last) => (last.hasMore ? last.next : undefined),
  });
}

// ---------------------------------------------------------------- quiz & DNA

export function useDeck(genderAudience) {
  return useQuery({
    queryKey: ['deck', genderAudience || 'any'],
    staleTime: Infinity,
    gcTime: 0,
    queryFn: ({ signal }) => asShopper(() => api.get('swipe/deck', cleanParams({ limit: 24, genderAudience }), { signal })),
  });
}

export function useSwipeMutations() {
  const qc = useQueryClient();
  const sid = sessionId();
  const swipe = useMutation({
    mutationFn: ({ productId, verdict, imageIndex }) => api.post('swipe', { productId, verdict, imageIndex, sessionId: sid, source: 'quiz' }),
  });
  const undo = useMutation({ mutationFn: () => api.post('swipe/undo') });
  const finalize = useMutation({
    mutationFn: () => api.post('swipe/finalize'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dna'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
  return { swipe, undo, finalize };
}

export function useDna({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['dna'],
    enabled,
    queryFn: ({ signal }) =>
      asShopper(() => api.get('dna', null, { signal })).then((d) => ({ ...d, evidence: normalizeList(d.evidence) })),
  });
}

// ---------------------------------------------------------------- shopper

export function useMe() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['me'],
    enabled: isSignedIn,
    queryFn: ({ signal }) =>
      api.get('me', null, { signal }).then((d) => {
        if (d?.shopperGender === 'Women' || d?.shopperGender === 'Men') setShopFor(d.shopperGender);
        return d;
      }),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) => api.patch('me', patch),
    onSuccess: (data, patch) => {
      if ('shopperGender' in patch) setShopFor(patch.shopperGender);
      qc.setQueryData(['me'], data);
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useSaves() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['saves'],
    enabled: isSignedIn,
    queryFn: ({ signal }) => api.get('saves', null, { signal }).then((d) => normalizeList(d.products)),
  });
}

function patchSaved(qc, productId, isSaved) {
  const patchItem = (p) => (p && p.id === productId ? { ...p, isSaved } : p);
  qc.setQueriesData({ queryKey: ['product', productId] }, (old) => (old ? { ...old, isSaved } : old));
  for (const key of ['feed', 'search', 'brand']) {
    qc.setQueriesData({ queryKey: [key] }, (old) =>
      old?.pages ? { ...old, pages: old.pages.map((pg) => ({ ...pg, items: pg.items.map(patchItem) })) } : old,
    );
  }
  qc.setQueriesData({ queryKey: ['similar'] }, (old) => (Array.isArray(old) ? old.map(patchItem) : old));
}

export function useToggleSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, save, source }) => (save ? api.post('saves', { productId, source }) : api.del(`saves/${productId}`)),
    onMutate: ({ productId, save }) => {
      feedback(save ? 'save' : 'tap');
      patchSaved(qc, productId, save);
      if (!save) qc.setQueryData(['saves'], (old) => (Array.isArray(old) ? old.filter((p) => p.id !== productId) : old));
    },
    onError: (_e, { productId, save }) => patchSaved(qc, productId, !save),
    onSuccess: (_d, { save }) => {
      if (save) track(EVENTS.SAVE);
      qc.invalidateQueries({ queryKey: ['saves'] });
    },
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ brandId, follow }) => (follow ? api.post(`brands/${brandId}/follow`) : api.del(`brands/${brandId}/follow`)),
    onSuccess: (_d, { follow }) => {
      if (follow) track(EVENTS.BRAND_FOLLOW);
      qc.invalidateQueries({ queryKey: ['brands'] });
      qc.invalidateQueries({ queryKey: ['brand'] });
    },
  });
}

/** Records the click-out, then sends the shopper to the brand's store in a new tab. */
export async function clickOut(product, surface) {
  haptic('tap');
  const win = window.open('about:blank', '_blank');
  try {
    const d = await api.post('clickout', { productId: product.id, surface, fitMatch: product.fitMatch ?? undefined, sessionId: sessionId() });
    track(EVENTS.CLICK_OUT);
    if (win) {
      win.opener = null;
      win.location.href = d.url;
    } else {
      window.location.href = d.url;
    }
  } catch (e) {
    win?.close();
    throw e;
  }
}

export const shopperApi = {
  exportData: () => api.get('me/export'),
  deleteAccount: (password) => api.del('me', { password }),
  contact: (payload) => api.post('contact', payload),
};
