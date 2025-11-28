import { NavLink } from 'react-router-dom';
import styles from './DesktopNav.module.css';
import { hapticNavigate } from '../../utils/haptics';
import SearchIcon from '@mui/icons-material/Search';

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
        to="/search" 
        className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
        onClick={() => hapticNavigate()}
      >
        <SearchIcon style={{ fontSize: 18, marginRight: 4 }} />
        Search
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

