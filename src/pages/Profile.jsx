import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { shopperApi, useDna, useMe, useUpdateMe } from '../data/queries';
import { saveConsent } from '../lib/consent';
import { usePageTitle } from '../lib/usePageTitle';
import { Button, Checkbox, Chip, EmptyState, Field, Sheet, Spinner } from '../ui/primitives';
import { useToast } from '../ui/Toast';
import AppSettings from '../ui/AppSettings';
import styles from './Profile.module.css';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const REGIONS = ['EG', 'SA', 'AE', 'Other'];
const GENDERS = ['Women', 'Men', 'Unisex', 'Prefer_Not_to_Say'];

function toForm(me) {
  return {
    firstName: me.firstName || '',
    lastName: me.lastName || '',
    phone: me.phone || '',
    birthdate: me.birthdate || '',
    shopperGender: me.shopperGender || '',
    region: me.region || '',
    budgetMax: me.budgetMax ?? '',
    preferredSizes: Array.isArray(me.preferredSizes) ? me.preferredSizes : [],
  };
}

export default function Profile() {
  const { t } = useTranslation();
  usePageTitle(t('profile.title'));
  const me = useMe();
  const dna = useDna({ enabled: Boolean(me.data?.personaArchetype) });
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (me.isPending) return <Spinner />;
  if (me.isError) {
    return (
      <EmptyState
        icon="info"
        title={t('errors.loadTitle')}
        body={t('errors.loadBody')}
        action={<Button onClick={() => me.refetch()}>{t('common.retry')}</Button>}
      />
    );
  }

  const m = me.data;
  const since = m.memberSince ? new Date(m.memberSince).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : null;

  return (
    <div className={`page ${styles.page}`}>
      <header className={styles.header}>
        <p className="eyebrow">{t('profile.eyebrow')}</p>
        <h1 className={styles.title}>{m.firstName ? t('profile.hello', { name: m.firstName }) : t('profile.title')}</h1>
        <p className="muted">
          {m.email}
          {since ? ` · ${t('profile.memberSince', { date: since })}` : ''}
        </p>
      </header>

      <section className={styles.dnaCard}>
        <div>
          <p className="eyebrow">{t('dna.eyebrow')}</p>
          <p className={styles.dnaName}>{m.personaArchetype ? dna.data?.primary?.label || m.personaArchetype.replaceAll('_', ' ') : t('profile.noDnaYet')}</p>
          <p className="muted">{t('quiz.styledPercent', { value: m.styledPercent ?? 0 })}</p>
        </div>
        <div className={styles.dnaActions}>
          <Button to="/dna" variant="secondary" size="sm">
            {t('profile.viewDna')}
          </Button>
          <Button to="/quiz" variant="ghost" size="sm">
            {t('dna.refine')}
          </Button>
        </div>
      </section>

      <DetailsForm me={m} />
      <PrivacySection me={m} />
      <AppSettings />
      <PasswordSection />
      <DataSection />

      <section className={styles.section}>
        <Button
          variant="ghost"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          {t('auth.signOut')}
        </Button>
      </section>
    </div>
  );
}

