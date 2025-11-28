import styles from './MessageBubble.module.css';
import BrandCard from './BrandCard';
import { brands } from '../../data/brands';

function MessageBubble({ message, isUser }) {
  const renderContent = () => {
    if (message.type === 'brands' && message.brands) {
      return (
        <div className={styles.brandsContainer}>
          {message.brands.map((brandId) => {
            const brand = brands.find(b => b.id === brandId);
            return brand ? (
              <BrandCard 
                key={brand.id} 
                brand={brand}
                onClick={() => console.log('Brand clicked:', brand.name)}
              />
            ) : null;
          })}
        </div>
      );
    }

    if (message.options && message.options.length > 0) {
      return (
        <div className={styles.optionsContainer}>
          {message.options.map((option, index) => (
            <button
              key={index}
              className={styles.optionButton}
              onClick={() => message.onOptionClick?.(option)}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    return <p className={styles.text}>{message.text}</p>;
  };

  return (
    <div className={`${styles.messageBubble} ${isUser ? styles.user : styles.ai}`}>
      {!isUser && <div className={styles.avatar}>🤖</div>}
      <div className={styles.content}>
        {renderContent()}
        {message.timestamp && (
          <span className={styles.timestamp}>{message.timestamp}</span>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;

