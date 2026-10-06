import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSearch } from '../data/queries';
import { EVENTS, track } from '../lib/analytics';
import { CATEGORIES, FITS, PRICE_BANDS, SORTS } from '../lib/products';
import { usePageTitle } from '../lib/usePageTitle';
import Icon from '../ui/Icon';
import { ProductGrid } from '../ui/ProductCard';
import { Button, Chip, EmptyState, Field, Sheet } from '../ui/primitives';
import styles from './Search.module.css';

const FILTER_KEYS = ['category', 'fit', 'gender', 'origin', 'onSale', 'price'];
const SUGGESTIONS = ['linen shirt', 'black dress', 'wide leg trousers', 'modest abaya', 'white sneakers', 'oversized hoodie'];

function bandParams(key) {
  const band = PRICE_BANDS.find((b) => b.key === key);
  return band ? { minPrice: band.min ?? undefined, maxPrice: band.max ?? undefined } : {};
}

export default function Search() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [draft, setDraft] = useState(q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  usePageTitle(q ? t('search.titleFor', { q }) : t('search.title'));

  const [draftFor, setDraftFor] = useState(q);
  if (draftFor !== q) {
    setDraftFor(q);
    setDraft(q);
  }

  const query = useMemo(
    () => ({
      q: q || undefined,
      category: params.get('category') || undefined,
      fit: params.get('fit') || undefined,
      gender: params.get('gender') || undefined,
      origin: params.get('origin') || undefined,
      onSale: params.get('onSale') === 'true' || undefined,
      sort: params.get('sort') || undefined,
      ...bandParams(params.get('price')),
    }),
    [params, q],
  );

  const search = useSearch(query);
  const pages = search.data?.pages ?? [];
  const items = pages.flatMap((p) => p.items);
  const first = pages[0];
  const total = first?.total ?? 0;
  const intent = first?.intent;
  const activeCount = FILTER_KEYS.filter((k) => params.get(k)).length;

  const lastTracked = useRef('');
  useEffect(() => {
    if (!first || !q) return;
    const key = JSON.stringify(query);
    if (lastTracked.current === key) return;
    lastTracked.current = key;
    track(EVENTS.SEARCH);
    if (first.total === 0) track(EVENTS.SEARCH_ZERO);
  }, [first, q, query]);

  const sentinel = useRef(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = search;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const update = (patch, { isFilter = true } = {}) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined || v === '' || v === false) next.delete(k);
      else next.set(k, String(v));
    }
    setParams(next, { replace: !isFilter });
    if (isFilter) track(EVENTS.FILTER_APPLY);
  };

  const submit = (e) => {
    e.preventDefault();
    update({ q: draft.trim() || null }, { isFilter: false });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (params.get('sort')) next.set('sort', params.get('sort'));
    setParams(next);
  };

  return (
    <div className="page">
      <h1 className="visually-hidden">{q ? t('search.titleFor', { q }) : t('search.title')}</h1>
      <form role="search" className={styles.searchBar} onSubmit={submit}>
        <label htmlFor="search-q" className="visually-hidden">
          {t('search.label')}
        </label>
        <Icon name="search" size={20} className={styles.searchIcon} />
        <input
          id="search-q"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('search.placeholder')}
          maxLength={200}
          enterKeyHint="search"
          autoComplete="off"
        />
        {draft ? (
          <button type="button" className={styles.clear} onClick={() => setDraft('')} aria-label={t('search.clear')}>
            <Icon name="close" size={18} />
          </button>
        ) : null}
        <Button type="submit" size="sm">
          {t('search.submit')}
        </Button>
      </form>

      <div className={styles.toolbar}>
        <Button variant="secondary" size="sm" icon="filter" onClick={() => setFiltersOpen(true)}>
          {activeCount ? t('search.filtersCount', { count: activeCount }) : t('search.filters')}
        </Button>
        <div className={styles.quick}>
          <Chip selected={params.get('gender') === 'Women'} onClick={() => update({ gender: params.get('gender') === 'Women' ? null : 'Women' })}>
            {t('nav.women')}
          </Chip>
          <Chip selected={params.get('gender') === 'Men'} onClick={() => update({ gender: params.get('gender') === 'Men' ? null : 'Men' })}>
            {t('nav.men')}
          </Chip>
          <Chip selected={params.get('origin') === 'Local_Maker'} onClick={() => update({ origin: params.get('origin') === 'Local_Maker' ? null : 'Local_Maker' })}>
            {t('origin.Local_Maker')}
          </Chip>
          <Chip selected={params.get('onSale') === 'true'} onClick={() => update({ onSale: params.get('onSale') === 'true' ? null : 'true' })}>
            {t('search.onSale')}
          </Chip>
        </div>
        <label className={styles.sort}>
          <span className="visually-hidden">{t('search.sortLabel')}</span>
          <select value={params.get('sort') || 'relevance'} onChange={(e) => update({ sort: e.target.value === 'relevance' ? null : e.target.value })}>
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`sort.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.summary} aria-live="polite">
        {first ? (
          <p>
            {q ? t('search.resultsFor', { count: total, q }) : t('search.resultsAll', { count: total })}
            {first.personalised ? <span className={styles.personal}> · {t('search.rankedForYou')}</span> : null}
          </p>
        ) : null}
        {intent?.relaxed ? <p className="muted">{t('search.relaxed')}</p> : null}
        {intent?.expansions?.length ? <p className="muted">{t('search.alsoMatching', { terms: intent.expansions.slice(0, 4).join(', ') })}</p> : null}
      </div>

      {search.isError ? (
        <EmptyState
          icon="info"
          title={t('errors.loadTitle')}
          body={t('errors.loadBody')}
          action={<Button onClick={() => search.refetch()}>{t('common.retry')}</Button>}
        />
      ) : first && total === 0 ? (
        <EmptyState
          icon="search"
          title={q ? t('search.zeroTitle', { q }) : t('search.zeroFiltersTitle')}
          body={t('search.zeroBody')}
          action={
            <div className={styles.zeroActions}>
              {activeCount ? (
                <Button variant="secondary" onClick={clearFilters}>
                  {t('search.clearFilters')}
                </Button>
              ) : null}
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <Link key={s} to={`/search?q=${encodeURIComponent(s)}`} className={styles.suggestion}>
                    {s}
                  </Link>
                ))}
              </div>
              <Button to="/quiz" variant="link">
                {t('search.tryQuiz')}
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <ProductGrid products={items} loading={search.isPending || isFetchingNextPage} surface="Search" skeletons={search.isPending ? 8 : 4} />
          <div ref={sentinel} aria-hidden="true" />
          {hasNextPage && !isFetchingNextPage ? (
            <div className={styles.more}>
              <Button variant="secondary" onClick={() => fetchNextPage()}>
                {t('common.loadMore')}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <FilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} params={params} update={update} clear={clearFilters} total={total} />
    </div>
  );
}

function FilterSheet({ open, onClose, params, update, clear, total }) {
  const { t } = useTranslation();
  const toggle = (key, value) => update({ [key]: params.get(key) === value ? null : value });
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('search.filters')}
      footer={
        <>
          <Button variant="ghost" onClick={clear}>
            {t('search.clearFilters')}
          </Button>
          <Button onClick={onClose}>{t('search.showResults', { count: total })}</Button>
        </>
      }
    >
      <FilterGroup title={t('search.group.category')}>
        {CATEGORIES.map((c) => (
          <Chip key={c} selected={params.get('category') === c} onClick={() => toggle('category', c)}>
            {t(`category.${c}`)}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title={t('search.group.fit')}>
        {FITS.map((f) => (
          <Chip key={f} selected={params.get('fit') === f} onClick={() => toggle('fit', f)}>
            {t(`fit.${f}`)}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title={t('search.group.price')}>
        {PRICE_BANDS.map((b) => (
          <Chip key={b.key} selected={params.get('price') === b.key} onClick={() => toggle('price', b.key)}>
            {t(`price.${b.key}`)}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title={t('search.group.shopFor')}>
        {['Women', 'Men'].map((g) => (
          <Chip key={g} selected={params.get('gender') === g} onClick={() => toggle('gender', g)}>
            {t(g === 'Women' ? 'nav.women' : 'nav.men')}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title={t('search.group.origin')}>
        {['Local_Maker', 'Global_House'].map((o) => (
          <Chip key={o} selected={params.get('origin') === o} onClick={() => toggle('origin', o)}>
            {t(`origin.${o}`)}
          </Chip>
        ))}
      </FilterGroup>
      <Field as="select" label={t('search.sortLabel')} value={params.get('sort') || 'relevance'} onChange={(e) => update({ sort: e.target.value === 'relevance' ? null : e.target.value })}>
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {t(`sort.${s}`)}
          </option>
        ))}
      </Field>
    </Sheet>
  );
}

function FilterGroup({ title, children }) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupTitle}>{title}</legend>
      <div className={styles.groupChips}>{children}</div>
    </fieldset>
  );
}
