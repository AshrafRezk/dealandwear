import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { readConsent, saveConsent } from '../lib/consent';
import { EVENTS, track } from '../lib/analytics';
import { Button } from '../ui/primitives';
import styles from './Banners.module.css';

/** Analytics only start after an explicit choice; essential storage (sign-in, guest quiz) needs no consent. */
export default function ConsentBanner() {
  const { t } = useTranslation();
  const [decided, setDecided] = useState(() => readConsent() !== null);

  if (decided) return null;

  const choose = (analytics) => {
    saveConsent(analytics);
    setDecided(true);
    if (analytics) track(EVENTS.APP_OPEN);
  };

  return (
    <section className={styles.consent} aria-label={t('consent.label')}>
      <p className={styles.consentText}>
        {t('consent.body')}{' '}
        <Link to="/privacy" className={styles.inlineLink}>
          {t('consent.learnMore')}
        </Link>
      </p>
      <div className={styles.actions}>
        <Button size="sm" variant="secondary" onClick={() => choose(false)}>
          {t('consent.essentialOnly')}
        </Button>
        <Button size="sm" onClick={() => choose(true)}>
          {t('consent.accept')}
        </Button>
      </div>
    </section>
  );
}
