import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useToggleSave } from '../data/queries';
import { formatPrice } from '../lib/products';
import Icon from './Icon';
import { FitBadge, Skeleton, Tag } from './primitives';
import { useToast } from './Toast';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, surface = 'Feed', priority = false }) {
  const { t, i18n } = useTranslation();
  const { isSignedIn } = useAuth();
  const toggle = useToggleSave();
  const toast = useToast();
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);

  const onSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      toast.show(t('saved.signInToSave'), { action: { label: t('auth.signIn'), onClick: () => navigate('/login', { state: { from: window.location.pathname } }) } });
      return;
    }
    const save = !product.isSaved;
    toggle.mutate(
      { productId: product.id, save, source: surface },
      {
        onSuccess: () => toast.show(save ? t('saved.added') : t('saved.removed'), { tone: save ? 'success' : 'default' }),
        onError: () => toast.show(t('errors.generic'), { tone: 'error' }),
      },
    );
  };

  return (
    <article className={styles.card}>
      <Link to={`/p/${product.id}`} state={{ product, surface }} className={styles.link}>
        <div className={styles.media}>
          {product.image && !imgFailed ? (
            <img
              src={product.image}
              alt={product.name}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : undefined}
              decoding="async"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className={styles.placeholder} aria-hidden="true" />
          )}
          {product.discountPercent ? (
            <Tag tone="sale" className={styles.sale}>
              −{product.discountPercent}%
            </Tag>
          ) : null}
        </div>
        <div className={styles.body}>
          <p className={styles.brand}>{product.brandName}</p>
          <h3 className={styles.name} dir="auto">{product.name}</h3>
          <p className={styles.price}>
            <span>{formatPrice(product.price, i18n.language)}</span>
            {product.compareAtPrice ? (
              <s className={styles.compare} aria-label={t('product.wasPrice', { price: formatPrice(product.compareAtPrice, i18n.language) })}>
                {formatPrice(product.compareAtPrice, i18n.language)}
              </s>
            ) : null}
          </p>
          <FitBadge value={product.fitMatch} />
        </div>
      </Link>
      <button
        type="button"
        className={`${styles.save} ${product.isSaved ? styles.saved : ''}`}
        onClick={onSave}
        aria-pressed={product.isSaved}
        aria-label={product.isSaved ? t('saved.removeLabel', { name: product.name }) : t('saved.addLabel', { name: product.name })}
      >
        <Icon name="heart" size={18} />
      </button>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <Skeleton className={styles.media} height="auto" style={{ aspectRatio: '3 / 4' }} />
      <div className={styles.body}>
        <Skeleton width="40%" height={10} />
        <Skeleton width="85%" height={16} style={{ marginBlock: 8 }} />
        <Skeleton width="30%" height={12} />
      </div>
    </div>
  );
}

export function ProductGrid({ products, loading, surface, skeletons = 8 }) {
  return (
    <div className="product-grid">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} surface={surface} priority={i < 4} />
      ))}
      {loading ? Array.from({ length: skeletons }, (_, i) => <ProductCardSkeleton key={`s${i}`} />) : null}
    </div>
  );
}
