
import { test, expect } from '@playwright/test';

test.describe('Coupon Generation', () => {
    test.use({ storageState: 'playwright/.auth/ecom-admin.json' });

    test('should generate missing codes and update the UI', async ({ page }) => {
        await page.goto('/dashboard/admin/coupons');
        
        const generateButton = page.getByRole('button', { name: 'Generate Missing Therapist Codes' });
        
        // Count rows before
        const initialRowCount = await page.getByRole('row').count();
        
        await generateButton.click();
        
        // Wait for the success toast to appear
        await expect(page.getByText('Codes Generated!')).toBeVisible();
        
        // Count rows after
        const finalRowCount = await page.getByRole('row').count();
        
        expect(finalRowCount).toBeGreaterThan(initialRowCount);
    });
});
