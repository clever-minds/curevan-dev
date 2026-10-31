import { test, expect } from '@playwright/test';
import { API, USERS, login, bearer } from './users';

const idOf = (token: string) => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).id as number;

// P22: the therapist uploads the registration certificate in the browser; the therapy admin sees it in the credential queue and can open it.
const pdf = { name: 'registration.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 e2e certificate') };

test.describe.serial('registration certificate', () => {
  test.describe('therapist', () => {
    test.use({ storageState: 'playwright/.auth/therapist.json' });
    test('uploads a PDF and sees it listed', async ({ page }) => {
      await page.goto('/dashboard/therapist/edit');
      const box = page.getByTestId('certificate-upload');
      await expect(box).toBeVisible();
      await box.locator('input[type=file]').setInputFiles(pdf);
      await box.getByRole('button', { name: /upload|replace/i }).click();
      await expect(box.getByText(/Uploaded: registration\.pdf/)).toBeVisible();
    });
    test('a wrong file type is refused before it is sent', async ({ page }) => {
      await page.goto('/dashboard/therapist/edit');
      const box = page.getByTestId('certificate-upload');
      await box.locator('input[type=file]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
      await expect(page.getByText('Wrong file type', { exact: true })).toBeVisible();
    });
  });

  test.describe('therapy admin', () => {
    test.use({ storageState: 'playwright/.auth/therapy-admin.json' });
    test('the credential queue offers the certificate and the API serves the same file', async ({ page, request }) => {
      await page.goto('/dashboard/therapy-admin/my-dashboard');
      await expect(page.getByRole('columnheader', { name: 'Certificate' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'View' }).first()).toBeVisible();
      // the file itself, fetched with a therapy-admin token
      const admin = await login(request, USERS['therapy-admin']);
      const therapistId = idOf(await login(request, USERS.therapist));
      const file = await request.get(`${API}/api/therapists/certificate/${therapistId}/file`, { headers: bearer(admin) });
      expect(file.status()).toBe(200);
      expect((await file.body()).toString()).toContain('%PDF-1.4 e2e certificate');
    });
  });

  test.describe('patient', () => {
    test.use({ storageState: 'playwright/.auth/patient.json' });
    test('cannot open a therapist certificate', async ({ request }) => {
      const patient = await login(request, USERS.patient);
      const therapistId = idOf(await login(request, USERS.therapist));
      const file = await request.get(`${API}/api/therapists/certificate/${therapistId}/file`, { headers: bearer(patient) });
      expect(file.status()).toBe(403);
    });
  });
});
