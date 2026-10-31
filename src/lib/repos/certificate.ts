import clientApi from '@/lib/repos/axios';

export type CertificateInfo = { uploaded: boolean; name: string | null; uploadedAt: string | null };

export const CERTIFICATE_MAX_BYTES = 5 * 1024 * 1024;
export const CERTIFICATE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/** Has the signed-in therapist uploaded the registration certificate? */
export async function getMyCertificate(): Promise<CertificateInfo> {
  const { data } = await clientApi.get('/api/therapists/me/certificate');
  return data.data;
}

/** The certificate file (PDF, JPG or PNG, up to 5 MB). */
export async function uploadMyCertificate(file: File): Promise<CertificateInfo> {
  const form = new FormData();
  form.append('certificate', file);
  const { data } = await clientApi.post('/api/therapists/me/certificate', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data.data;
}

/** Opens a therapist's certificate in a new tab (the therapist herself or himself, or a therapy / super admin). The file needs the login, so it is fetched with it. */
export async function openCertificate(userId: number | string): Promise<void> {
  const { data } = await clientApi.get(`/api/therapists/certificate/${userId}/file`, { responseType: 'blob' });
  const url = URL.createObjectURL(data as Blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
