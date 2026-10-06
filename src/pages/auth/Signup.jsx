import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { EVENTS, track } from '../../lib/analytics';
import { readConsent, saveConsent } from '../../lib/consent';
import { usePageTitle } from '../../lib/usePageTitle';
import { Button, Checkbox, Field } from '../../ui/primitives';
import AuthLayout, { FormError } from './AuthLayout';
import styles from './Auth.module.css';

const GENDERS = ['Women', 'Men', 'Unisex', 'Prefer_Not_to_Say'];
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function Signup() {
  const { t } = useTranslation();
  usePageTitle(t('auth.createAccount'));
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    gender: '',
    acceptTerms: false,
    consentMarketing: false,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    track(EVENTS.SIGNUP_START);
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.lastName.trim()) errs.lastName = t('auth.errors.lastNameRequired');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) errs.email = t('auth.errors.emailInvalid');
    if (!PASSWORD_RULE.test(form.password)) errs.password = t('auth.errors.weakPassword');
    if (!form.acceptTerms) errs.acceptTerms = t('auth.errors.acceptTerms');
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const consentAnalytics = readConsent()?.analytics === true;
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim() || undefined,
        password: form.password,
        gender: form.gender || undefined,
        acceptTerms: true,
        consentAnalytics,
        consentMarketing: form.consentMarketing,
      });
      if (readConsent() === null) saveConsent(false);
      navigate(location.state?.from || '/dna', { replace: true });
    } catch (err) {
      if (err.code === 'EMAIL_IN_USE') setErrors({ email: err.message });
      else if (err.code === 'PHONE_IN_USE') setErrors({ mobile: err.message });
      else setFormError(err.message || t('errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow={t('auth.signupEyebrow')}
      title={t('auth.createAccount')}
      lead={t('auth.signupLead')}
      footer={
        <p>
          {t('auth.haveAccount')} <Link to="/login" state={location.state}>{t('auth.signIn')}</Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.row}>
          <Field label={t('auth.firstName')} value={form.firstName} onChange={set('firstName')} autoComplete="given-name" maxLength={40} />
          <Field label={t('auth.lastName')} value={form.lastName} onChange={set('lastName')} autoComplete="family-name" maxLength={80} error={errors.lastName} required />
        </div>
        <Field
          label={t('auth.email')}
          type="email"
          value={form.email}
          onChange={set('email')}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck="false"
          error={errors.email}
          required
        />
        <Field
          label={t('auth.mobileOptional')}
          type="tel"
          value={form.mobile}
          onChange={set('mobile')}
          autoComplete="tel"
          inputMode="tel"
          hint={t('auth.mobileHint')}
          error={errors.mobile}
        />
        <Field
          label={t('auth.password')}
          type="password"
          value={form.password}
          onChange={set('password')}
          autoComplete="new-password"
          hint={t('auth.passwordHint')}
          error={errors.password}
          required
        />
        <Field as="select" label={t('auth.shopFor')} value={form.gender} onChange={set('gender')} hint={t('auth.shopForHint')}>
          <option value="">{t('common.notSet')}</option>
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {t(`gender.${g}`)}
            </option>
          ))}
        </Field>
        <div>
          <Checkbox
            checked={form.acceptTerms}
            onChange={set('acceptTerms')}
            label={
              <>
                {t('auth.acceptLead')} <Link to="/terms">{t('footer.terms')}</Link> {t('auth.and')} <Link to="/privacy">{t('footer.privacy')}</Link>
              </>
            }
          />
          {errors.acceptTerms ? (
            <p className={styles.small} role="alert" style={{ color: 'var(--danger)' }}>
              {errors.acceptTerms}
            </p>
          ) : null}
        </div>
        <Checkbox checked={form.consentMarketing} onChange={set('consentMarketing')} label={t('auth.marketingOptIn')} />
        <FormError message={formError} />
        <Button type="submit" size="lg" block loading={busy}>
          {t('auth.createAccount')}
        </Button>
        <p className={styles.small}>{t('auth.guestMerge')}</p>
      </form>
    </AuthLayout>
  );
}
