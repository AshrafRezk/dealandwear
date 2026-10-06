import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { read, write } from '../lib/session';
import { EVENTS, track } from '../lib/analytics';
import { promptInstall, useInstall } from '../lib/install';
import { Button, IconButton } from '../ui/primitives';
import Icon from '../ui/Icon';
import styles from './Banners.module.css';

const SNOOZE_DAYS = 14;

function snoozed() {
  const at = Number(read('installDismissed'));
  return Number.isFinite(at) && at > 0 && Date.now() - at < SNOOZE_DAYS * 86_400_000;
}

/**
 * "Get the app" banner once the shopper has made a consent choice.
 * Chrome/Edge/Android get the native dialog; iOS Safari gets the Share → Add to Home Screen steps.
 */
export default function InstallPrompt() {
  const { t } = useTranslation();
  const { canPrompt, ios, installed } = useInstall();
  const [hidden, setHidden] = useState(() => snoozed());
  const visible = !hidden && !installed && Boolean(read('consent')) && (canPrompt || ios);

  useEffect(() => {
    if (visible) track(EVENTS.INSTALL_PROMPT);
  }, [visible]);

  if (!visible) return null;

  const dismiss = () => {
    write('installDismissed', Date.now());
    setHidden(true);
  };

  const install = async () => {
    const outcome = await promptInstall();
    if (outcome !== 'accepted') dismiss();
  };

  return (
    <section className={styles.install} aria-label={t('install.label')}>
      <img className={styles.installIcon} src="/icons/icon-192x192.png" alt="" width="40" height="40" />
      <p className={styles.installText}>
        {ios ? (
          <>
            {t('install.iosLead')} <Icon name="share" size={16} /> {t('install.iosTail')}
          </>
        ) : (
          t('install.body')
        )}
      </p>
      {!ios && (
        <Button size="sm" variant="accent" onClick={install}>
          {t('install.cta')}
        </Button>
      )}
      <IconButton icon="close" label={t('common.dismiss')} onClick={dismiss} />
    </section>
  );
}
