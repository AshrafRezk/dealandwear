import React, { useState } from 'react';
import styles from './Brands.module.css';
import MapIcon from '@mui/icons-material/Map';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StoreIcon from '@mui/icons-material/Store';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const Brands = () => {
  const [viewMode, setViewMode] = useState('Map');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.backBtn}>←</div>
        <div className={styles.headerTitle}>
          <StoreIcon fontSize="small" style={{ color: '#ff4785' }} /> Local Brands
        </div>
        <div className={styles.filterBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6"/></svg>
        </div>
      </header>

      <div className={styles.locationBar}>
        <div className={styles.locationInfo}>
          <div className={styles.locIcon}><LocationOnIcon style={{ color: '#ff4785' }} /></div>
          <div>
            <h3>Brooklyn, NY</h3>
            <p>Within 5 miles</p>
          </div>
        </div>
        <button className={styles.changeBtn}>Change</button>
      </div>

      <div className={styles.toggleWrapper}>
        <button 
          className={`${styles.toggleBtn} ${viewMode === 'Map' ? styles.activeToggle : ''}`}
          onClick={() => setViewMode('Map')}
        >
          <MapIcon fontSize="small" /> Map
        </button>
        <button 
          className={`${styles.toggleBtn} ${viewMode === 'List' ? styles.activeToggle : ''}`}
          onClick={() => setViewMode('List')}
        >
          <FormatListBulletedIcon fontSize="small" /> List
        </button>
      </div>

      <div className={styles.mapCard}>
        {/* Mock background image of store for 'Studio Minimal' */}
        <div className={styles.mapImageOverlay}></div>
        <div className={styles.distanceBadge}><LocationOnIcon fontSize="small"/> 0.3 mi</div>
        <div className={styles.featuredBadge}>FEATURED</div>
        
        <div className={styles.storeContent}>
          <h2>Studio Minimal</h2>
          <p>Sustainable Fashion House</p>
          <div className={styles.tags}>
            <span>Eco-Friendly</span>
            <span>Local Made</span>
            <span>Women-Owned</span>
          </div>
          
          <div className={styles.storeActions}>
            <button className={styles.followBtn}><AddIcon fontSize="small"/> Follow</button>
            <button className={styles.visitBtn}><StoreIcon fontSize="small"/> Visit</button>
          </div>
        </div>
      </div>

      <div className={styles.dealDrops}>
        <div className={styles.dealHeader}>
          <div>
            <h3>Deal Drops</h3>
            <p>Limited time offers</p>
          </div>
          <div className={styles.timerBadge}>
            <AccessTimeIcon fontSize="small" /> 2h 14m left
          </div>
        </div>
        
        <div className={styles.dealScroller}>
          <div className={styles.dealCard}>
            <div className={styles.discountBadge}>40% OFF</div>
            <div className={styles.itemImageDummy} style={{ background: '#f5f5f5' }}>
               {/* Placeholder for item image */}
               <div style={{ height: '140px' }}></div>
            </div>
            <div className={styles.dealInfo}>
              <h4>Linen Oversized Blazer</h4>
              <p>Studio Minimal</p>
            </div>
          </div>
          <div className={styles.dealCard}>
             <div className={styles.itemImageDummy} style={{ background: '#f5f5f5' }}>
               {/* Placeholder for item image */}
               <div style={{ height: '140px' }}></div>
            </div>
            <div className={styles.dealInfo}>
              <h4>Organic T-Shirt</h4>
              <p>Studio Minimal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brands;
