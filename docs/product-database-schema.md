# Product Database Schema

## Overview
This document outlines the database schema for storing product data, enabling caching, price tracking, and advanced features.

## Recommended Database Options

### Option 1: Supabase (PostgreSQL) - RECOMMENDED
- Free tier: 500MB database, 2GB bandwidth
- Real-time subscriptions
- Built-in authentication
- Easy to set up

### Option 2: Firebase Firestore
- Free tier: 1GB storage, 50K reads/day
- NoSQL, flexible schema
- Real-time updates
- Good for simple queries

### Option 3: Upstash Redis
- Free tier: 10K commands/day
- Fast caching
- Good for temporary data
- Can combine with Supabase for persistent storage

## Database Schema (PostgreSQL/Supabase)

### Table: `products`

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) UNIQUE, -- ID from source (store, API, etc.)
  title VARCHAR(500) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'EGP',
  original_price DECIMAL(10, 2), -- For tracking price changes
  image_url TEXT,
  product_url TEXT NOT NULL,
  store_id VARCHAR(100) NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  brand VARCHAR(100),
  availability VARCHAR(50) DEFAULT 'In Stock',
  size VARCHAR(50),
  color VARCHAR(50),
  source VARCHAR(50) NOT NULL, -- 'scraping', 'api', 'affiliate', 'google', 'mock'
  search_keywords TEXT[], -- Array of keywords for search
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(), -- When last found in search
  is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_keywords ON products USING GIN(search_keywords);
CREATE INDEX idx_products_updated ON products(updated_at);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;

-- Full-text search index
CREATE INDEX idx_products_search ON products USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);
```

### Table: `product_prices` (Price History)

```sql
CREATE TABLE product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EGP',
  recorded_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(50) -- Where price was found
);

CREATE INDEX idx_product_prices_product ON product_prices(product_id);
CREATE INDEX idx_product_prices_recorded ON product_prices(recorded_at);
```

### Table: `search_cache`

```sql
CREATE TABLE search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA256 hash of query
  query_text VARCHAR(500) NOT NULL,
  products JSONB NOT NULL, -- Array of product IDs or full product data
  source VARCHAR(50), -- Where results came from
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  hit_count INTEGER DEFAULT 0
);

CREATE INDEX idx_search_cache_hash ON search_cache(query_hash);
CREATE INDEX idx_search_cache_expires ON search_cache(expires_at);
```

### Table: `stores`

```sql
CREATE TABLE stores (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  base_url TEXT NOT NULL,
  search_url_template TEXT,
  api_endpoint TEXT,
  affiliate_program_url TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority = search first
  last_scraped_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Notes

### Product Deduplication
- Use `external_id` + `store_id` as unique identifier
- Compare titles using similarity (Levenshtein distance)
- Merge products from different sources if they match

### Caching Strategy
- Cache search results for 6 hours
- Cache individual products for 24 hours
- Use Redis for hot cache, PostgreSQL for persistent storage

### Price Tracking
- Record price changes daily
- Alert users if price drops >10%
- Show price history graph

### Search Optimization
- Pre-compute search keywords from title/description
- Use full-text search for fast queries
- Cache popular searches

## Migration Path

1. **Phase 1**: Use localStorage cache (current implementation)
2. **Phase 2**: Add Supabase for persistent storage
3. **Phase 3**: Implement price tracking
4. **Phase 4**: Add advanced features (wishlist, alerts, etc.)

## Example Queries

### Search Products
```sql
SELECT * FROM products
WHERE is_active = true
  AND (
    title ILIKE '%dress%'
    OR search_keywords && ARRAY['dress', 'clothing']
    OR to_tsvector('english', title) @@ plainto_tsquery('english', 'dress')
  )
ORDER BY updated_at DESC
LIMIT 20;
```

### Get Price History
```sql
SELECT price, recorded_at
FROM product_prices
WHERE product_id = $1
ORDER BY recorded_at DESC
LIMIT 30;
```

### Clear Expired Cache
```sql
DELETE FROM search_cache
WHERE expires_at < NOW();
```

