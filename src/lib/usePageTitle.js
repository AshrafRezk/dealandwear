import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Sets document.title to "<title> · Find Your Fit" (or the default title when none is given). */
export function usePageTitle(title) {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = title ? `${title} · ${t('brand.name')}` : t('brand.defaultTitle');
  }, [title, t]);
}
