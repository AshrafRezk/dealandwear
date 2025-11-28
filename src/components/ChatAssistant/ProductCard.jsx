import { useState } from 'react';
import styles from './ProductCard.module.css';
import { hapticSelect } from '../../utils/haptics';

function ProductCard({ product, onClick }) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleClick = () => {
    hapticSelect();
    if (product.link) {
      window.open(product.link, '_blank', 'noopener,noreferrer');
    }
    onClick?.(product);
  };

  const formatPrice = (price, currency = 'EGP') => {
    if (!price) return 'Price not available';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return `${numPrice.toLocaleString()} ${currency}`;
  };

  return (
    <div className={styles.productCard} onClick={handleClick}>
      <div className={styles.imageContainer}>
        {!imageError && product.image ? (
          <img 
            src={product.image} 
            alt={product.title}
            className={styles.productImage}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className={styles.imageFallback}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V6H20V18Z" fill="currentColor"/>
              <path d="M8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
            </svg>
          </div>
        )}
      </div>
      <div className={styles.productInfo}>
        <h4 className={styles.productTitle} title={product.title}>
          {product.title}
        </h4>
        <div className={styles.productMeta}>
          <p className={styles.productPrice}>
            {formatPrice(product.price, product.currency)}
          </p>
          <span className={styles.storeBadge}>{product.store}</span>
        </div>
        {product.availability && (
          <p className={styles.availability}>{product.availability}</p>
        )}
      </div>
    </div>
  );
}

export default ProductCard;

