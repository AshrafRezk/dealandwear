import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../lib/usePageTitle';
import { Button } from '../../ui/primitives';
import styles from './Info.module.css';

const PILLARS = ['curated', 'personal', 'local', 'honest'];

export default function About() {
  const { t } = useTranslation();
  usePageTitle(t('about.title'));
  return (
    <article className={`page ${styles.page}`}>
      <p className="eyebrow">{t('about.eyebrow')}</p>
      <h1 className={styles.title}>
        {t('about.headlineLead')} <em>{t('about.headlineAccent')}</em>
      </h1>
      <p className={styles.lead}>{t('about.lead')}</p>
      <ul className={styles.pillars}>
        {PILLARS.map((k) => (
          <li key={k}>
            <strong>{t(`about.pillar.${k}.title`)}</strong>
            <span>{t(`about.pillar.${k}.body`)}</span>
          </li>
        ))}
      </ul>
      <section className={styles.section}>
        <h2>{t('about.howTitle')}</h2>
        <p>{t('about.howBody1')}</p>
        <p>{t('about.howBody2')}</p>
      </section>
      <section className={styles.section}>
        <h2>{t('about.brandsTitle')}</h2>
        <p>{t('about.brandsBody')}</p>
      </section>
      <div className={styles.actions}>
        <Button to="/quiz" size="lg" iconEnd="arrowRight">
          {t('home.ctaQuiz')}
        </Button>
        <Button to="/contact" size="lg" variant="secondary">
          {t('about.listBrand')}
        </Button>
      </div>
    </article>
  );
}
