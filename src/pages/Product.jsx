import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { clickOut, useProduct, useSimilar, useToggleSave } from '../data/queries';
import { EVENTS, track } from '../lib/analytics';
import { formatPrice } from '../lib/products';
import { usePageTitle } from '../lib/usePageTitle';
import Icon from '../ui/Icon';
import { ProductGrid } from '../ui/ProductCard';
import { Accordion, Button, EmptyState, Skeleton, Tag } from '../ui/primitives';
import { useToast } from '../ui/Toast';
import styles from './Product.module.css';

export default function Product() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isSignedIn } = useAuth();
  const toast = useToast();
  const product = useProduct(id);
  const similar = useSimilar(id);
  const toggle = useToggleSave();
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const tracked = useRef(null);

  const p = product.data || location.state?.product || null;
  usePageTitle(p?.name);

  useEffect(() => {
    setActive(0);
  }, [id]);

  useEffect(() => {
    if (product.isSuccess && tracked.current !== id) {
      tracked.current = id;
      track(EVENTS.PDP_VIEW);
    }
  }, [product.isSuccess, id]);

  if (product.isError && !p) {
    const notFound = product.error?.status === 404;
    return (
      <EmptyState
        icon={notFound ? 'search' : 'info'}
        title={notFound ? t('product.notFoundTitle') : t('errors.loadTitle')}
        body={notFound ? t('product.notFoundBody') : t('errors.loadBody')}
        action={
          notFound ? (
            <Button to="/search">{t('product.keepBrowsing')}</Button>
          ) : (
            <Button onClick={() => product.refetch()}>{t('common.retry')}</Button>
          )
        }
      />
    );
  }

  if (!p) return <ProductSkeleton />;

  const surface = location.state?.surface || 'Product';

  const onSave = () => {
    if (!isSignedIn) {
      toast.show(t('saved.signInToSave'), { action: { label: t('auth.signIn'), onClick: () => navigate('/login', { state: { from: location.pathname } }) } });
      return;
    }
    const save = !p.isSaved;
    toggle.mutate(
      { productId: p.id, save, source: 'Product' },
      {
        onSuccess: () => toast.show(save ? t('saved.added') : t('saved.removed'), { tone: save ? 'success' : 'default' }),
        onError: () => toast.show(t('errors.generic'), { tone: 'error' }),
      },
    );
  };

  const onShop = async () => {
    setLeaving(true);
    try {
      await clickOut(p, surface);
    } catch {
      toast.show(t('product.storeUnavailable'), { tone: 'error' });
    } finally {
      setLeaving(false);
    }
  };

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, text: t('product.shareText', { name: p.name, brand: p.brandName }), url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.show(t('product.linkCopied'), { tone: 'success' });
      }
      track(EVENTS.SHARE_PRODUCT);
    } catch (e) {
      if (e?.name !== 'AbortError') toast.show(t('errors.generic'), { tone: 'error' });
    }
  };

  const images = p.images?.length ? p.images : [];
  const details = [
    p.category && [t('product.detail.category'), t(`category.${p.category}`, { defaultValue: p.category })],
    p.fit && [t('product.detail.fit'), t(`fit.${p.fit}`, { defaultValue: p.fit })],
    p.color && [t('product.detail.color'), p.color],
    p.material && [t('product.detail.material'), p.material],
    p.garmentType && [t('product.detail.type'), p.garmentType],
  ].filter(Boolean);

  return (
    <>
      <nav className={`page ${styles.crumbs}`} aria-label={t('product.breadcrumb')}>
        <Link to="/search">{t('nav.search')}</Link>
        {p.brandId ? (
          <>
            <Icon name="chevronRight" size={14} />
            <Link to={`/brands/${p.brandId}`}>{p.brandName}</Link>
          </>
        ) : null}
      </nav>

      <article className={`page ${styles.layout}`}>
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {images[active] ? <img src={images[active]} alt={p.name} fetchPriority="high" /> : <span className={styles.noImage} />}
            {p.discountPercent ? (
              <Tag tone="sale" className={styles.sale}>
                −{p.discountPercent}%
              </Tag>
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className={styles.thumbs} role="tablist" aria-label={t('product.gallery')}>
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={t('product.imageN', { n: i + 1, total: images.length })}
                  className={`${styles.thumb} ${i === active ? styles.thumbActive : ''}`}
                  onClick={() => setActive(i)}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.info}>
          {p.brandId ? (
            <Link to={`/brands/${p.brandId}`} className={styles.brand}>
              {p.brandName}
            </Link>
          ) : (
            <p className={styles.brand}>{p.brandName}</p>
          )}
          <h1 className={styles.name} dir="auto">{p.name}</h1>
          <p className={styles.price}>
            <span>{formatPrice(p.price, i18n.language)}</span>
            {p.compareAtPrice ? <s className={styles.compare}>{formatPrice(p.compareAtPrice, i18n.language)}</s> : null}
          </p>
          {p.brandOrigin ? <p className={styles.origin}>{t(`origin.${p.brandOrigin}`)}</p> : null}

          <FitBox product={p} />

          {p.sizes?.length ? (
            <div className={styles.sizes}>
              <p className={styles.sizesTitle}>{t('product.sizesListed')}</p>
              <ul>
                {p.sizes.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="muted">{t('product.sizesNote')}</p>
            </div>
          ) : null}

          <div className={styles.actions}>
            {p.hasListing && p.available ? (
              <Button size="lg" block iconEnd="external" onClick={onShop} loading={leaving}>
                {t('product.shopAt', { brand: p.brandName || t('product.theStore') })}
              </Button>
            ) : (
              <p className={styles.unavailable}>{p.available ? t('product.noListing') : t('product.unavailable')}</p>
            )}
            <div className={styles.secondaryActions}>
              <Button variant="secondary" icon="heart" onClick={onSave} aria-pressed={p.isSaved} className={p.isSaved ? styles.savedBtn : undefined}>
                {p.isSaved ? t('product.saved') : t('product.save')}
              </Button>
              <Button variant="secondary" icon="share" onClick={onShare}>
                {t('product.share')}
              </Button>
            </div>
            <p className={styles.disclosure}>{t('product.disclosure', { brand: p.brandName || t('product.theStore') })}</p>
          </div>

          <Accordion
            items={[
              { id: 'desc', title: t('product.description'), content: p.description ? <p className={styles.desc}>{p.description}</p> : null, open: true },
              {
                id: 'details',
                title: t('product.details'),
                content: details.length ? (
                  <dl className={styles.details}>
                    {details.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null,
              },
              { id: 'shipping', title: t('product.deliveryTitle'), content: <p className={styles.desc}>{t('product.deliveryBody', { brand: p.brandName || t('product.theStore') })}</p> },
            ]}
          />
        </div>
      </article>

      {similar.data?.length || similar.isPending ? (
        <section className="page section" aria-labelledby="similar-title">
          <h2 id="similar-title" className="section-title">
            {t('product.similar')}
          </h2>
          <div className={styles.similar}>
            <ProductGrid products={similar.data || []} loading={similar.isPending} surface="Product" skeletons={4} />
          </div>
        </section>
      ) : null}
    </>
  );
}

function FitBox({ product }) {
  const { t } = useTranslation();
  if (!Number.isFinite(product.fitMatch)) {
    return (
      <div className={styles.fitBox}>
        <p className={styles.fitTitle}>{t('product.fitUnknownTitle')}</p>
        <p className="muted">{t('product.fitUnknownBody')}</p>
        <Button to="/quiz" variant="link">
          {t('home.ctaQuiz')}
        </Button>
      </div>
    );
  }
  return (
    <div className={styles.fitBox}>
      <p className={styles.fitScore}>
        <span className={styles.fitValue}>{product.fitMatch}%</span>
        <span>{t('product.fitMatchLabel')}</span>
      </p>
      {product.matchReasons?.length ? (
        <ul className={styles.reasons}>
          {product.matchReasons.slice(0, 3).map((r) => (
            <li key={r}>
              <Icon name="check" size={14} /> {r}
            </li>
          ))}
        </ul>
      ) : null}
      <Link to="/dna" className={styles.fitLink}>
        {t('product.howCalculated')}
      </Link>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className={`page ${styles.layout}`} aria-hidden="true">
      <Skeleton height="auto" style={{ aspectRatio: '3 / 4', inlineSize: '100%' }} />
      <div className={styles.info}>
        <Skeleton width="30%" height={12} />
        <Skeleton width="80%" height={32} />
        <Skeleton width="25%" height={20} />
        <Skeleton width="100%" height={96} />
        <Skeleton width="100%" height={52} />
      </div>
    </div>
  );
}
