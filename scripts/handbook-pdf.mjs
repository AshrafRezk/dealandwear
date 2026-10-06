#!/usr/bin/env node
/** Prints docs/handbook/index.html to docs/handbook/Find-Your-Fit-Handbook.pdf. */
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const html = fileURLToPath(new URL('../../docs/handbook/index.html', import.meta.url));
const pdf = fileURLToPath(new URL('../../docs/handbook/Find-Your-Fit-Handbook.pdf', import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: pdf, format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' } });
await browser.close();
console.log('saved', pdf);
