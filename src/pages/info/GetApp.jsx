import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../lib/usePageTitle';
import AppSettings from '../../ui/AppSettings';
import styles from './Info.module.css';

export default function GetApp() {
  const { t } = useTranslation();
  usePageTitle(t('getApp.title'));
  return (
    <article className={`page ${styles.page}`}>
      <p className="eyebrow">{t('getApp.eyebrow')}</p>
      <h1 className={styles.title}>{t('getApp.title')}</h1>
      <p className={styles.lead}>{t('getApp.lead')}</p>
      <AppSettings />
    </article>
  );
}
