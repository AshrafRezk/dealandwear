import { NavLink } from 'react-router-dom';
import styles from './DesktopNav.module.css';
import { hapticNavigate } from '../../utils/haptics';

function DesktopNav() {
  return (
    <nav className={styles.desktopNav}>
      <NavLink 
        to="/" 
        className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
        onClick={() => hapticNavigate()}
      >
        Style Assistant
      </NavLink>
      <NavLink 
        to="/about" 
        className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
        onClick={() => hapticNavigate()}
      >
        About
      </NavLink>
      <NavLink 
        to="/contact" 
        className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
        onClick={() => hapticNavigate()}
      >
        Contact
      </NavLink>
    </nav>
  );
}

export default DesktopNav;

