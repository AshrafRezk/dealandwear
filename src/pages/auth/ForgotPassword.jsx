import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { usePageTitle } from '../../lib/usePageTitle';
import { Button, Field } from '../../ui/primitives';
import AuthLayout, { FormError } from './AuthLayout';
import styles from './Auth.module.css';

export default function ForgotPassword() {
  const { t } = useTranslation();
  usePageTitle(t('auth.forgotTitle'));
  const { requestReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError(t('auth.errors.emailInvalid'));
      return;
    }
    setBusy(true);
    try {
      await requestReset(email.trim());
      setSent(true);
    } catch (err) {
      if (err.status === 429) setError(err.message);
      else setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.forgotTitle')}
      lead={t('auth.forgotLead')}
      footer={
        <p>
          <Link to="/login">{t('auth.backToSignIn')}</Link>
        </p>
      }
    >
      {sent ? (
        <p className={styles.success} role="status">
          {t('auth.resetSent', { email: email.trim() })}
        </p>
      ) : (
        <form className={styles.form} onSubmit={submit} noValidate>
          <Field label={t('auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" required />
          <FormError message={error} />
          <Button type="submit" size="lg" block loading={busy}>
            {t('auth.sendLink')}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
