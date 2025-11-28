import styles from './MessageBubble.module.css';
import BrandCard from './BrandCard';
import ProductCard from './ProductCard';
import { brands } from '../../data/brands';
import { hapticSelect } from '../../utils/haptics';

function MessageBubble({ message, isUser }) {
  const renderContent = () => {
    const content = [];

    // Render main text if present
    if (message.text) {
      content.push(
        <p key="text" className={styles.text}>{message.text}</p>
      );
    }

    // Render list if present
    if (message.list && message.list.items && message.list.items.length > 0) {
      const listItems = message.list.items.map((item, index) => (
        <li key={index} className={styles.listItem}>{item}</li>
      ));
      content.push(
        <ul 
          key="list" 
          className={`${styles.list} ${message.list.type === 'numbered' ? styles.numbered : ''}`}
        >
          {listItems}
        </ul>
      );
    }

    // Render recommendations if present
    if (message.recommendations && message.recommendations.length > 0) {
      content.push(
        <div key="recommendations" className={styles.recommendationsContainer}>
          {message.recommendations.map((rec, index) => (
            <div key={index} className={styles.recommendation}>
              {rec.title && <h4 className={styles.recommendationTitle}>{rec.title}</h4>}
              {rec.description && <p className={styles.recommendationDescription}>{rec.description}</p>}
              {rec.items && rec.items.length > 0 && (
                <ul className={styles.recommendationItems}>
                  {rec.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Render products if present
    if (message.type === 'products' && message.products) {
      content.push(
        <div key="products" className={styles.productsContainer}>
          {message.products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product}
              onClick={() => console.log('Product clicked:', product.title)}
            />
          ))}
        </div>
      );
    }

    // Render brands if present
    if (message.type === 'brands' && message.brands) {
      content.push(
        <div key="brands" className={styles.brandsContainer}>
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

    // Render options if present
    if (message.options && message.options.length > 0) {
      content.push(
        <div key="options" className={styles.optionsContainer}>
          {message.options.map((option, index) => (
            <button
              key={index}
              className={styles.optionButton}
              onClick={() => {
                hapticSelect();
                message.onOptionClick?.(option);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    // If no content, return empty
    if (content.length === 0) {
      return <p className={styles.text}>...</p>;
    }

    return <>{content}</>;
  };

  // Check if this is a search result message
  const isSearchResult = message.type === 'products' && message.products;

  return (
    <div className={`${styles.messageBubble} ${isUser ? styles.user : styles.ai} ${isSearchResult ? styles.searchResult : ''}`}>
      {!isUser && <div className={styles.avatar}>A</div>}
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

