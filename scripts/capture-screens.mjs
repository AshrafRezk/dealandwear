#!/usr/bin/env node
/**
 * Captures install-dialog screenshots (public/screenshots) and handbook images (../docs/handbook/assets).
 * Needs the dev server on a real org:  SF_DEV_ORG=<alias> npx vite --port 5179
 * Then:  node scripts/capture-screens.mjs [baseUrl]
 */
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const base = process.argv[2] || 'http://localhost:5179';
const store = fileURLToPath(new URL('../public/screenshots/', import.meta.url));
const handbook = fileURLToPath(new URL('../../docs/handbook/assets/', import.meta.url));
await mkdir(store, { recursive: true });
await mkdir(handbook, { recursive: true });

const browser = await chromium.launch();

async function context(viewport, scale) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, serviceWorkers: 'block', isMobile: viewport.width < 600, hasTouch: viewport.width < 600 });
  await ctx.addInitScript(() => {
    localStorage.setItem('fyf.consent', JSON.stringify({ analytics: false, decidedAt: new Date().toISOString(), version: 1 }));
    localStorage.setItem('fyf.installDismissed', String(Date.now()));
  });
  return ctx;
}

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page
    .waitForFunction(() => [...document.images].filter((i) => i.getBoundingClientRect().top < innerHeight).every((i) => i.complete), null, { timeout: 15_000 })
    .catch(() => {});
  await page.waitForTimeout(600);
}

async function shoot(page, path, file) {
  await page.goto(base + path);
  await settle(page);
  await page.screenshot({ path: file });
  console.log('saved', file);
}

// Mobile: 360x800 CSS px at 3x = 1080x2400.
const mobile = await context({ width: 360, height: 800 }, 3);
const m = await mobile.newPage();
await shoot(m, '/', store + 'mobile-home.png');
await m.goto(base + '/quiz');
await m.getByRole('button', { name: 'Womenswear' }).click();
await m.getByRole('button', { name: "I'd wear this" }).waitFor({ timeout: 60_000 });
await settle(m);
await m.screenshot({ path: store + 'mobile-quiz.png' });

// Handbook images (smaller, 2x).
const hb = await context({ width: 390, height: 844 }, 2);
const h = await hb.newPage();
await shoot(h, '/', handbook + 'app-home.png');
await shoot(h, '/quiz', handbook + 'app-quiz-intro.png');
await h.getByRole('button', { name: 'Womenswear' }).click();
await h.getByRole('button', { name: "I'd wear this" }).waitFor({ timeout: 60_000 });
await settle(h);
await h.screenshot({ path: handbook + 'app-quiz-card.png' });
console.log('saved', handbook + 'app-quiz-card.png');
await shoot(h, '/search?q=linen%20shirt', handbook + 'app-search.png');
await h.goto(base + '/search?q=shirt');
await settle(h);
const first = h.locator('main a[href^="/p/"]').first();
const href = await first.getAttribute('href');
await shoot(h, href, handbook + 'app-product.png');
await shoot(h, '/app', handbook + 'app-install.png');
await shoot(h, '/brands', handbook + 'app-brands.png');

// Desktop.
const desktop = await context({ width: 1920, height: 1080 }, 1);
const d = await desktop.newPage();
await shoot(d, '/', store + 'desktop-home.png');

await browser.close();
