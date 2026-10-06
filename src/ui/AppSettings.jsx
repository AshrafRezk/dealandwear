import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { feedback, setHaptics, setSound, useFeedbackPrefs } from '../lib/feedback';
import { promptInstall, useInstall } from '../lib/install';
import Icon from './Icon';
import { Button } from './primitives';
import styles from './AppSettings.module.css';

/** Speaker button for screens with sound cues (the quiz). */
export function SoundToggle({ className }) {
  const { t } = useTranslation();
  const { sound } = useFeedbackPrefs();
  return (
    <button
      type="button"
      className={`${styles.soundToggle} ${className || ''}`}
      aria-pressed={sound}
      aria-label={sound ? t('feedback.soundOn') : t('feedback.soundOff')}
      onClick={() => {
        setSound(!sound);
        if (!sound) feedback('tap');
      }}
    >
      <Icon name={sound ? 'volume' : 'volumeOff'} size={20} />
    </button>
  );
}

function Switch({ id, label, hint, checked, onChange }) {
  return (
    <div className={styles.row}>
      <div>
        <label htmlFor={id} className={styles.rowLabel}>
          {label}
        </label>
        <p id={`${id}-hint`} className={styles.rowHint}>
          {hint}
        </p>
      </div>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className={styles.switch}
        checked={checked}
        aria-describedby={`${id}-hint`}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}

/** Install the app + sound and haptics preferences. Used on Profile and the public /app page. */
export default function AppSettings({ headingLevel = 2 }) {
  const { t } = useTranslation();
  const { sound, haptics } = useFeedbackPrefs();
  const { canPrompt, ios, installed } = useInstall();
  const [declined, setDeclined] = useState(false);
  const H = `h${headingLevel}`;
  const Sub = `h${headingLevel + 1}`;

  return (
    <section className={styles.section} aria-labelledby="app-settings-title">
      <H id="app-settings-title" className={styles.title}>
        {t('install.settingsTitle')}
      </H>
      <div className={styles.installCard}>
        <img src="/icons/icon-192x192.png" alt="" width="56" height="56" className={styles.appIcon} />
        <div className={styles.installCopy}>
          {installed ? (
            <p>{t('install.installed')}</p>
          ) : ios ? (
            <p>
              {t('install.iosLead')} <Icon name="share" size={16} /> {t('install.iosTail')}
            </p>
          ) : canPrompt && !declined ? (
            <>
              <p>{t('install.settingsBody')}</p>
              <Button
                size="sm"
                variant="accent"
                onClick={async () => {
                  if ((await promptInstall()) !== 'accepted') setDeclined(true);
                }}
              >
                <Icon name="download" size={16} /> {t('install.cta')}
              </Button>
            </>
          ) : (
            <p className={styles.rowHint}>
              {t('install.unavailable')} {t('install.iosSteps')}
            </p>
          )}
        </div>
      </div>

      <Sub className={styles.subTitle}>{t('feedback.title')}</Sub>
      <Switch
        id="pref-sound"
        label={t('feedback.sound')}
        hint={t('feedback.soundHint')}
        checked={sound}
        onChange={(on) => {
          setSound(on);
          if (on) feedback('like');
        }}
      />
      <Switch
        id="pref-haptics"
        label={t('feedback.haptics')}
        hint={t('feedback.hapticsHint')}
        checked={haptics}
        onChange={(on) => {
          setHaptics(on);
          if (on) feedback('tap');
        }}
      />
    </section>
  );
}
