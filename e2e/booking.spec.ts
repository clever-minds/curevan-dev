
import { test, expect } from '@playwright/test';

test.describe('Booking Form', () => {
    test.use({ storageState: 'playwright/.auth/patient.json' });

    test.beforeEach(async ({ page }) => {
        // Navigate to a specific therapist's booking page
        await page.goto('/booking/therapist-123');
    });

    test('should allow booking an available slot', async ({ page }) => {
        // This test assumes a known state where '09:00' is available
        await page.getByRole('button', { name: '09:00' }).click();
        await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeEnabled();
    });

    test('should not allow booking a disabled (off-hours) slot', async ({ page }) => {
        // This test assumes a known state where '08:00' is outside working hours
        const disabledSlot = page.getByRole('button', { name: '08:00' });
        await expect(disabledSlot).toBeDisabled();
    });
});
