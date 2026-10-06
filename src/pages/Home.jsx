import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFeed } from '../data/queries';
import { EVENTS, track } from '../lib/analytics';
import { CATEGORIES } from '../lib/products';
import { ProductGrid } from '../ui/ProductCard';
import { Button, EmptyState } from '../ui/primitives';
import { usePageTitle } from '../lib/usePageTitle';
import styles from './Home.module.css';

const QUICK_CATEGORIES = ['Dresses', 'Shirts', 'Trousers', 'Knitwear', 'Outerwear', 'Modest_Wear', 'Shoes', 'Bags'].filter((c) =>
  CATEGORIES.includes(c),
);

export default function Home() {
  const { t } = useTranslation();
  usePageTitle();
  const feed = useFeed();
  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];
  const personalised = Boolean(feed.data?.pages[0]?.personalised);
  const tracked = useRef(false);

  useEffect(() => {
    if (feed.isSuccess && !tracked.current) {
      tracked.current = true;
      track(EVENTS.FEED_VIEW);
    }
  }, [feed.isSuccess]);

  return (
    <>
      <section className={styles.hero}>
        <div className={`page ${styles.heroInner}`}>
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1 className={styles.heroTitle}>
            {t('home.titleLead')} <em>{t('home.titleAccent')}</em>
          </h1>
          <p className={styles.heroBody}>{personalised ? t('home.bodyPersonalised') : t('home.body')}</p>
          <div className={styles.heroActions}>
            {personalised ? (
              <>
                <Button to="/dna" size="lg">
                  {t('home.ctaDna')}
                </Button>
                <Button to="/quiz" size="lg" variant="secondary">
                  {t('home.ctaRefine')}
                </Button>
              </>
            ) : (
              <>
                <Button to="/quiz" size="lg" iconEnd="arrowRight">
                  {t('home.ctaQuiz')}
                </Button>
                <Button to="/search" size="lg" variant="secondary">
                  {t('home.ctaBrowse')}
                </Button>
              </>
            )}
          </div>
          <ul className={styles.steps} aria-label={t('home.howLabel')}>
            {['one', 'two', 'three'].map((k, i) => (
              <li key={k}>
                <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                <span>{t(`home.step.${k}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <nav className={`page ${styles.chips}`} aria-label={t('home.categoriesLabel')}>
        {QUICK_CATEGORIES.map((c) => (
          <Link key={c} to={`/search?category=${c}`} className={styles.chip}>
            {t(`category.${c}`)}
          </Link>
        ))}
        <Link to="/search?onSale=true" className={`${styles.chip} ${styles.chipAccent}`}>
          {t('home.onSale')}
        </Link>
      </nav>

      <section className="page section" aria-labelledby="feed-title">
        <div className={styles.sectionHead}>
          <div>
            <p className="eyebrow">{personalised ? t('home.feedEyebrowPersonal') : t('home.feedEyebrow')}</p>
            <h2 id="feed-title" className="section-title">
              {personalised ? t('home.feedTitlePersonal') : t('home.feedTitle')}
            </h2>
          </div>
          <Link to="/search" className={styles.seeAll}>
            {t('common.seeAll')}
          </Link>
        </div>

        {feed.isError ? (
          <EmptyState
            icon="info"
            title={t('errors.loadTitle')}
            body={t('errors.loadBody')}
            action={<Button onClick={() => feed.refetch()}>{t('common.retry')}</Button>}
          />
        ) : (
          <>
            <ProductGrid products={items} loading={feed.isPending} surface="Feed" skeletons={8} />
            {feed.hasNextPage ? (
              <div className={styles.more}>
                <Button variant="secondary" loading={feed.isFetchingNextPage} onClick={() => feed.fetchNextPage()}>
                  {t('common.loadMore')}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="page section">
        <div className={styles.banner}>
          <div>
            <p className={`eyebrow ${styles.bannerEyebrow}`}>{t('home.makersEyebrow')}</p>
            <h2 className={styles.bannerTitle}>{t('home.makersTitle')}</h2>
            <p className={styles.bannerBody}>{t('home.makersBody')}</p>
          </div>
          <div className={styles.bannerActions}>
            <Button to="/search?origin=Local_Maker" variant="inverse">
              {t('home.makersCta')}
            </Button>
            <Button to="/brands" variant="link" className={styles.bannerLink}>
              {t('home.allBrands')}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
