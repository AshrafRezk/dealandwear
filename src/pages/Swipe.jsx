import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { SwipeCard } from '../components/SwipeCard/SwipeCard';
import styles from './Swipe.module.css';

const Swipe = () => {
  const { userToken, userProfile } = useAuth();
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(true);

  useEffect(() => {
    fetchDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDeck = async () => {
    try {
      setLoading(true);
      let url = '/api/dw/swipe/deck';
      if (userProfile?.shopperGender && userProfile.shopperGender !== 'Prefer_Not_to_Say') {
        url += `?genderAudience=${userProfile.shopperGender}`;
      }
      const res = await axios.get(url, {
        headers: { 'X-DW-Token': userToken }
      });
      if (res.data.ok) {
        const payload = res.data.data;
        let finalDeck = [];
        if (Array.isArray(payload)) finalDeck = payload;
        else if (Array.isArray(payload?.items)) finalDeck = payload.items;
        else if (Array.isArray(payload?.deck)) finalDeck = payload.deck;
        else if (payload) finalDeck = [payload];
        
        console.log('Swipe Deck Loaded:', finalDeck);
        setDeck(finalDeck);
      } else {
        setError(res.data.error?.message || 'Failed to load deck');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const recordSwipe = async (productId, direction) => {
    try {
      await axios.post('/api/dw/swipe', {
        productId,
        direction // 'RIGHT' or 'LEFT'
      }, {
        headers: { 'X-DW-Token': userToken }
      });
    } catch (e) {
      console.error('Failed to record swipe', e);
    }
  };

  const handleSwipeRight = (item) => {
    recordSwipe(item.id, 'RIGHT');
    removeCard();
  };

  const handleSwipeLeft = (item) => {
    recordSwipe(item.id, 'LEFT');
    removeCard();
  };

  const removeCard = () => {
    setDeck((prev) => prev.slice(1));
  };

  const handleFinalize = async () => {
    try {
      await axios.post('/api/dw/swipe/finalize', {}, {
        headers: { 'X-DW-Token': userToken }
      });
      // Perhaps fetch next deck or navigate to DataHub
      fetchDeck();
    } catch (e) {
      console.error('Finalize error', e);
    }
  };

  if (loading && deck.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Loading your personalized deck...</div>
      </div>
    );
  }

  if (error && deck.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Oops!</h2>
          <p>{error}</p>
          <button onClick={fetchDeck} className={styles.refreshBtn}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Train your style</h1>
        <div className={styles.modeTabs}>
          <span className={styles.activeTab}>Minimal</span>
          <span className={styles.tab}>Casual</span>
        </div>
        <div className={styles.counter}>{deck.length}</div>
      </header>
      
      <div className={styles.deckContainer}>
        {deck.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>You've caught up!</h2>
            <p>We're calculating your new style persona based on your choices.</p>
            <button onClick={handleFinalize} className={styles.refreshBtn}>Compute Persona</button>
          </div>
        ) : (
          deck.map((item, index) => {
            // Only render top 2 cards for performance and stacking visuals
            if (index > 1) return null;
            
            return (
              <SwipeCard
                key={item.id}
                item={item}
                isTop={index === 0}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
              />
            );
          }).reverse() // Reverse so index 0 is on top in stacking context
        )}

        {showTutorial && deck.length > 0 && (
          <div className={styles.tutorialOverlay}>
            <div className={styles.tutorialContent}>
              <div className={styles.handIcon}>👆</div>
              <h2>Swipe to train</h2>
              <p>Swipe right on outfits you love.<br/>Swipe left to pass.</p>
              <button onClick={() => setShowTutorial(false)} className={styles.gotItBtn}>
                Got it
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={() => {
          if (deck[0]) handleSwipeLeft(deck[0]);
        }}>✕</button>
        <button className={`${styles.actionBtn} ${styles.likeBtn}`} onClick={() => {
          if (deck[0]) handleSwipeRight(deck[0]);
        }}>♥</button>
      </div>
    </div>
  );
};

export default Swipe;
