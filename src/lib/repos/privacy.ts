'use server';

import serverApi from '@/lib/repos/axios.server';
import { getToken } from '@/lib/auth';

export type PrivacyRequestType = 'export' | 'correction' | 'erasure' | 'withdraw_consent';
export interface PrivacyRequestRow {
  id: number; type: PrivacyRequestType; status: 'open' | 'in_progress' | 'done' | 'rejected'; note?: string | null;
  createdAt: string; closedAt?: string | null; userId?: number; userName?: string | null; userEmail?: string | null;
}

async function auth() { return { headers: { Authorization: `Bearer ${await getToken()}` } }; }
const errorOf = (e: any, fallback: string) => e?.response?.data?.error || e?.response?.data?.message || fallback;

export async function listMyPrivacyRequests(): Promise<PrivacyRequestRow[]> {
  try { const { data } = await serverApi.get('/api/privacy/requests', await auth()); return data?.data ?? []; } catch { return []; }
}
export async function createPrivacyRequest(type: PrivacyRequestType, note?: string): Promise<{ ok: boolean; error?: string }> {
  try { await serverApi.post('/api/privacy/requests', { type, note }, await auth()); return { ok: true }; } catch (e) { return { ok: false, error: errorOf(e, 'Could not save your request') }; }
}
/** A copy of the signed-in user's data as JSON text. */
export async function downloadMyData(): Promise<string | null> {
  try { const res = await serverApi.get('/api/privacy/export', { ...(await auth()), responseType: 'text', transformResponse: (d) => d }); return String(res.data); } catch { return null; }
}
export async function listAllPrivacyRequests(status?: string): Promise<PrivacyRequestRow[]> {
  try { const { data } = await serverApi.get('/api/privacy/admin/requests', { ...(await auth()), params: status ? { status } : {} }); return data?.data ?? []; } catch { return []; }
}
export async function updatePrivacyRequest(id: number, status: PrivacyRequestRow['status'], note?: string): Promise<{ ok: boolean; error?: string }> {
  try { await serverApi.patch(`/api/privacy/admin/requests/${id}`, { status, note }, await auth()); return { ok: true }; } catch (e) { return { ok: false, error: errorOf(e, 'Could not update the request') }; }
}
