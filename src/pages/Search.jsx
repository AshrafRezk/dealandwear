import { useState } from 'react';
import { searchProducts } from '../services/productSearch';
import ProductCard from '../components/ChatAssistant/ProductCard';
import styles from './Search.module.css';
import { hapticMessage } from '../utils/haptics';

function Search() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2) {
      setError('Please enter at least 2 characters to search');
      return;
    }

    hapticMessage();
    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await searchProducts(query.trim(), { maxResults: 20 });
      setProducts(results);
      
      if (results.length === 0) {
        setError(`No products found for "${query.trim()}". Try different keywords or be more specific.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred while searching. Please try again.');
      setProducts([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRetry = () => {
    if (query.trim().length >= 2) {
      handleSearch({ preventDefault: () => {} });
    }
  };

  return (
    <div className={styles.searchPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Product Search</h1>
          <p className={styles.subtitle}>
            Search for clothing and fashion products across Egyptian stores
          </p>
        </div>

        <form className={styles.searchForm} onSubmit={handleSearch}>
          <div className={styles.searchInputWrapper}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products... (e.g., blue jeans, dresses, winter jackets)"
              className={styles.searchInput}
              disabled={isSearching}
            />
            <button
              type="submit"
              className={styles.searchButton}
              disabled={isSearching || !query.trim() || query.trim().length < 2}
            >
              {isSearching ? (
                <div className={styles.spinner}></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </form>

        {isSearching && (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Searching across stores...</p>
          </div>
        )}

        {error && !isSearching && (
          <div className={styles.errorState}>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryButton} onClick={handleRetry}>
              Retry Search
            </button>
          </div>
        )}

        {!isSearching && !error && hasSearched && products.length > 0 && (
          <div className={styles.resultsSection}>
            <div className={styles.resultsHeader}>
              <h2 className={styles.resultsTitle}>
                Found {products.length} product{products.length > 1 ? 's' : ''} for "{query}"
              </h2>
            </div>
            <div className={styles.productsGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => console.log('Product clicked:', product.title)}
                />
              ))}
            </div>
          </div>
        )}

        {!isSearching && !error && hasSearched && products.length === 0 && (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V6H20V18Z" fill="currentColor" opacity="0.3"/>
              <path d="M8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor" opacity="0.3"/>
            </svg>
            <p className={styles.emptyMessage}>No products found</p>
            <p className={styles.emptySubtext}>
              Try using different keywords or be more specific in your search
            </p>
          </div>
        )}

        {!hasSearched && !isSearching && (
          <div className={styles.initialState}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
              <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
            </svg>
            <p className={styles.initialMessage}>Start searching for products</p>
            <p className={styles.initialSubtext}>
              Enter a product name, style, or description above to find items across Egyptian stores
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
