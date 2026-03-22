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
  const { userProfile } = useAuth();
  const [viewMode, setViewMode] = useState('Map');
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState('Locating...');
  const [coords, setCoords] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

// const radius = 5;


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
      const res = await axios.get(url);
      if (res.data.ok) {
        let fetchedBrands = res.data.data.brands;

        if (userProfile?.shopperGender && userProfile.shopperGender !== 'Prefer_Not_to_Say') {
          const gender = userProfile.shopperGender;
          
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
        <div className={styles.filterBtn}>
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


      <div className={styles.toggleWrapper} style={{ marginBottom: '1rem' }}>
        <button 
          className={`${styles.toggleBtn} ${viewMode === 'Map' ? styles.activeToggle : ''}`}
          onClick={() => setViewMode('Map')}
        >
          <MapIcon fontSize="small" /> Map
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

      {loading && <div style={{ padding: '2rem', textAlign: 'center' }}>Loading brands...</div>}
      {error && <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>}

      {!loading && !error && brands
        .filter(brand => {
          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase();
          const brandMatch = brand.name.toLowerCase().includes(term);
          const productMatch = brand.products?.some(p => p.name.toLowerCase().includes(term));
          return brandMatch || productMatch;
        })
        .map((brand) => (

        <div key={brand.accountId} style={{ marginBottom: '2.5rem' }}>
          <div className={styles.mapCard}>
            <div className={styles.mapImageOverlay}></div>
            {brand.distanceMiles && (
              <div className={styles.distanceBadge}><LocationOnIcon fontSize="small"/> {brand.distanceMiles} mi</div>
            )}
            {brand.featured && <div className={styles.featuredBadge}>FEATURED</div>}
            
            <div className={styles.storeContent}>
              <h2>{brand.name}</h2>
              <p>{brand.tagline}</p>
              <div className={styles.tags}>
                {brand.tags?.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              
              <div className={styles.storeActions}>
                <button className={styles.followBtn}><AddIcon fontSize="small"/> Follow</button>
                <a 
                  href={brand.visitUrl || brand.instagramUrl || brand.website || '#'} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={styles.visitBtn} 
                  style={{ textDecoration: 'none' }}
                >
                  <StoreIcon fontSize="small"/> Visit
                </a>
              </div>
            </div>
          </div>

          {brand.products && brand.products.length > 0 && (
            <div className={styles.dealDrops}>
              <div className={styles.dealHeader}>
                <div>
                  <h3>Deal Drops</h3>
                  <p>From {brand.name}</p>
                </div>
              </div>
              
              <div className={styles.dealScroller}>
                {brand.products.map((product) => (
                  <div key={product.productId} className={styles.dealCard}>
                    <div 
                      className={styles.itemImageDummy} 
                      style={{ 
                        background: '#f5f5f5', 
                        backgroundImage: `url(${product.imageUrl1})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                       <div style={{ height: '140px' }}></div>
                    </div>
                    <div className={styles.dealInfo}>
                      <h4>{product.name}</h4>
                      <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginTop: '0.25rem' }}>{product.currentPrice} EGP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Brands;
