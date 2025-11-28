import { NavLink } from 'react-router-dom';
import styles from './MobileNav.module.css';

function MobileNav() {
  return (
    <nav className={styles.mobileNav}>
      <NavLink 
        to="/" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
      >
        <span className={styles.icon}>💬</span>
        <span className={styles.label}>Style</span>
      </NavLink>
      <NavLink 
        to="/about" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
      >
        <span className={styles.icon}>ℹ️</span>
        <span className={styles.label}>About</span>
      </NavLink>
      <NavLink 
        to="/contact" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
      >
        <span className={styles.icon}>📧</span>
        <span className={styles.label}>Contact</span>
      </NavLink>
    </nav>
  );
}

export default MobileNav;

