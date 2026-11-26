import serverApi from "@/lib/repos/axios.server";
import { getToken } from "@/lib/auth";

export interface NotificationLogRow {
  id: number;
  userId: number | null;
  event: string;
  channel: string;
  template: string | null;
  status: "sent" | "delivered" | "read" | "failed" | "skipped" | "pending";
  providerMessageId: string | null;
  error: string | null;
  errorCode: string | null;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
  userRole: string;
  userName: string | null;
  maskedPhone: string | null;
}

export interface NotificationLogsResponse {
  total: number;
  limit: number;
  offset: number;
  logs: NotificationLogRow[];
}

export interface NotificationLogFilterParams {
  event?: string;
  status?: string;
  channel?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch notification logs (Admin Super only)
 */
export async function getNotificationLogs(
  params?: NotificationLogFilterParams
): Promise<NotificationLogsResponse> {
  const token = await getToken();
  if (!token) {
    throw new Error("Token missing, please login again");
  }

  const queryParams = new URLSearchParams();
  if (params?.event && params.event !== "all") queryParams.append("event", params.event);
  if (params?.status && params.status !== "all") queryParams.append("status", params.status);
  if (params?.channel && params.channel !== "all") queryParams.append("channel", params.channel);
  if (params?.limit) queryParams.append("limit", String(params.limit));
  if (params?.offset) queryParams.append("offset", String(params.offset));

  const queryString = queryParams.toString();
  const url = `/api/admin/notification-log${queryString ? `?${queryString}` : ""}`;

  const { data } = await serverApi.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.data || { total: 0, limit: 100, offset: 0, logs: [] };
}

/**
 * Re-dispatch/resend a notification (Admin Super only)
 */
export async function resendNotification(id: number): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  if (!token) {
    throw new Error("Token missing, please login again");
  }

  const { data } = await serverApi.post(
    `/api/admin/notification-log/${id}/resend`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
}
