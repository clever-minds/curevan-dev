
import serverApi from "@/lib/repos/axios.server";
import type { PCR,ApiResponse } from "@/lib/types";

// ---------------------------
// List all PCRs (optional filter by bookingId)
// ---------------------------
export async function listPcrs(filters?: { bookingId?: number }): Promise<PCR[] | null> {
  try {
    const params: any = {};
    if (filters?.bookingId) params.bookingId = filters.bookingId;

    const { data } = await serverApi.get<ApiResponse<PCR[]>>("/api/appointments/pcr", {
      params,
      withCredentials: true,
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

  try {
    const { data } = await serverApi.get<ApiResponse<PCR>>(`/api/appointments/pcr/${id}`, {
      withCredentials: true,
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
  try {
    await serverApi.patch(`/api/appointments/pcr/${id}`, data, {
      withCredentials: true,
    });
    return true;
  } catch (error: any) {
    console.error("PCR UPDATE ERROR:", error?.message);
    return false;
  }
}