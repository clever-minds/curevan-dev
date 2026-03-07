import serverApi from "@/lib/repos/axios.server";
import type { AuditLog } from "../types";
import { getToken } from "@/lib/auth";

/**
 * Adds an audit log via backend API instead of Firestore
 * Function name unchanged: addAuditLog
 */
export async function addAuditLog(log: Omit<AuditLog, "id">): Promise<AuditLog | null> {
  try {
       const token = await getToken();
        if (!token) {
            throw new Error('Token missing, please login again');
        }
    const { data: response } = await serverApi.post(
      "/api/general/audit-logs/add",
      log,
      {
        headers: { withCredentials: true, Authorization: `Bearer ${token}`,  },
      }
    );

    if (response?.data) {
      return { ...log, id: response.data.id } as AuditLog;
    }

    return null;
  } catch (error: any) {
    console.error("Failed to add audit log via API:", error?.response || error?.message);
    return null;
  }
}