import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useDeck, useSwipeMutations, useUpdateMe } from '../data/queries';
import { EVENTS, track } from '../lib/analytics';
import { formatPrice } from '../lib/products';
import { usePageTitle } from '../lib/usePageTitle';
import { setShopFor } from '../lib/session';
import { feedback, haptic } from '../lib/feedback';
import { SoundToggle } from '../ui/AppSettings';
import Icon from '../ui/Icon';
import { Button, EmptyState, ProgressBar, Spinner } from '../ui/primitives';
import { useToast } from '../ui/Toast';
import styles from './Quiz.module.css';

const AUDIENCES = [
  { key: 'Women', label: 'quiz.audience.women' },
  { key: 'Men', label: 'quiz.audience.men' },
  { key: '', label: 'quiz.audience.all' },
];
const SWIPE_THRESHOLD = 90;

export default function Quiz() {
  const { t } = useTranslation();
  usePageTitle(t('quiz.title'));
  const [audience, setAudience] = useState(null);
  const { isSignedIn } = useAuth();
  const updateMe = useUpdateMe();

  const choose = (key) => {
    track(EVENTS.QUIZ_START);
    setShopFor(key);
    if (isSignedIn && key) updateMe.mutate({ shopperGender: key });
    setAudience(key);
  };

  if (audience === null) {
    return (
      <section className={`page ${styles.intro}`}>
        <p className="eyebrow">{t('quiz.eyebrow')}</p>
        <h1 className={styles.introTitle}>{t('quiz.introTitle')}</h1>
        <p className={styles.introBody}>{t('quiz.introBody')}</p>
        <fieldset className={styles.audience}>
          <legend className={styles.audienceLegend}>{t('quiz.audienceLegend')}</legend>
          {AUDIENCES.map((a) => (
            <Button
              key={a.label}
              variant={a.key ? 'primary' : 'secondary'}
              size="lg"
              block
              onClick={() => choose(a.key)}
            >
              {t(a.label)}
            </Button>
          ))}
        </fieldset>
        <ul className={styles.howList}>
          <li>
            <Icon name="thumbUp" size={18} /> {t('quiz.howLike')}
          </li>
          <li>
            <Icon name="thumbDown" size={18} /> {t('quiz.howDislike')}
          </li>
          <li>
            <Icon name="skip" size={18} /> {t('quiz.howSkip')}
          </li>
        </ul>
      </section>
    );
  }

  return <Deck audience={audience} />;
}

