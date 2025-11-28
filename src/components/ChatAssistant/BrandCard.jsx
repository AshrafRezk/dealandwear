import { useState } from 'react';
import styles from './BrandCard.module.css';
import { brandEmojis } from '../../data/brands';
import { hapticSelect } from '../../utils/haptics';

function BrandCard({ brand, onClick }) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleClick = () => {
    hapticSelect();
    onClick?.();
  };

  return (
    <div className={styles.brandCard} onClick={handleClick}>
      <div className={styles.logoContainer}>
        {!imageError ? (
          <img 
            src={brand.logo} 
            alt={brand.name}
            className={styles.logo}
            onError={handleImageError}
          />
        ) : (
          <div className={styles.logoFallback}>
            {brandEmojis[brand.name] || brand.name.charAt(0)}
          </div>
        )}
      </div>
      <div className={styles.info}>
        <h4 className={styles.name}>{brand.name}</h4>
        <p className={styles.category}>{brand.category}</p>
        <p className={styles.price}>{brand.priceRange}</p>
      </div>
    </div>
  );
}

export default BrandCard;

