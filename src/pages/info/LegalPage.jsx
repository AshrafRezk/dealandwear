import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../lib/usePageTitle';
import styles from './Info.module.css';

/** Renders legal copy stored in the locale file as { title, updated, intro, sections: [{ title, paragraphs?, bullets? }] }. */
export default function LegalPage({ docKey }) {
  const { t } = useTranslation();
  const doc = t(`legal.${docKey}`, { returnObjects: true });
  usePageTitle(doc.title);
  return (
    <article className={`page ${styles.page}`}>
      <p className="eyebrow">{t('legal.eyebrow')}</p>
      <h1 className={styles.title}>{doc.title}</h1>
      <p className={styles.updated}>{doc.updated}</p>
      <p className={styles.lead}>{doc.intro}</p>
      {(doc.sections || []).map((s) => (
        <section key={s.title} className={styles.section}>
          <h2>{s.title}</h2>
          {(s.paragraphs || []).map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
          {s.bullets?.length ? (
            <ul>
              {s.bullets.map((b) => (
                <li key={b.slice(0, 40)}>{b}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}
