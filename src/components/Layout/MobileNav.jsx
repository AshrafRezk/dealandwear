import { NavLink } from 'react-router-dom';
import styles from './MobileNav.module.css';
import { hapticNavigate } from '../../utils/haptics';

function MobileNav() {
  return (
    <nav className={styles.mobileNav}>
      <NavLink 
        to="/" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        onClick={() => hapticNavigate()}
      >
        <span className={styles.icon}>Style</span>
        <span className={styles.label}>Style</span>
      </NavLink>
      <NavLink 
        to="/about" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        onClick={() => hapticNavigate()}
      >
        <span className={styles.icon}>About</span>
        <span className={styles.label}>About</span>
      </NavLink>
      <NavLink 
        to="/contact" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        onClick={() => hapticNavigate()}
      >
        <span className={styles.icon}>Contact</span>
        <span className={styles.label}>Contact</span>
      </NavLink>
    </nav>
  );
}

export default MobileNav;

