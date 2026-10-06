import { defineConfig, devices } from '@playwright/test';

// Default: production build served by `vite preview`, with the Salesforce API mocked in e2e/mockApi.js.
// E2E_LIVE=1 runs the same journeys against the dev server proxied to a real org (SF_DEV_ORG=<alias>).
const live = process.env.E2E_LIVE === '1';
const port = live ? 5179 : 4173;

export default defineConfig({
  testDir: 'e2e',
  timeout: live ? 90_000 : 30_000,
  expect: { timeout: live ? 20_000 : 5_000 },
  fullyParallel: !live,
  workers: live ? 1 : 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } } },
  ],
  webServer: {
    command: live ? `npx vite --port ${port}` : `npm run build && npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
