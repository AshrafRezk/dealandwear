/// <reference types="vitest/config" />
import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const manifest = {
  id: '/',
  name: 'Find Your Fit',
  short_name: 'Find Your Fit',
  description: "Discover your Style DNA and shop Egypt's best local makers and global houses, matched to your taste.",
  lang: 'en',
  dir: 'auto',
  theme_color: '#F8F5EF',
  background_color: '#F8F5EF',
  display: 'standalone',
  display_override: ['standalone', 'minimal-ui'],
  orientation: 'portrait',
  scope: '/',
  start_url: '/?source=pwa',
  categories: ['shopping', 'lifestyle'],
  screenshots: [
    { src: '/screenshots/mobile-home.png', sizes: '1080x2400', type: 'image/png', form_factor: 'narrow', label: 'Your edit, matched to your Style DNA' },
    { src: '/screenshots/mobile-quiz.png', sizes: '1080x2400', type: 'image/png', form_factor: 'narrow', label: 'The two-minute style quiz' },
    { src: '/screenshots/desktop-home.png', sizes: '1920x1080', type: 'image/png', form_factor: 'wide', label: 'Find Your Fit on desktop' },
  ],
  icons: [
    { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icons/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'Style quiz', url: '/quiz', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
    { name: 'Search', url: '/search', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
    { name: 'Saved', url: '/saved', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
  ],
};

/**
 * Local development: `SF_DEV_ORG=dealandwear npm run dev` forwards /api/dw/* to that org's Apex REST API
 * using the Salesforce CLI session, so no Connected App secret is needed on a laptop.
 * In production the Netlify function in netlify/functions/proxy.js does this instead.
 */
function salesforceDevProxy() {
  const org = process.env.SF_DEV_ORG;
  if (!org) return undefined;
  const out = JSON.parse(execSync(`sf org display -o ${org} --json`, { encoding: 'utf8' }));
  const { instanceUrl, accessToken } = out.result;
  return {
    '/api/dw': {
      target: instanceUrl,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/dw/, '/services/apexrest/dw/v1'),
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  };
}

export default defineConfig(({ command }) => ({
  server: command === 'serve' ? { proxy: salesforceDevProxy() } : undefined,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest,
      manifestFilename: 'manifest.webmanifest',
      includeAssets: ['favicon.ico', 'favicon-32.png', 'icons/apple-touch-icon.png', 'brand/fyf-mark.png', 'brand/fyf-mark-white.png'],
      workbox: {
        // App shell only: Latin font files (other scripts load on demand), no social/OG images.
        globPatterns: ['**/*.{js,css,html}', 'assets/*-latin-[0-9]*.woff2'],
        globIgnores: ['**/og-image.png', '**/logo.png', '**/screenshots/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/\.netlify\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => request.destination === 'image' && url.hostname === 'cdn.shopify.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fyf-product-images',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 14, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2020',
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          data: ['@tanstack/react-query', 'i18next', 'react-i18next'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
}));
