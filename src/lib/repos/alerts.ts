import serverApi from "@/lib/repos/axios.server";
import type { SOSAlert } from "../types";
import { getSafeDate } from "../utils";
import { getCurrentUser } from "../auth";

/**
 * Fetches the list of SOS alerts via backend API
 * Function name unchanged: listSosAlerts
 */
export async function listSosAlerts(): Promise<SOSAlert[]> {
  try {
    const { data: response } = await serverApi.get("/api/sos/list", {
      headers: { withCredentials: true },
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
 * Resolves an SOS alert via backend API
 * Function name unchanged: resolveSosAlert
 */
export async function resolveSosAlert(
  alertId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || (!user.roles?.includes("admin.super") && !user.roles?.includes("admin.therapy"))) {
    return { success: false, error: "Permission denied." };
  }

  try {
    const { data: response } = await serverApi.post(
      `/api/sos/resolve`,
      { alertId, actorId: user.uid },
      { headers: { withCredentials: true } }
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