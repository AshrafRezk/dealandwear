import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../lib/usePageTitle';
import { Button, EmptyState } from '../../ui/primitives';

export default function NotFound() {
  const { t } = useTranslation();
  usePageTitle(t('notFound.title'));
  return (
    <EmptyState
      icon="search"
      headingLevel={1}
      title={t('notFound.title')}
      body={t('notFound.body')}
      action={
        <>
          <Button to="/">{t('errors.goHome')}</Button>
          <Button to="/search" variant="secondary">
            {t('nav.search')}
          </Button>
        </>
      }
    />
  );
}
