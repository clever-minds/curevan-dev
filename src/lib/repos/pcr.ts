
import serverApi from "@/lib/repos/axios.server";
import type { PCR,ApiResponse } from "@/lib/types";
import { getToken } from "../auth";
// ---------------------------
// List all PCRs (optional filter by bookingId)
// ---------------------------
export async function listPcrs(filters?: { bookingId?: number }): Promise<PCR[] | null> {
  try {
    const params: any = {};
    if (filters?.bookingId) params.bookingId = filters.bookingId;
const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<PCR[]>>("/api/appointments/pcr-list", {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return (data.data || []).map((pcr: any) => ({
      ...pcr,
      createdAt: pcr.createdAt ? new Date(pcr.createdAt).toISOString() : '',
      lockedAt: pcr.lockedAt ? new Date(pcr.lockedAt).toISOString() : null,
    }));
  } catch (error: any) {
    console.error("PCR LIST ERROR:", error?.message);
    return null;
  }
}

// ---------------------------
// Get single PCR by ID
// ---------------------------
export async function getPcrById(id: number): Promise<PCR | null> {
  if (!id) return null;
const token = await getToken();
  try {
    const { data } = await serverApi.get<ApiResponse<PCR>>(`/api/appointments/pcr/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!data?.data) return null;

    // Convert createdAt / lockedAt to JS Date
    return {
      ...data.data,
        createdAt: data.data.createdAt || new Date(),
        lockedAt: data.data.lockedAt || new Date(),
    };
  } catch (error: any) {
    console.error("PCR FETCH ERROR:", error?.message);
    return null;
  }
}

// ---------------------------
// Update PCR by ID
// ---------------------------
export async function updatePcr(id: number, data: Partial<PCR>): Promise<boolean> {
  const token = await getToken();
  try {
    await serverApi.patch(`/api/appointments/pcr/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return true;
  } catch (error: any) {
    console.error("PCR UPDATE ERROR:", error?.message);
    return false;
  }
}
/** Like updatePcr, but tells the caller why the server refused (missing fields, not started yet, reason needed...). */
export async function updatePcrDetailed(id: number, data: Partial<PCR> & Record<string, unknown>): Promise<{ ok: boolean; error?: string; payout?: { created: boolean; reason?: string } }> {
  const token = await getToken();
  try {
    const res = await serverApi.patch(`/api/appointments/pcr/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
    return { ok: true, payout: res.data?.payout };
  } catch (error: any) {
    return { ok: false, error: error?.response?.data?.error || error?.message || 'The report could not be saved.' };
  }
}

/** The finalised care-summary PDF of a booking's PCR (fetched with the login token, so it comes back as a blob). */
export async function downloadPcrPdf(bookingId: number): Promise<Blob | null> {
  const token = await getToken();
  try {
    const res = await serverApi.get(`/api/pcr/appointment/${bookingId}/pdf`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
    return res.data as Blob;
  } catch {
    return null;
  }
}
