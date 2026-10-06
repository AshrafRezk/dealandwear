#!/usr/bin/env node
/**
 * Screenshots the Find Your Fit admin home in Salesforce for the handbook.
 * Usage: node scripts/capture-salesforce.mjs <org-alias>
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const org = process.argv[2] || 'dealandwear';
const out = fileURLToPath(new URL('../../docs/handbook/assets/sf-admin-home.png', import.meta.url));
const { result } = JSON.parse(
  execFileSync('sf', ['org', 'open', '-o', org, '--url-only', '-p', '/lightning/app/c__FYF_Admin', '--json'], { encoding: 'utf8' }),
);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 });
await page.goto(result.url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.waitForSelector('c-fyf-admin-home', { timeout: 90_000 });
await page.waitForTimeout(8000);
for (const name of ['Dismiss', 'Close', 'Got it']) {
  await page.getByRole('button', { name, exact: true }).first().click({ timeout: 1500 }).catch(() => {});
}
await page.waitForTimeout(1500);
await page.screenshot({ path: out });
console.log('saved', out);
await browser.close();
