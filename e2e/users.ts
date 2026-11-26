// The five users that `npm run test:users` of curevan-node seeds into the TEST database.
export const API = process.env.E2E_API_URL || 'http://localhost:5000';
export const PASSWORD = process.env.TEST_USER_PASSWORD || 'Test@1234';
export const USERS = {
  'super-admin': 'super@curevan.test',
  'ecom-admin': 'ecom@curevan.test',
  'therapy-admin': 'therapy@curevan.test',
  therapist: 'therapist@curevan.test',
  patient: 'patient@curevan.test',
} as const;

export async function login(request: any, email: string): Promise<string> {
  const r = await request.post(`${API}/api/auth/login`, { data: { email, password: PASSWORD } });
  return (await r.json()).token as string;
}
export const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
