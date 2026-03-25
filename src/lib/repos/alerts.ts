import serverApi from "@/lib/repos/axios.server";
import type { SOSAlert } from "../types";
import { getSafeDate } from "../utils";
import { getCurrentUser, getToken } from "../auth";

/**
 * Fetches the list of SOS alerts via backend API
 * Function name unchanged: listSosAlerts
 */
export async function listSosAlerts(): Promise<SOSAlert[]> {
  const token = await getToken();
  try {
    const { data: response } = await serverApi.get("/api/sos/list", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });

    if (!response?.data || !Array.isArray(response.data)) return [];

    return response.data.map((alert: any) => ({
      id: alert.id,
      ...alert,
      timestamp: getSafeDate(alert.timestamp)?.toISOString() || new Date().toISOString(),
      resolvedAt: getSafeDate(alert.resolvedAt)?.toISOString(),
    }));
  } catch (error: any) {
    console.error("Failed to fetch SOS alerts via API:", error?.response || error?.message);
    return [];
  }
}

/**
 * Creates a new SOS alert via backend API
 */
export async function createSosAlert(data: {
  bookingId?: string;
  location?: { lat: number; lng: number };
  type: 'sos' | 'missed-checkin';
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const token = await getToken();
  try {
    const { data: response } = await serverApi.post(
      "/api/sos/create",
      {
        bookingId: data.bookingId,
        location: data.location,
        type: data.type,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    if (response?.success) {
      return { success: true, id: response.data?.id };
    } else {
      return { success: false, error: response?.message || "Failed to create SOS alert." };
    }
  } catch (error: any) {
    console.error("Error creating SOS alert via API:", error?.response?.data || error?.message);
    return { success: false, error: error?.response?.data?.message || "An unexpected error occurred." };
  }
}

/**
 * Resolves an SOS alert via backend API
 * Function name unchanged: resolveSosAlert
 */
export async function resolveSosAlert(
  alertId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  const token = await getToken();
  if (!user || (!user.roles?.includes("admin.super") && !user.roles?.includes("admin.therapy"))) {
    return { success: false, error: "Permission denied." };
  }

  try {
    const { data: response } = await serverApi.post(
      `/api/sos/resolve`,
      { alertId, actorId: user.uid },
      { headers: { 
        Authorization: `Bearer ${token}`,
       } }
    );

    if (response?.success) {
      console.log(`SOS alert ${alertId} resolved by ${user.uid} via API`);
      return { success: true };
    } else {
      return { success: false, error: response?.error || "Failed to resolve SOS alert." };
    }
  } catch (error: any) {
    console.error("Error resolving SOS alert via API:", error?.response || error?.message);
    return { success: false, error: "An unexpected error occurred while resolving the alert." };
  }
}