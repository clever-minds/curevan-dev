
import { test, expect } from '@playwright/test';

test.describe('RBAC Tests', () => {
    
    test.describe('Super Admin', () => {
        test.use({ storageState: 'playwright/.auth/super-admin.json' });
        test('can access the Team Management page', async ({ page }) => {
            await page.goto('/dashboard/admin/team');
            await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible();
        });
    });

    test.describe('E-commerce Admin', () => {
        test.use({ storageState: 'playwright/.auth/ecom-admin.json' });
        test('cannot access Team Management page', async ({ page }) => {
            await page.goto('/dashboard/admin/team');
            // Should be redirected and see their own dashboard heading
            await expect(page.getByRole('heading', { name: 'E-commerce Admin • My Dashboard' })).toBeVisible();
            await expect(page.getByRole('heading', { name: 'Team Management' })).not.toBeVisible();
        });
        
        test('cannot see Unlock button on a locked PCR', async ({ page }) => {
            // A specific booking ID for a locked PCR
            await page.goto('/pcr/1');
            await expect(page.getByRole('button', { name: 'Unlock for Edit' })).not.toBeVisible();
        });
    });

    test.describe('Therapy Admin', () => {
        test.use({ storageState: 'playwright/.auth/therapy-admin.json' });
        test('can see Unlock button on a locked PCR', async ({ page }) => {
            await page.goto('/pcr/1');
            await expect(page.getByRole('button', { name: 'Unlock for Edit' })).toBeVisible();
        });
    });
});
