import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import styles from './DataHub.module.css';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShareIcon from '@mui/icons-material/Share';

const DataHub = () => {
  const { userProfile, userToken, fetchProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('7 Days');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    birthdate: '',
    shopperGender: 'Prefer_Not_to_Say'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const tabs = ['7 Days', '30 Days', '3 Months', 'Year'];

  const handleEditClick = () => {
    setFormData({
      birthdate: userProfile?.birthdate ? userProfile.birthdate.split('T')[0] : '',
      shopperGender: userProfile?.shopperGender || 'Prefer_Not_to_Say'
    });
    setMessage(null);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data } = await axios.patch('/api/dw/me', formData, {
        headers: { 'X-DW-Token': userToken }
      });
      if (data.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        fetchProfile(userToken);
        setTimeout(() => setIsEditingProfile(false), 2000);
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to update profile' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerArea}>
        <div className={styles.headerTop}>
          <div className={styles.titleGroup}>
            <div className={styles.iconWrapper}><WhatshotIcon /></div>
            <div>
              <h1 className={styles.title}>{userProfile ? `Welcome, ${userProfile.firstName || 'User'}` : 'Data Hub'}</h1>
              <p className={styles.subtitle}>Your Style Analytics</p>
            </div>
          </div>
          <button className={styles.moreBtn} onClick={handleEditClick}>
            Edit Profile
          </button>
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
            <path d="M0,55 L15,52 L30,48 L45,50 L60,47 L75,51 L100,50" fill="none" stroke="var(--color-primary)" strokeWidth="2" />
            <path d="M0,55 L15,52 L30,48 L45,50 L60,47 L75,51 L100,50 L100,100 L0,100 Z" fill="var(--color-primary-alpha)" />
          </svg>
          <div className={styles.xAxis}>
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
      </div>

      {isEditingProfile && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Edit Profile</h2>
            
            {message && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div className={styles.formGroup}>
                <label>Birth Date</label>
                <input 
                  type="date"
                  className={styles.formInput}
                  value={formData.birthdate}
                  onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Gender</label>
                <select 
                  className={styles.formInput}
                  value={formData.shopperGender}
                  onChange={(e) => setFormData({...formData, shopperGender: e.target.value})}
                >
                  <option value="Prefer_Not_to_Say">Prefer Not to Say</option>
                  <option value="Women">Women</option>
                  <option value="Men">Men</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsEditingProfile(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataHub;
