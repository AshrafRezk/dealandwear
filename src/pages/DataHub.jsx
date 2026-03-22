import React, { useState } from 'react';
import styles from './DataHub.module.css';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShareIcon from '@mui/icons-material/Share';

const DataHub = () => {
  const [activeTab, setActiveTab] = useState('7 Days');
  const tabs = ['7 Days', '30 Days', '3 Months', 'Year'];

  return (
    <div className={styles.container}>
      <div className={styles.headerArea}>
        <div className={styles.headerTop}>
          <div className={styles.titleGroup}>
            <div className={styles.iconWrapper}><WhatshotIcon /></div>
            <div>
              <h1 className={styles.title}>Data Hub</h1>
              <p className={styles.subtitle}>Your Style Analytics</p>
            </div>
          </div>
          <button className={styles.moreBtn}><MoreVertIcon /></button>
        </div>
        
        <div className={styles.tabsScroller}>
          {tabs.map(tab => (
            <button 
              key={tab} 
              className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.cardPink}`}>
          <div className={styles.statHeader}>
            <WhatshotIcon className={styles.statIcon} />
            <span>Total Swipes</span>
          </div>
          <div className={styles.statValue}>2,847</div>
          <div className={styles.statTrend}>↑ +23% vs last week</div>
        </div>

        <div className={`${styles.statCard} ${styles.cardGreen}`}>
          <div className={styles.statHeader}>
            <FavoriteIcon className={styles.statIcon} />
            <span>Liked Outfits</span>
          </div>
          <div className={styles.statValue}>1,423</div>
          <div className={styles.statTrend}>↑ +18% vs last week</div>
        </div>

        <div className={`${styles.statCard} ${styles.cardBlue}`}>
          <div className={styles.statHeader}>
            <BookmarkIcon className={styles.statIcon} />
            <span>Saved Items</span>
          </div>
          <div className={styles.statValue}>487</div>
          <div className={styles.statTrend}>↑ +31% vs last week</div>
        </div>

        <div className={`${styles.statCard} ${styles.cardOrange}`}>
          <div className={styles.statHeader}>
            <AttachMoneyIcon className={styles.statIcon} />
            <span>Total Savings</span>
          </div>
          <div className={styles.statValue}>$2.4K</div>
          <div className={styles.statTrend}>↑ +42% vs last month</div>
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartHeader}>
          <div>
            <h2 className={styles.chartTitle}>Swipe-to-Like Ratio</h2>
            <p className={styles.chartSubtitle}>Your style preference trend</p>
          </div>
          <button className={styles.shareBtn}><ShareIcon fontSize="small" /></button>
        </div>
        
        <div className={styles.chartPlaceholder}>
          {/* Simple CSS-based mock line chart */}
          <div className={styles.gridLines}>
            <span>100</span><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span>
          </div>
          <svg className={styles.svgChart} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,55 L15,52 L30,48 L45,50 L60,47 L75,51 L100,50" fill="none" stroke="#ff4785" strokeWidth="2" />
            <path d="M0,55 L15,52 L30,48 L45,50 L60,47 L75,51 L100,50 L100,100 L0,100 Z" fill="rgba(255, 71, 133, 0.1)" />
          </svg>
          <div className={styles.xAxis}>
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataHub;
