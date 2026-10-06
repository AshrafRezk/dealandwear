import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { usePageTitle } from '../../lib/usePageTitle';
import { Button, Field } from '../../ui/primitives';
import AuthLayout, { FormError } from './AuthLayout';
import styles from './Auth.module.css';

export default function ResetPassword() {
  const { t } = useTranslation();
  usePageTitle(t('auth.resetTitle'));
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  const { confirmReset } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!email || !token) {
    return (
      <AuthLayout title={t('auth.resetInvalidTitle')} lead={t('auth.resetInvalidBody')}>
        <Button to="/forgot-password">{t('auth.requestNewLink')}</Button>
      </AuthLayout>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
      setError(t('auth.errors.weakPassword'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.errors.mismatch'));
      return;
    }
    setBusy(true);
    try {
      await confirmReset({ email, token, newPassword: password });
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.message || t('errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.resetTitle')}
      lead={t('auth.resetLead', { email })}
      footer={
        <p>
          <Link to="/forgot-password">{t('auth.requestNewLink')}</Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        <Field label={t('profile.newPassword')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" hint={t('auth.passwordHint')} required />
        <Field label={t('auth.confirmPassword')} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
        <FormError message={error} />
        <Button type="submit" size="lg" block loading={busy}>
          {t('auth.setPassword')}
        </Button>
      </form>
    </AuthLayout>
  );
}
