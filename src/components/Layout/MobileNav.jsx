import { NavLink } from 'react-router-dom';
import styles from './MobileNav.module.css';
import { hapticNavigate } from '../../utils/haptics';
import StyleIcon from '@mui/icons-material/Style';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';

function MobileNav() {
  return (
    <nav className={styles.mobileNav}>
      <NavLink 
        to="/" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        onClick={() => hapticNavigate()}
      >
        <StyleIcon className={styles.icon} />
        <span className={styles.label}>Style</span>
      </NavLink>
      <NavLink 
        to="/search" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        onClick={() => hapticNavigate()}
      >
        <SearchIcon className={styles.icon} />
        <span className={styles.label}>Search</span>
      </NavLink>
      <NavLink 
        to="/about" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        onClick={() => hapticNavigate()}
      >
        <InfoIcon className={styles.icon} />
        <span className={styles.label}>About</span>
      </NavLink>
      <NavLink 
        to="/contact" 
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        onClick={() => hapticNavigate()}
      >
        <ContactMailIcon className={styles.icon} />
        <span className={styles.label}>Contact</span>
      </NavLink>
    </nav>
  );
}

export default MobileNav;

