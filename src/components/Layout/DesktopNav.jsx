import { NavLink } from 'react-router-dom';
import styles from './DesktopNav.module.css';

function DesktopNav() {
  return (
    <nav className={styles.desktopNav}>
      <NavLink 
        to="/" 
        className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
      >
        Style Assistant
      </NavLink>
      <NavLink 
        to="/about" 
        className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
      >
        About
      </NavLink>
      <NavLink 
        to="/contact" 
        className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
      >
        Contact
      </NavLink>
    </nav>
  );
}

export default DesktopNav;

