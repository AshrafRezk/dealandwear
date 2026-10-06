import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shopperApi } from '../../data/queries';
import { usePageTitle } from '../../lib/usePageTitle';
import { Button, Field } from '../../ui/primitives';
import styles from './Info.module.css';

const TOPICS = ['general', 'brand', 'account', 'privacy', 'bug'];

export default function Contact() {
  const { t } = useTranslation();
  usePageTitle(t('contact.title'));
  const [form, setForm] = useState({ name: '', email: '', topic: 'general', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.website) {
      setSent(true);
      return;
    }
    const errs = {};
    if (!form.name.trim()) errs.name = t('contact.errors.name');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) errs.email = t('auth.errors.emailInvalid');
    if (form.message.trim().length < 10) errs.message = t('contact.errors.message');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await shopperApi.contact({
        name: form.name.trim(),
        email: form.email.trim(),
        topic: t(`contact.topic.${form.topic}`),
        message: form.message.trim(),
      });
      setSent(true);
    } catch (err) {
      setError(err.message || t('errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`page ${styles.page}`}>
      <p className="eyebrow">{t('contact.eyebrow')}</p>
      <h1 className={styles.title}>{t('contact.title')}</h1>
      <p className={styles.lead}>{t('contact.lead')}</p>
      {sent ? (
        <p className={styles.success} role="status">
          {t('contact.sent')}
        </p>
      ) : (
        <form className={styles.form} onSubmit={submit} noValidate>
          <Field label={t('contact.name')} value={form.name} onChange={set('name')} autoComplete="name" maxLength={80} error={errors.name} required />
          <Field label={t('auth.email')} type="email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={80} error={errors.email} required />
          <Field as="select" label={t('contact.topicLabel')} value={form.topic} onChange={set('topic')}>
            {TOPICS.map((k) => (
              <option key={k} value={k}>
                {t(`contact.topic.${k}`)}
              </option>
            ))}
          </Field>
          <Field as="textarea" rows={6} label={t('contact.message')} value={form.message} onChange={set('message')} maxLength={4000} error={errors.message} required />
          <div className="visually-hidden" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input id="contact-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
          </div>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <div>
            <Button type="submit" size="lg" loading={busy}>
              {t('contact.send')}
            </Button>
          </div>
        </form>
      )}
    </article>
  );
}
