import serverApi from "@/lib/repos/axios.server";
import type { Notification } from "../types";
import { getCurrentUser, getToken } from "../auth";

/**
 * Fetches notifications for the current user via backend API
 * Function name unchanged: listNotifications
 */
export async function listNotifications(userId?: number): Promise<Notification[]> {
  if (!userId) {
    console.warn("Attempted to list notifications without a user ID.");
    return [];
  }

  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Token missing, please login again');
    }

    console.log(`[FRONTEND_API_CALL] Requesting notifications for user.id: ${userId}`);

    const { data: response } = await serverApi.get(`/api/notifications/list/${userId}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
       },
    });

    if (!response?.data || !Array.isArray(response.data)) return [];

    return response.data.map((item: any) => ({
      id: item.id,
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    })) as Notification[];
  } catch (error: any) {
    console.error("Failed to fetch notifications via API:", error?.response || error?.message);
    return [];
  }
}