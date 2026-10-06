import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBrands } from '../data/queries';
import { usePageTitle } from '../lib/usePageTitle';
import { Button, Chip, EmptyState, Skeleton } from '../ui/primitives';
import styles from './Brands.module.css';

export default function Brands() {
  const { t } = useTranslation();
  usePageTitle(t('brands.title'));
  const [q, setQ] = useState('');
  const [origin, setOrigin] = useState('');
  const deferredQ = useDeferredValue(q.trim());
  const brands = useBrands({ q: deferredQ.length >= 2 ? deferredQ : undefined, origin: origin || undefined });
  const list = brands.data?.brands ?? [];

  return (
    <section className="page section">
      <p className="eyebrow">{t('brands.eyebrow')}</p>
      <h1 className="section-title">{t('brands.title')}</h1>
      <p className={`muted ${styles.lead}`}>{t('brands.lead')}</p>

      <div className={styles.tools}>
        <label className={styles.search}>
          <span className="visually-hidden">{t('brands.searchLabel')}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('brands.searchPlaceholder')} />
        </label>
        <div className={styles.chips}>
          <Chip selected={!origin} onClick={() => setOrigin('')}>
            {t('brands.all')}
          </Chip>
          <Chip selected={origin === 'Local_Maker'} onClick={() => setOrigin('Local_Maker')}>
            {t('origin.Local_Maker')}
          </Chip>
          <Chip selected={origin === 'Global_House'} onClick={() => setOrigin('Global_House')}>
            {t('origin.Global_House')}
          </Chip>
        </div>
      </div>

      {brands.isError ? (
        <EmptyState
          icon="info"
          title={t('errors.loadTitle')}
          body={t('errors.loadBody')}
          action={<Button onClick={() => brands.refetch()}>{t('common.retry')}</Button>}
        />
      ) : brands.isPending ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} height={260} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon="store" title={t('brands.emptyTitle')} body={t('brands.emptyBody')} />
      ) : (
        <ul className={styles.grid}>
          {list.map((b) => (
            <li key={b.accountId}>
              <BrandCard brand={b} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BrandCard({ brand }) {
  const { t } = useTranslation();
  const tiles = brand.products.filter((p) => p.image).slice(0, 4);
  return (
    <Link to={`/brands/${brand.accountId}`} className={styles.card}>
      <div className={styles.tiles} aria-hidden="true">
        {tiles.length ? tiles.map((p) => <img key={p.id} src={p.image} alt="" loading="lazy" />) : <span className={styles.tileEmpty} />}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardHead}>
          {brand.logoUrl ? <img src={brand.logoUrl} alt="" className={styles.logo} loading="lazy" /> : null}
          <div>
            <h2 className={styles.name}>{brand.name}</h2>
            {brand.brandOrigin ? <p className={styles.origin}>{t(`origin.${brand.brandOrigin}`)}</p> : null}
          </div>
        </div>
        {brand.tagline ? <p className={styles.tagline}>{brand.tagline}</p> : null}
        <p className={styles.meta}>
          {t('brands.pieces', { count: brand.productCount ?? 0 })}
          {brand.isFollowed ? <span className={styles.following}> · {t('brands.following')}</span> : null}
        </p>
      </div>
    </Link>
  );
}
