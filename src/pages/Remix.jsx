import React from 'react';
import styles from './Remix.module.css';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import DiamondIcon from '@mui/icons-material/Diamond';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

const Remix = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <CloseIcon className={styles.iconBtn} />
        <div className={styles.title}>
          <AutoFixHighIcon fontSize="small" style={{ color: 'var(--color-primary)' }} /> Remix Mode
        </div>
        <RefreshIcon className={styles.iconBtn} />
      </header>
      
      <div className={styles.remixCanvas}>
        {/* Mock representation of the model */}
        <div className={styles.modelPlaceholder}>
          <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop" alt="Model" className={styles.modelImg} />
        </div>
        
        <div className={styles.overlayInstruction}>
          <div className={styles.instructionBadge}>Tap any item to swap it</div>
        </div>

        {/* Hotspots */}
        <div className={`${styles.hotspot} ${styles.blazerPos}`}>
          <div className={styles.bubble}><CheckroomIcon /></div>
          <span className={styles.label}>Blazer</span>
        </div>
        
        <div className={`${styles.hotspot} ${styles.jewelryPos}`}>
          <div className={`${styles.bubble} ${styles.activeBubble}`}><DiamondIcon /></div>
          <span className={styles.label}>Jewelry</span>
        </div>
        
        <div className={`${styles.hotspot} ${styles.topPos}`}>
          <div className={styles.bubble}><CheckroomIcon /></div>
          <span className={styles.label}>Top</span>
        </div>
        
        <div className={`${styles.hotspot} ${styles.pantsPos}`}>
          <div className={styles.bubble}><PersonOutlineIcon /></div>
          <span className={styles.label}>Pants</span>
        </div>

        <div className={`${styles.hotspot} ${styles.bagPos}`}>
          <div className={styles.bubble}><LocalMallIcon /></div>
          <span className={styles.label}>Bag</span>
        </div>

        <div className={`${styles.hotspot} ${styles.shoesPos}`}>
          <div className={styles.bubble}><DirectionsWalkIcon /></div>
          <span className={styles.label}>Shoes</span>
        </div>
      </div>
      
      <div className={styles.actionFooter}>
        <button className={styles.previewBtn}>
          <VisibilityIcon fontSize="small" /> Preview
        </button>
        <button className={styles.saveBtn}>
          <BookmarkBorderIcon fontSize="small" /> Save Remix
        </button>
      </div>
    </div>
  );
};

export default Remix;
