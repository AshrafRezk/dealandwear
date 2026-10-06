import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import Icon from '../ui/Icon';
import Logo from '../ui/Logo';
import ErrorBoundary from '../ui/ErrorBoundary';
import { Spinner } from '../ui/primitives';
import ConsentBanner from './ConsentBanner';
import InstallPrompt from './InstallPrompt';
import styles from './AppShell.module.css';

const TABS = [
  { to: '/', icon: 'home', key: 'nav.home', end: true },
  { to: '/search', icon: 'search', key: 'nav.search' },
  { to: '/quiz', icon: 'quiz', key: 'nav.quiz' },
  { to: '/saved', icon: 'heart', key: 'nav.saved' },
  { to: '/profile', icon: 'user', key: 'nav.profile' },
];

const FOCUSED_ROUTES = ['/quiz'];

export default function AppShell() {
  const location = useLocation();
  const focused = FOCUSED_ROUTES.includes(location.pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className={styles.app}>
      <SkipLink />
      <Header focused={focused} />
      <main id="main" className={`${styles.main} ${focused ? styles.mainFocused : ''}`} tabIndex={-1}>
        <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      {!focused ? <Footer /> : null}
      {!focused ? <TabBar /> : null}
      <ConsentBanner />
      <InstallPrompt />
    </div>
  );
}

function SkipLink() {
  const { t } = useTranslation();
  return (
    <a href="#main" className="skip-link">
      {t('nav.skip')}
    </a>
  );
}

function Header({ focused }) {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  };

  if (focused) {
    return (
      <header className={`${styles.header} ${styles.headerFocused}`}>
        <Link to="/" className={styles.logoLink} aria-label={t('nav.home')}>
          <Logo size={18} />
        </Link>
        <Link to="/" className={styles.skipQuiz}>
          {t('quiz.skipForNow')}
        </Link>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <nav className={styles.primaryNav} aria-label={t('nav.primary')}>
        <NavLink to="/search?sort=newest" className={styles.navLink}>
          {t('nav.newIn')}
        </NavLink>
        <NavLink to="/search?gender=Women" className={styles.navLink}>
          {t('nav.women')}
        </NavLink>
        <NavLink to="/search?gender=Men" className={styles.navLink}>
          {t('nav.men')}
        </NavLink>
        <NavLink to="/brands" className={styles.navLink}>
          {t('nav.brands')}
        </NavLink>
      </nav>
      <Link to="/" className={styles.logoLink} aria-label={t('nav.home')}>
        <Logo size={22} />
      </Link>
      <div className={styles.headerTools}>
        <form role="search" className={styles.headerSearch} onSubmit={submit}>
          <label htmlFor="header-search" className="visually-hidden">
            {t('search.label')}
          </label>
          <input id="header-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search.placeholderShort')} enterKeyHint="search" />
          <button type="submit" aria-label={t('search.submit')}>
            <Icon name="search" size={18} />
          </button>
        </form>
        <NavLink to="/quiz" className={styles.toolLink}>
          {t('nav.quiz')}
        </NavLink>
        <NavLink to="/saved" className={styles.toolLink}>
          {t('nav.saved')}
        </NavLink>
        <NavLink to={isSignedIn ? '/profile' : '/login'} className={styles.toolLink}>
          {isSignedIn ? t('nav.profile') : t('auth.signIn')}
        </NavLink>
        <Link to="/search" className={styles.mobileSearch} aria-label={t('nav.search')}>
          <Icon name="search" size={22} />
        </Link>
      </div>
    </header>
  );
}

function TabBar() {
  const { t } = useTranslation();
  return (
    <nav className={styles.tabbar} aria-label={t('nav.tabs')}>
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}>
          <Icon name={tab.icon} size={22} />
          <span>{t(tab.key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className={styles.footer}>
      <div className={`page ${styles.footerInner}`}>
        <div className={styles.footerBrand}>
          <Logo size={20} />
          <p className="muted">{t('footer.tagline')}</p>
        </div>
        <nav className={styles.footerLinks} aria-label={t('footer.label')}>
          <Link to="/about">{t('footer.about')}</Link>
          <Link to="/brands">{t('nav.brands')}</Link>
          <Link to="/contact">{t('footer.contact')}</Link>
          <Link to="/privacy">{t('footer.privacy')}</Link>
          <Link to="/terms">{t('footer.terms')}</Link>
          <Link to="/app">{t('footer.getApp')}</Link>
        </nav>
        <p className={styles.copyright}>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
