import { Link } from 'react-router-dom';
import DesktopNav from './DesktopNav';
import styles from './Header.module.css';
import logoImage from '../../assets/deal and wear logo (Transparent).png';
import { hapticButton } from '../../utils/haptics';

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo} onClick={() => hapticButton()}>
          <img src={logoImage} alt="Deal & Wear" className={styles.logoImage} />
          <span className={styles.logoText}>Deal & Wear</span>
        </Link>
        <DesktopNav />
      </div>
    </header>
  );
}

export default Header;

