import React from 'react';
import { useSwipe } from '../../hooks/useSwipe';
import styles from './SwipeCard.module.css';

export const SwipeCard = ({ item, onSwipeRight, onSwipeLeft, style, isTop }) => {
  const { offset, isSwiping, bind } = useSwipe({
    onSwipeRight: () => onSwipeRight(item),
    onSwipeLeft: () => onSwipeLeft(item),
    threshold: 120
  });

  const cardStyle = {
    ...style,
    transform: isTop 
      ? `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * 0.05}deg)`
      : 'scale(0.95) translateY(20px)',
    transition: isSwiping ? 'none' : 'transform 0.4s ease-out, opacity 0.4s ease-out',
    zIndex: isTop ? 10 : 5,
    opacity: isTop ? 1 : 0.6,
  };

  return (
    <div 
      className={styles.card} 
      style={cardStyle}
      {...(isTop ? bind : {})}
    >
      <img src={item.imageUrl} alt={item.name} className={styles.image} draggable={false} />
      <div className={styles.overlay}>
        <div className={styles.details}>
          <div className={styles.tags}>{item.tags?.join(' • ') || 'New Arrival'}</div>
          <h2 className={styles.name}>{item.name}</h2>
          <p className={styles.price}>${item.price}</p>
        </div>
      </div>
      
      {/* Visual indicators for Left/Right swipe intent */}
      {isTop && offset.x > 50 && (
        <div className={`${styles.stamp} ${styles.like}`}>LIKE</div>
      )}
      {isTop && offset.x < -50 && (
        <div className={`${styles.stamp} ${styles.nope}`}>PASS</div>
      )}
    </div>
  );
};