function DetailsForm({ me }) {
  const { t } = useTranslation();
  const toast = useToast();
  const update = useUpdateMe();
  const [form, setForm] = useState(() => toForm(me));
  const [error, setError] = useState(null);
  const [formFor, setFormFor] = useState(me);
  if (formFor !== me) {
    setFormFor(me);
    setForm(toForm(me));
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleSize = (s) =>
    setForm((f) => ({ ...f, preferredSizes: f.preferredSizes.includes(s) ? f.preferredSizes.filter((x) => x !== s) : [...f.preferredSizes, s] }));

  const submit = (e) => {
    e.preventDefault();
    setError(null);
    if (!form.lastName.trim()) {
      setError(t('auth.errors.lastNameRequired'));
      return;
    }
    update.mutate(
      {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || null,
        birthdate: form.birthdate || null,
        shopperGender: form.shopperGender || null,
        region: form.region || null,
        budgetMax: form.budgetMax === '' ? null : Number(form.budgetMax),
        preferredSizes: form.preferredSizes,
      },
      {
        onSuccess: () => toast.show(t('profile.saved'), { tone: 'success' }),
        onError: (err) => setError(err.message || t('errors.generic')),
      },
    );
  };

  return (
    <section className={styles.section} aria-labelledby="details-title">
      <h2 id="details-title" className={styles.sectionTitle}>
        {t('profile.details')}
      </h2>
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.row}>
          <Field label={t('auth.firstName')} value={form.firstName} onChange={set('firstName')} autoComplete="given-name" maxLength={40} />
          <Field label={t('auth.lastName')} value={form.lastName} onChange={set('lastName')} autoComplete="family-name" maxLength={80} required />
        </div>
        <div className={styles.row}>
          <Field label={t('auth.mobile')} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" maxLength={40} />
          <Field label={t('auth.birthdate')} type="date" value={form.birthdate} onChange={set('birthdate')} autoComplete="bday" />
        </div>
        <div className={styles.row}>
          <Field as="select" label={t('auth.shopFor')} value={form.shopperGender} onChange={set('shopperGender')} hint={t('profile.shopForHint')}>
            <option value="">{t('common.notSet')}</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {t(`gender.${g}`)}
              </option>
            ))}
          </Field>
          <Field as="select" label={t('auth.region')} value={form.region} onChange={set('region')}>
            <option value="">{t('common.notSet')}</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {t(`region.${r}`)}
              </option>
            ))}
          </Field>
        </div>
        <Field
          label={t('profile.budget')}
          type="number"
          min={0}
          step={50}
          inputMode="numeric"
          value={form.budgetMax}
          onChange={set('budgetMax')}
          hint={t('profile.budgetHint')}
        />
        <fieldset className={styles.sizes}>
          <legend className={styles.legend}>{t('profile.sizes')}</legend>
          <div className={styles.chips}>
            {SIZES.map((s) => (
              <Chip key={s} selected={form.preferredSizes.includes(s)} onClick={() => toggleSize(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </fieldset>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <div>
          <Button type="submit" loading={update.isPending}>
            {t('profile.saveChanges')}
          </Button>
        </div>
      </form>
    </section>
  );
}

function PrivacySection({ me }) {
  const { t } = useTranslation();
  const toast = useToast();
  const update = useUpdateMe();

  const change = (key) => (e) => {
    const value = e.target.checked;
    update.mutate(
      { [key]: value },
      {
        onSuccess: () => {
          if (key === 'consentAnalytics') saveConsent(value);
          toast.show(t('profile.saved'), { tone: 'success' });
        },
        onError: () => toast.show(t('errors.generic'), { tone: 'error' }),
      },
    );
  };

  return (
    <section className={styles.section} aria-labelledby="privacy-title">
      <h2 id="privacy-title" className={styles.sectionTitle}>
        {t('profile.privacy')}
      </h2>
      <div className={styles.toggles}>
        <div>
          <Checkbox label={t('profile.personalization')} checked={me.personalizationEnabled !== false} onChange={change('personalizationEnabled')} disabled={update.isPending} />
          <p className={styles.toggleHint}>{t('profile.personalizationHint')}</p>
        </div>
        <div>
          <Checkbox label={t('profile.analytics')} checked={Boolean(me.consentAnalytics)} onChange={change('consentAnalytics')} disabled={update.isPending} />
          <p className={styles.toggleHint}>{t('profile.analyticsHint')}</p>
        </div>
        <div>
          <Checkbox label={t('profile.marketing')} checked={Boolean(me.consentMarketing)} onChange={change('consentMarketing')} disabled={update.isPending} />
          <p className={styles.toggleHint}>{t('profile.marketingHint')}</p>
        </div>
      </div>
      <p className="muted">
        <Link to="/privacy">{t('footer.privacy')}</Link>
      </p>
    </section>
  );
}

function PasswordSection() {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(next)) {
      setError(t('auth.errors.weakPassword'));
      return;
    }
    setBusy(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      toast.show(t('profile.passwordChanged'), { tone: 'success' });
    } catch (err) {
      setError(err.message || t('errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.section} aria-labelledby="password-title">
      <h2 id="password-title" className={styles.sectionTitle}>
        {t('profile.password')}
      </h2>
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.row}>
          <Field label={t('profile.currentPassword')} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
          <Field
            label={t('profile.newPassword')}
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            hint={t('auth.passwordHint')}
            required
          />
        </div>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <div>
          <Button type="submit" variant="secondary" loading={busy} disabled={!current || !next}>
            {t('profile.updatePassword')}
          </Button>
        </div>
      </form>
    </section>
  );
}

function DataSection() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await shopperApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `find-your-fit-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      toast.show(t('errors.generic'), { tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const remove = async () => {
    setError(null);
    setDeleting(true);
    try {
      await shopperApi.deleteAccount(password);
      logout();
      navigate('/');
      toast.show(t('profile.deleted'));
    } catch (err) {
      setError(err.message || t('errors.generic'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className={styles.section} aria-labelledby="data-title">
      <h2 id="data-title" className={styles.sectionTitle}>
        {t('profile.yourData')}
      </h2>
      <p className="muted">{t('profile.yourDataBody')}</p>
      <div className={styles.dataActions}>
        <Button variant="secondary" icon="download" onClick={exportData} loading={exporting}>
          {t('profile.export')}
        </Button>
        <Button variant="danger" icon="trash" onClick={() => setConfirmOpen(true)}>
          {t('profile.delete')}
        </Button>
      </div>
      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('profile.deleteTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={remove} loading={deleting} disabled={!password}>
              {t('profile.deleteConfirm')}
            </Button>
          </>
        }
      >
        <p className={styles.deleteBody}>{t('profile.deleteBody')}</p>
        <Field label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" error={error} />
      </Sheet>
    </section>
  );
}
