import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useDna } from '../data/queries';
import { EVENTS, track } from '../lib/analytics';
import { usePageTitle } from '../lib/usePageTitle';
import { renderDnaCard } from '../lib/shareCard';
import { ProductGrid } from '../ui/ProductCard';
import { Button, EmptyState, ProgressBar, Spinner } from '../ui/primitives';
import { useToast } from '../ui/Toast';
import styles from './Dna.module.css';

export default function Dna() {
  const { t } = useTranslation();
  usePageTitle(t('dna.title'));
  const { isSignedIn } = useAuth();
  const dna = useDna();
  const toast = useToast();
  const [sharing, setSharing] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (dna.data?.ready && !tracked.current) {
      tracked.current = true;
      track(EVENTS.DNA_VIEW);
    }
  }, [dna.data?.ready]);

  if (dna.isPending) return <Spinner />;
  if (dna.isError) {
    return (
      <EmptyState
        icon="info"
        title={t('errors.loadTitle')}
        body={t('errors.loadBody')}
        action={<Button onClick={() => dna.refetch()}>{t('common.retry')}</Button>}
      />
    );
  }

  const d = dna.data;
  if (!d.ready) {
    return (
      <section className={`page ${styles.notReady}`}>
        <p className="eyebrow">{t('dna.eyebrow')}</p>
        <h1 className={styles.title}>{t('dna.notReadyTitle')}</h1>
        <p className={styles.lead}>{t('dna.notReadyBody', { count: Math.max(0, d.minSwipes - d.rated) })}</p>
        <ProgressBar value={d.styledPercent} label={t('quiz.styledLabel')} />
        <p className="muted">{t('quiz.styledPercent', { value: d.styledPercent })}</p>
        <Button to="/quiz" size="lg" iconEnd="arrowRight">
          {d.rated > 0 ? t('dna.continueQuiz') : t('home.ctaQuiz')}
        </Button>
      </section>
    );
  }

  const share = async () => {
    setSharing(true);
    try {
      const blob = await renderDnaCard({
        firstName: d.firstName,
        primary: d.primary,
        archetypes: d.archetypes,
        axes: d.axes,
        labels: { heading: t('dna.shareHeading'), footer: t('dna.shareFooter'), url: window.location.host },
      });
      const file = new File([blob], 'my-style-dna.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t('dna.shareTitle'), text: t('dna.shareText', { archetype: d.primary?.label }) });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-style-dna.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast.show(t('dna.downloaded'), { tone: 'success' });
      }
      track(EVENTS.DNA_SHARE);
    } catch (e) {
      if (e?.name !== 'AbortError') toast.show(t('errors.generic'), { tone: 'error' });
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <section className={styles.hero}>
        <div className={`page ${styles.heroInner}`}>
          <div>
            <p className="eyebrow">{d.firstName ? t('dna.eyebrowNamed', { name: d.firstName }) : t('dna.eyebrow')}</p>
            <h1 className={styles.title}>{d.primary?.label}</h1>
            {d.primary?.tagline ? <p className={styles.tagline}>{d.primary.tagline}</p> : null}
            <p className={styles.lead}>{d.summary}</p>
            <div className={styles.actions}>
              <Button icon="share" onClick={share} loading={sharing}>
                {t('dna.share')}
              </Button>
              <Button to="/" variant="secondary">
                {t('dna.shopPicks')}
              </Button>
              <Button to="/quiz" variant="ghost">
                {t('dna.refine')}
              </Button>
            </div>
          </div>
          <Radar axes={d.axes} />
        </div>
      </section>

      {d.isGuest && !isSignedIn ? (
        <section className="page">
          <div className={styles.saveBox}>
            <div>
              <h2 className={styles.saveTitle}>{t('dna.saveTitle')}</h2>
              <p className="muted">{t('dna.saveBody')}</p>
            </div>
            <Button to="/signup" variant="accent">
              {t('auth.createAccount')}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="page section" aria-labelledby="mix-title">
        <h2 id="mix-title" className="section-title">
          {t('dna.mixTitle')}
        </h2>
        <ul className={styles.mix}>
          {d.archetypes.map((a) => (
            <li key={a.key} className={styles.mixItem}>
              <div className={styles.mixHead}>
                <span className={styles.mixLabel}>{a.label}</span>
                <span className={styles.mixPct}>{a.percent}%</span>
              </div>
              <ProgressBar value={a.percent} label={a.label} />
              {a.tagline ? <p className="muted">{a.tagline}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="page section" aria-labelledby="axes-title">
        <h2 id="axes-title" className="section-title">
          {t('dna.axesTitle')}
        </h2>
        <dl className={styles.axes}>
          {d.axes.map((a) => (
            <div key={a.axis} className={styles.axis}>
              <dt>{a.label}</dt>
              <dd>
                <strong>{a.bucketLabel}</strong>
                <span className="muted">{t(`dna.signal.${signalLevel(a.strength)}`)}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {d.evidence?.length ? (
        <section className="page section" aria-labelledby="evidence-title">
          <h2 id="evidence-title" className="section-title">
            {t('dna.evidenceTitle')}
          </h2>
          <p className={`muted ${styles.evidenceBody}`}>{t('dna.evidenceBody')}</p>
          <ProductGrid products={d.evidence.slice(0, 8)} surface="Quiz" />
        </section>
      ) : null}
    </>
  );
}

function signalLevel(strength = 0) {
  if (strength >= 60) return 'strong';
  if (strength >= 35) return 'leaning';
  return 'light';
}

function Radar({ axes }) {
  const { t } = useTranslation();
  if (!axes?.length || axes.length < 3) return null;
  const size = 280;
  const c = size / 2;
  const r = c - 40;
  const point = (i, v) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    return [c + Math.cos(angle) * r * v, c + Math.sin(angle) * r * v];
  };
  const shape = axes.map((a, i) => point(i, Math.max(0.12, (a.strength || 0) / 100)).join(',')).join(' ');
  return (
    <figure className={styles.radar}>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={t('dna.radarLabel')}>
        {[0.33, 0.66, 1].map((ring) => (
          <polygon key={ring} points={axes.map((_, i) => point(i, ring).join(',')).join(' ')} className={styles.ring} />
        ))}
        {axes.map((a, i) => {
          const [x, y] = point(i, 1);
          return <line key={a.axis} x1={c} y1={c} x2={x} y2={y} className={styles.spoke} />;
        })}
        <polygon points={shape} className={styles.shape} />
        {axes.map((a, i) => {
          const [x, y] = point(i, 1.2);
          return (
            <text key={a.axis} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className={styles.radarLabel}>
              {a.bucketLabel}
            </text>
          );
        })}
      </svg>
    </figure>
  );
}
