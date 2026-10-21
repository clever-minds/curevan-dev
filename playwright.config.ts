import { defineConfig, devices } from '@playwright/test';

// Runs against a TEST stack only: the API of curevan-node (`node tests/integration/dev_server.js` on :5000, stubbed Razorpay)
// and this website (`npm run build && npx next start -p 3000`). See docs/TESTING.md.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: { baseURL, trace: 'on-first-retry', ...(process.env.E2E_CHROME ? { channel: 'chrome' as const } : {}) },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'], testIgnore: /mobile\.spec\.ts/ },
    { name: 'Mobile 375', use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } }, dependencies: ['setup'], testMatch: /mobile\.spec\.ts/ },
  ],
});
