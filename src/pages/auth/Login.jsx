import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { usePageTitle } from '../../lib/usePageTitle';
import { Button, Field } from '../../ui/primitives';
import AuthLayout, { FormError } from './AuthLayout';
import styles from './Auth.module.css';

export default function Login() {
  const { t } = useTranslation();
  usePageTitle(t('auth.signIn'));
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError(t('auth.errors.missingCredentials'));
      return;
    }
    setBusy(true);
    try {
      await login({ identifier, password });
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message || t('errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow={t('auth.welcomeBack')}
      title={t('auth.signIn')}
      lead={t('auth.signInLead')}
      footer={
        <p>
          {t('auth.newHere')} <Link to="/signup" state={location.state}>{t('auth.createAccount')}</Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        <Field
          label={t('auth.emailOrMobile')}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          spellCheck="false"
          required
        />
        <Field label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        <div className={styles.inline}>
          <span />
          <Link to="/forgot-password">{t('auth.forgot')}</Link>
        </div>
        <FormError message={error} />
        <Button type="submit" size="lg" block loading={busy}>
          {t('auth.signIn')}
        </Button>
      </form>
    </AuthLayout>
  );
}