function Deck({ audience }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const deckQuery = useDeck(audience || undefined);
  const { swipe, undo, finalize } = useSwipeMutations();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(null);
  const [drag, setDrag] = useState({ dx: 0, active: false, leaving: null });
  const start = useRef(null);

  const cards = deckQuery.data?.deck ?? [];
  const card = cards[index];
  const next = cards[index + 1];
  const minSwipes = deckQuery.data?.minSwipes ?? 12;
  const rated = progress?.rated ?? deckQuery.data?.rated ?? 0;
  const styledPercent = progress?.styledPercent ?? deckQuery.data?.styledPercent ?? 0;
  const dnaReady = progress?.dnaReady ?? rated >= minSwipes;

  const finish = useCallback(() => {
    finalize.mutate(undefined, {
      onSuccess: () => {
        feedback('success');
        track(EVENTS.QUIZ_COMPLETE);
        navigate('/dna');
      },
      onError: () => {
        feedback('error');
        toast.show(t('errors.generic'), { tone: 'error' });
      },
    });
  }, [finalize, navigate, toast, t]);

  const decide = useCallback(
    (verdict) => {
      if (!card || drag.leaving) return;
      feedback(verdict);
      setDrag({ dx: 0, active: false, leaving: verdict });
      const current = index;
      window.setTimeout(() => {
        setIndex(current + 1);
        setDrag({ dx: 0, active: false, leaving: null });
      }, 220);
      swipe.mutate(
        { productId: card.productId, verdict, imageIndex: card.imageIndex },
        {
          onSuccess: (p) => setProgress(p),
          onError: () => {
            feedback('error');
            toast.show(t('quiz.swipeFailed'), { tone: 'error' });
            setIndex(current);
          },
        },
      );
    },
    [card, drag.leaving, index, swipe, toast, t],
  );

  const goBack = useCallback(() => {
    if (index === 0 || undo.isPending) return;
    feedback('undo');
    undo.mutate(undefined, {
      onSuccess: (p) => {
        setProgress(p);
        setIndex((i) => Math.max(0, i - 1));
      },
      onError: () => toast.show(t('errors.generic'), { tone: 'error' }),
    });
  }, [index, undo, toast, t]);

  const unlocked = useRef(dnaReady);
  useEffect(() => {
    if (dnaReady && !unlocked.current) feedback('success');
    unlocked.current = dnaReady;
  }, [dnaReady]);

  const hintSide = drag.active ? (drag.dx > SWIPE_THRESHOLD ? 'like' : drag.dx < -SWIPE_THRESHOLD ? 'dislike' : null) : null;
  useEffect(() => {
    if (hintSide) haptic('tap');
  }, [hintSide]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select')) return;
      const rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'ArrowRight') decide(rtl ? 'dislike' : 'like');
      else if (e.key === 'ArrowLeft') decide(rtl ? 'like' : 'dislike');
      else if (e.key === 'ArrowDown' || e.key === 's') decide('skip');
      else if (e.key === 'Backspace' || e.key === 'z') goBack();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide, goBack]);

  if (deckQuery.isPending) return <Spinner label={t('quiz.loadingDeck')} />;
  if (deckQuery.isError) {
    return (
      <EmptyState
        icon="info"
        title={t('errors.loadTitle')}
        body={t('errors.loadBody')}
        action={<Button onClick={() => deckQuery.refetch()}>{t('common.retry')}</Button>}
      />
    );
  }

  const onPointerDown = (e) => {
    if (drag.leaving) return;
    start.current = e.clientX;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ dx: 0, active: true, leaving: null });
  };
  const onPointerMove = (e) => {
    if (start.current === null) return;
    setDrag((d) => ({ ...d, dx: e.clientX - start.current }));
  };
  const onPointerUp = () => {
    if (start.current === null) return;
    const dx = drag.dx;
    start.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD) decide(dx > 0 ? 'like' : 'dislike');
    else setDrag({ dx: 0, active: false, leaving: null });
  };

  const leavingX = drag.leaving === 'like' ? 600 : drag.leaving === 'dislike' ? -600 : 0;
  const dx = drag.leaving ? leavingX : drag.dx;
  const transform = `translateX(${dx}px) rotate(${dx / 20}deg)${drag.leaving === 'skip' ? ' translateY(-40px) scale(0.96)' : ''}`;
  const hint = drag.dx > 40 ? 'like' : drag.dx < -40 ? 'dislike' : null;

  return (
    <section className={styles.deckPage} aria-label={t('quiz.title')}>
      <div className={styles.progressRow}>
        <div className={styles.progressTop}>
          <ProgressBar value={styledPercent} label={t('quiz.styledLabel')} />
          <SoundToggle />
        </div>
        <p className={styles.progressText} aria-live="polite">
          {t('quiz.styledPercent', { value: styledPercent })}
          <span className="muted"> · {dnaReady ? t('quiz.dnaReady') : t('quiz.toGo', { count: Math.max(0, minSwipes - rated) })}</span>
        </p>
      </div>

      {card ? (
        <>
          <div className={styles.stage}>
            {next ? (
              <div className={`${styles.card} ${styles.cardBehind}`} aria-hidden="true">
                <img src={next.imageUrl} alt="" />
              </div>
            ) : null}
            <div
              key={card.productId + index}
              className={`${styles.card} ${drag.active ? styles.dragging : ''}`}
              style={{ transform, opacity: drag.leaving ? 0 : 1 }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img src={card.imageUrl} alt={card.name} draggable="false" />
              {hint ? <span className={`${styles.stamp} ${styles[`stamp_${hint}`]}`}>{t(`quiz.stamp.${hint}`)}</span> : null}
              <div className={styles.caption}>
                <p className={styles.captionBrand}>{card.brandName}</p>
                <p className={styles.captionName} dir="auto">{card.name}</p>
                {card.price ? <p className={styles.captionPrice}>{formatPrice(card.price, i18n.language)}</p> : null}
              </div>
            </div>
          </div>

          <div className={styles.controls} role="group" aria-label={t('quiz.controlsLabel')}>
            <button type="button" className={styles.ctrlSmall} onClick={goBack} disabled={index === 0 || undo.isPending} aria-label={t('quiz.undo')}>
              <Icon name="undo" size={20} />
            </button>
            <button type="button" className={`${styles.ctrl} ${styles.ctrlNo}`} onClick={() => decide('dislike')} aria-disabled={Boolean(drag.leaving)} aria-label={t('quiz.dislike')}>
              <Icon name="thumbDown" size={26} />
            </button>
            <button type="button" className={styles.ctrlSmall} onClick={() => decide('skip')} aria-disabled={Boolean(drag.leaving)} aria-label={t('quiz.skip')}>
              <Icon name="skip" size={20} />
            </button>
            <button type="button" className={`${styles.ctrl} ${styles.ctrlYes}`} onClick={() => decide('like')} aria-disabled={Boolean(drag.leaving)} aria-label={t('quiz.like')}>
              <Icon name="thumbUp" size={26} />
            </button>
            <span className={styles.ctrlSpacer} aria-hidden="true" />
          </div>
          <p className={styles.keyHint}>{t('quiz.keyboardHint')}</p>

          {dnaReady ? (
            <div className={styles.finishRow}>
              <Button variant="accent" size="lg" onClick={finish} loading={finalize.isPending} iconEnd="arrowRight">
                {t('quiz.seeDna')}
              </Button>
              <p className="muted">{t('quiz.keepGoing')}</p>
            </div>
          ) : null}
        </>
      ) : (
        <div className={styles.endCard}>
          <EmptyState
            icon="sparkle"
            title={dnaReady ? t('quiz.endReadyTitle') : t('quiz.endMoreTitle')}
            body={dnaReady ? t('quiz.endReadyBody') : t('quiz.endMoreBody')}
            action={
              <>
                {dnaReady ? (
                  <Button onClick={finish} loading={finalize.isPending}>
                    {t('quiz.seeDna')}
                  </Button>
                ) : null}
                <Button
                  variant={dnaReady ? 'secondary' : 'primary'}
                  onClick={() => {
                    setIndex(0);
                    deckQuery.refetch();
                  }}
                >
                  {t('quiz.moreLooks')}
                </Button>
              </>
            }
          />
        </div>
      )}
    </section>
  );
}
