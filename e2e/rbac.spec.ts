import { test, expect, request as pw } from '@playwright/test';
import { API, USERS, bearer, login } from './users';

const status = async (request: any, token: string, path: string) =>
  (await request.get(`${API}${path}`, { headers: token ? bearer(token) : {} })).status();

test.describe('who may call what (the guards behind every page)', () => {
  test('privacy admin list: super admin only; export needs a login', async ({ request }) => {
    const sa = await login(request, USERS['super-admin']);
    const ecom = await login(request, USERS['ecom-admin']);
    const patient = await login(request, USERS.patient);
    expect(await status(request, sa, '/api/privacy/admin/requests')).toBe(200);
    expect(await status(request, ecom, '/api/privacy/admin/requests')).toBe(403);
    expect(await status(request, patient, '/api/privacy/admin/requests')).toBe(403);
    const anon = await pw.newContext(); // fresh: the login above sets a cookie on `request`
    expect(await status(anon, '', '/api/privacy/export')).toBe(401);
    await anon.dispose();
  });
  test('admin lists are closed to a patient', async ({ request }) => {
    const patient = await login(request, USERS.patient);
    expect(await status(request, patient, '/api/users/list')).toBe(403);
    expect(await status(request, patient, '/api/orders/returns')).toBe(403);
    expect(await status(request, patient, '/api/appointments/pcr-list')).toBe(403);
  });
});

test.describe('pages per role', () => {
  test.describe('Super Admin', () => {
    test.use({ storageState: 'playwright/.auth/super-admin.json' });
    test('may open the team page', async ({ page }) => {
      await page.goto('/dashboard/admin/team');
      await expect(page).toHaveURL(/\/dashboard\/admin\/team/);
    });
  });
  test.describe('E-commerce Admin', () => {
    test.use({ storageState: 'playwright/.auth/ecom-admin.json' });
    test('is sent away from the team page', async ({ page }) => {
      await page.goto('/dashboard/admin/team');
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/\/dashboard\/admin\/team/);
    });
  });
  test.describe('Patient', () => {
    test.use({ storageState: 'playwright/.auth/patient.json' });
    test('is sent away from an admin page', async ({ page }) => {
      await page.goto('/dashboard/admin/payouts');
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/\/dashboard\/admin\/payouts/);
    });
  });
});
