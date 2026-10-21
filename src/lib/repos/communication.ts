'use server';

import serverApi from '@/lib/repos/axios.server';
import { getToken } from '@/lib/auth';

/** Ask the server to connect me to the other person of this booking. Neither number is ever sent to the browser. POST /api/communication/mask-call */
export async function maskCall(appointmentId: number): Promise<{ ok: boolean; message: string }> {
  try {
    const token = await getToken();
    const { data } = await serverApi.post('/api/communication/mask-call', { appointmentId }, { headers: { Authorization: `Bearer ${token}` } });
    return { ok: true, message: data?.data?.message ?? 'Your phone will ring in a moment.' };
  } catch (e: any) {
    return { ok: false, message: e?.response?.data?.message || e?.response?.data?.error || 'We could not connect the call. Please try again.' };
  }
}
