import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { filterRelevantProducts, isBrandRelevant } from '../utils/genderFilter';
import styles from './Brands.module.css';
import MapIcon from '@mui/icons-material/Map';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StoreIcon from '@mui/icons-material/Store';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const Brands = () => {
  const { userProfile, userToken } = useAuth();
  const [viewMode, setViewMode] = useState('List');
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState('Locating...');
  const [coords, setCoords] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    gender: '',
    vertical: ''
  });




  useEffect(() => {
    // 1. Get Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });

          // 2. Reverse geocode to get city name
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown Area';
            const state = data.address?.state || data.address?.country || '';
            setLocationName(`${city}${state ? `, ${state}` : ''}`);
          } catch (e) {
            setLocationName('Current Location');
          }
        },
        (err) => {
          console.error("Geolocation error", err);
          setLocationName('Location Access Denied');
          // Fetch brands without geo if denied
          fetchBrands();
        }
      );
    } else {
      setLocationName('Location Not Supported');
      fetchBrands();
    }
  }, []);

  useEffect(() => {
    if (coords) {
      fetchBrands(coords.lat, coords.lng);
    }
  }, [coords]);


  const fetchBrands = async (lat, lng) => {
    setLoading(true);
    try {
      let url = '/api/dw/brands';
      if (lat && lng) {
        url += `?lat=${lat}&lng=${lng}`;
      }
      let res;
      try {
        res = await axios.get(url, {
          headers: userToken ? { 'X-DW-Token': userToken } : {}
        });
      } catch (authErr) {
        console.warn('Authenticated brands fetch failed, falling back to guest fetch', authErr);
        // Fallback for case where personalization logic crashes (e.g. Apex heap limits)
        if (userToken) {
          res = await axios.get(url);
        } else {
          throw authErr;
        }
      }

      if (res && res.data.ok) {
        let fetchedBrands = res.data.data.brands;

        if ((userProfile?.shopperGender && userProfile.shopperGender !== 'Prefer_Not_to_Say') || filters.gender) {
          const gender = filters.gender || userProfile.shopperGender;
          
          fetchedBrands = fetchedBrands.map(brand => {
            const filteredProducts = filterRelevantProducts(brand.products || [], gender);
            const hasMatch = filteredProducts.length > 0;
            const relevantBrand = isBrandRelevant(brand, gender);
            return { ...brand, products: filteredProducts, _relevance: (hasMatch || relevantBrand) ? 1 : 0 };
          });

          // Sort brands: brands with relevant products first
          fetchedBrands.sort((a, b) => b._relevance - a._relevance);
        }


        setBrands(fetchedBrands);
      } else {
        setError(res.data.error?.message || 'Failed to load brands');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.backBtn} onClick={() => window.history.back()}>←</div>
        <div className={styles.headerTitle}>
          <StoreIcon fontSize="small" style={{ color: 'var(--color-primary)' }} /> Local Brands
        </div>
        <div className={styles.filterBtn} onClick={() => setIsFilterOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6"/></svg>
        </div>
      </header>

      <div className={styles.locationBar}>
        <div className={styles.locationInfo}>
          <div className={styles.locIcon}><LocationOnIcon style={{ color: 'var(--color-primary)' }} /></div>
          <div>
            <h3>{locationName}</h3>
            <p>All Local Brands</p>
          </div>
        </div>
        <button className={styles.changeBtn} onClick={() => alert('Location change coming soon!')}>Change</button>
      </div>
      <div className={styles.toggleWrapper}>
        <button 
          className={`${styles.toggleBtn} ${viewMode === 'Map' ? styles.activeToggle : ''}`}
          onClick={() => setViewMode('Map')}
        >
          <MapIcon fontSize="small" /> Map <span className={styles.comingSoon}>Coming Soon</span>
        </button>
        <button 
          className={`${styles.toggleBtn} ${viewMode === 'List' ? styles.activeToggle : ''}`}
          onClick={() => setViewMode('List')}
        >
          <FormatListBulletedIcon fontSize="small" /> List 
        </button>
      </div>

      <div className={styles.searchContainer}>
        <input 
          type="text" 
          placeholder="Search products or brands..." 
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          Searching for local gems...
        </div>
      )}

      {!loading && !error && brands
        .filter(brand => {
          // 1. Search term filter
          const term = searchTerm.toLowerCase();
          const brandMatch = !searchTerm || brand.name.toLowerCase().includes(term);
          const productMatch = !searchTerm || brand.products?.some(p => p.name.toLowerCase().includes(term));
          
          // 2. Vertical filter
          const verticalMatch = !filters.vertical || brand.vertical === filters.vertical;

          return (brandMatch || productMatch) && verticalMatch;
        })
        .map((brand) => (
          <div key={brand.accountId} className={styles.brandSection}>
            <div className={styles.brandHeader}>
              <div className={styles.brandMainInfo}>
                {brand.logoUrl ? (
                  <div className={styles.brandLogo}>
                    <img src={brand.logoUrl} alt={brand.name} className={styles.logoImg} />
                  </div>
                ) : (
                  <div className={styles.brandLogo}>
                    <StoreIcon style={{ color: 'var(--color-primary)', fontSize: '2rem' }} />
                  </div>
                )}
                <div className={styles.brandMeta}>
                  <h2>{brand.name}</h2>
                  <p>{brand.tagline || 'Local Boutique'}</p>
                  <div className={styles.brandBadges}>
                    {brand.vertical && (
                      <span className={`${styles.badge} ${styles.verticalBadge}`}>
                        {brand.vertical.replace('_', ' ')}
                      </span>
                    )}
                    {brand.distanceMiles && (
                      <span className={`${styles.badge} ${styles.distanceBadgeSmall}`}>
                        {parseFloat(brand.distanceMiles).toFixed(1)} miles away
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                className={styles.visitBtnSmall}
                onClick={() => brand.visitUrl && window.open(brand.visitUrl, '_blank')}
              >
                Visit
              </button>
            </div>

            {brand.products && brand.products.length > 0 && (
              <div className={styles.productSection}>
                <div className={styles.sectionTitle}>
                  <span>Popular Items</span>
                  <span className={styles.viewAllLink} onClick={() => brand.visitUrl && window.open(brand.visitUrl, '_blank')}>
                    View All →
                  </span>
                </div>
                <div className={styles.productScroller}>
                  {brand.products
                    .filter(product => {
                      const price = parseFloat(product.currentPrice);
                      const minMatch = !filters.minPrice || price >= parseFloat(filters.minPrice);
                      const maxMatch = !filters.maxPrice || price <= parseFloat(filters.maxPrice);
                      return minMatch && maxMatch;
                    })
                    .map((product) => (
                      <div key={product.productId} className={styles.productCard}>
                        <img 
                          src={product.imageUrl1 || '/placeholder-product.png'} 
                          alt={product.name} 
                          className={styles.productImage}
                        />
                        <div className={styles.productInfo}>
                          <h4 className={styles.productName}>{product.name}</h4>
                          <span className={styles.productPrice}>{product.currentPrice} EGP</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}

      {/* Filter Drawer */}
      <div 
        className={`${styles.drawerOverlay} ${isFilterOpen ? styles.open : ''}`} 
        onClick={() => setIsFilterOpen(false)}
      ></div>
      <div className={`${styles.drawer} ${isFilterOpen ? styles.open : ''}`}>
        <div className={styles.drawerHeader}>
          <h2>Filters</h2>
          <div className={styles.closeBtn} onClick={() => setIsFilterOpen(false)}>×</div>
        </div>

        <div className={styles.filterGroup}>
          <label>Price Range (EGP)</label>
          <div className={styles.priceInputs}>
            <input 
              type="number" 
              placeholder="Min" 
              className={styles.priceInput}
              value={filters.minPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
            />
            <span>-</span>
            <input 
              type="number" 
              placeholder="Max" 
              className={styles.priceInput}
              value={filters.maxPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label>Gender Override</label>
          <div className={styles.chipGroup}>
            {['Men', 'Women', 'Unisex'].map(g => (
              <div 
                key={g} 
                className={`${styles.chip} ${filters.gender === g ? styles.active : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, gender: prev.gender === g ? '' : g }))}
              >
                {g}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label>Category</label>
          <div className={styles.chipGroup}>
            {['Retail_Fashion', 'Home_Decor', 'Accessories'].map(v => (
              <div 
                key={v} 
                className={`${styles.chip} ${filters.vertical === v ? styles.active : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, vertical: prev.vertical === v ? '' : v }))}
              >
                {v.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button 
            className={styles.applyBtn} 
            style={{ flex: 1 }}
            onClick={() => setIsFilterOpen(false)}
          >
            Apply Filters
          </button>
          <button 
            className={styles.applyBtn} 
            style={{ flex: 1, background: '#eee', color: '#333' }}
            onClick={() => {
              setFilters({ minPrice: '', maxPrice: '', gender: '', vertical: '' });
              setIsFilterOpen(false);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default Brands;
