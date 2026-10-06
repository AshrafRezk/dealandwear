import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useSaves } from '../data/queries';
import { usePageTitle } from '../lib/usePageTitle';
import { ProductGrid } from '../ui/ProductCard';
import { Button, EmptyState } from '../ui/primitives';

export default function Saved() {
  const { t } = useTranslation();
  usePageTitle(t('saved.title'));
  const { isSignedIn } = useAuth();
  const saves = useSaves();

  if (!isSignedIn) {
    return (
      <EmptyState
        icon="heart"
        headingLevel={1}
        title={t('saved.guestTitle')}
        body={t('saved.guestBody')}
        action={
          <>
            <Button to="/login" state={{ from: '/saved' }}>
              {t('auth.signIn')}
            </Button>
            <Button to="/signup" variant="secondary">
              {t('auth.createAccount')}
            </Button>
          </>
        }
      />
    );
  }

  const items = saves.data ?? [];

  return (
    <section className="page section">
      <p className="eyebrow">{t('saved.eyebrow')}</p>
      <h1 className="section-title">{t('saved.title')}</h1>
      {saves.data ? <p className="muted">{t('saved.count', { count: items.length })}</p> : null}
      <div style={{ marginBlockStart: 'var(--space-5)' }}>
        {saves.isError ? (
          <EmptyState
            icon="info"
            title={t('errors.loadTitle')}
            body={t('errors.loadBody')}
            action={<Button onClick={() => saves.refetch()}>{t('common.retry')}</Button>}
          />
        ) : saves.data && items.length === 0 ? (
          <EmptyState
            icon="heart"
            title={t('saved.emptyTitle')}
            body={t('saved.emptyBody')}
            action={<Button to="/">{t('saved.discover')}</Button>}
          />
        ) : (
          <ProductGrid products={items} loading={saves.isPending} surface="Saved" />
        )}
      </div>
    </section>
  );
}
