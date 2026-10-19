import { test, expect } from '@playwright/test';

// Go-live item 19: every dashboard home opens at 375 px without sideways scrolling.
const HOMES: Array<[string, string]> = [
  ['patient', '/dashboard/patient/my-dashboard'],
  ['therapist', '/dashboard/therapist/my-dashboard'],
  ['super-admin', '/dashboard/admin/my-dashboard'],
  ['ecom-admin', '/dashboard/ecom-admin/my-dashboard'],
  ['therapy-admin', '/dashboard/therapy-admin/my-dashboard'],
];
for (const [role, path] of HOMES) {
  test.describe(role, () => {
    test.use({ storageState: `playwright/.auth/${role}.json` });
    test(`${path} has no horizontal scroll at 375 px`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain(path);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over, 'the page is wider than the screen').toBeLessThanOrEqual(1);
    });
  });
}
