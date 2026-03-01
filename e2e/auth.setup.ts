
import { test as setup, expect } from '@playwright/test';

const superAdminFile = 'playwright/.auth/super-admin.json';
const ecomAdminFile = 'playwright/.auth/ecom-admin.json';
const therapyAdminFile = 'playwright/.auth/therapy-admin.json';
const therapistFile = 'playwright/.auth/therapist.json';
const patientFile = 'playwright/.auth/patient.json';

// Function to perform login and save state
async function loginAndSave(page: any, email: string, password: any, file: string) {
    await page.goto('/auth/signin');
    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard/**');
    await page.context().storageState({ path: file });
}

setup('authenticate as Super Admin', async ({ page }) => {
    await loginAndSave(page, 'admin@curevan.com', process.env.TEST_USER_PASSWORD, superAdminFile);
});

setup('authenticate as E-com Admin', async ({ page }) => {
    await loginAndSave(page, 'ecom@curevan.com', process.env.TEST_USER_PASSWORD, ecomAdminFile);
});

setup('authenticate as Therapy Admin', async ({ page }) => {
    await loginAndSave(page, 'therapy@curevan.com', process.env.TEST_USER_PASSWORD, therapyAdminFile);
});

setup('authenticate as Therapist', async ({ page }) => {
    await loginAndSave(page, 'therapist@curevan.com', process.env.TEST_USER_PASSWORD, therapistFile);
});

setup('authenticate as Patient', async ({ page }) => {
    await loginAndSave(page, 'patient@curevan.com', process.env.TEST_USER_PASSWORD, patientFile);
});
