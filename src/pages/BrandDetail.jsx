import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useBrand, useToggleFollow } from '../data/queries';
import { EVENTS, track } from '../lib/analytics';
import { CATEGORIES, SORTS } from '../lib/products';
import { usePageTitle } from '../lib/usePageTitle';
import Icon from '../ui/Icon';
import { ProductGrid } from '../ui/ProductCard';
import { Button, EmptyState, Skeleton } from '../ui/primitives';
import { useToast } from '../ui/Toast';
import styles from './BrandDetail.module.css';

function safeUrl(u) {
  if (!u) return null;
  const withScheme = /^https?:\/\//i.test(u) ? u : `https://${u}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export default function BrandDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const query = useBrand(id, { category: category || undefined, sort: sort || undefined });
  const follow = useToggleFollow();
  const pages = query.data?.pages ?? [];
  const brand = pages[0]?.brand;
  const items = pages.flatMap((p) => p.items);
  const tracked = useRef(null);
  usePageTitle(brand?.name);

  useEffect(() => {
    if (brand && tracked.current !== id) {
      tracked.current = id;
      track(EVENTS.BRAND_VIEW);
    }
  }, [brand, id]);

  if (query.isError && !brand) {
    const notFound = query.error?.status === 404;
    return (
      <EmptyState
        icon="store"
        title={notFound ? t('brands.notFoundTitle') : t('errors.loadTitle')}
        body={notFound ? t('brands.notFoundBody') : t('errors.loadBody')}
        action={notFound ? <Button to="/brands">{t('brands.allBrands')}</Button> : <Button onClick={() => query.refetch()}>{t('common.retry')}</Button>}
      />
    );
  }

  const onFollow = () => {
    if (!isSignedIn) {
      toast.show(t('brands.signInToFollow'), { action: { label: t('auth.signIn'), onClick: () => navigate('/login', { state: { from: location.pathname } }) } });
      return;
    }
    const next = !brand.isFollowed;
    follow.mutate(
      { brandId: brand.accountId, follow: next },
      {
        onSuccess: () => toast.show(next ? t('brands.followed', { name: brand.name }) : t('brands.unfollowed', { name: brand.name }), { tone: next ? 'success' : 'default' }),
        onError: () => toast.show(t('errors.generic'), { tone: 'error' }),
      },
    );
  };

  const website = safeUrl(brand?.website);
  const instagram = safeUrl(brand?.instagramUrl);
  const tiktok = safeUrl(brand?.tiktokUrl);
  const place = [brand?.city, brand?.governorate].filter(Boolean).join(', ');

  return (
    <>
      <header className={styles.header}>
        <div className={`page ${styles.headerInner}`}>
          {brand ? (
            <>
              <div className={styles.identity}>
                {brand.logoUrl ? <img src={brand.logoUrl} alt="" className={styles.logo} /> : null}
                <div>
                  <p className="eyebrow">{brand.brandOrigin ? t(`origin.${brand.brandOrigin}`) : t('brands.eyebrow')}</p>
                  <h1 className={styles.name}>{brand.name}</h1>
                  <p className={styles.meta}>
                    {t('brands.pieces', { count: brand.productCount ?? 0 })}
                    {place ? ` · ${place}` : ''}
                  </p>
                </div>
              </div>
              {brand.about ? <p className={styles.about}>{brand.about}</p> : null}
              {brand.tags?.length ? (
                <ul className={styles.tags}>
                  {brand.tags.slice(0, 6).map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              ) : null}
              <div className={styles.actions}>
                <Button
                  variant={brand.isFollowed ? 'secondary' : 'primary'}
                  icon={brand.isFollowed ? 'check' : 'plus'}
                  onClick={onFollow}
                  loading={follow.isPending}
                  aria-pressed={brand.isFollowed}
                >
                  {brand.isFollowed ? t('brands.followingBtn') : t('brands.follow')}
                </Button>
                {website ? (
                  <a href={website} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    <Icon name="globe" size={16} /> {t('brands.website')}
                  </a>
                ) : null}
                {instagram ? (
                  <a href={instagram} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    Instagram
                  </a>
                ) : null}
                {tiktok ? (
                  <a href={tiktok} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    TikTok
                  </a>
                ) : null}
              </div>
            </>
          ) : (
            <div className={styles.identity} aria-hidden="true">
              <Skeleton width={64} height={64} />
              <div style={{ display: 'grid', gap: 8 }}>
                <Skeleton width={120} height={12} />
                <Skeleton width={240} height={36} />
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="page section" aria-label={t('brands.collection')}>
        <div className={styles.filters}>
          <label>
            <span className="visually-hidden">{t('search.group.category')}</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{t('brands.allCategories')}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`category.${c}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="visually-hidden">{t('search.sortLabel')}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => (
                <option key={s} value={s === 'relevance' ? '' : s}>
                  {t(`sort.${s}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {query.data && items.length === 0 ? (
          <EmptyState icon="search" title={t('brands.noPiecesTitle')} body={t('brands.noPiecesBody')} />
        ) : (
          <ProductGrid products={items} loading={query.isPending || query.isFetchingNextPage} surface="Brand" />
        )}
        {query.hasNextPage ? (
          <div className={styles.more}>
            <Button variant="secondary" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
              {t('common.loadMore')}
            </Button>
          </div>
        ) : null}
      </section>
    </>
  );
}
