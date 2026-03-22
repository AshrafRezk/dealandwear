import React from 'react';
import { NavLink } from 'react-router-dom';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import styles from './BottomNav.module.css';

const BottomNav = () => {
  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navItem} ${styles.active}` : styles.navItem;
  };

  return (
    <nav className={styles.bottomNav}>
      <NavLink to="/swipe" className={getNavLinkClass}>
        <WhatshotIcon />
        <span>Swipe</span>
      </NavLink>
      
      <NavLink to="/stories" className={getNavLinkClass}>
        <PlayCircleOutlineIcon />
        <span>Stories</span>
      </NavLink>
      
      <NavLink to="/saved" className={getNavLinkClass}>
        <BookmarkBorderIcon />
        <span>Saved</span>
      </NavLink>
      
      <NavLink to="/brands" className={getNavLinkClass}>
        <StorefrontIcon />
        <span>Brands</span>
      </NavLink>
      
      <NavLink to="/datahub" className={getNavLinkClass}>
        <PersonOutlineIcon />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
