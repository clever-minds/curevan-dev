import serverApi from "@/lib/repos/axios.server";
import type { AuditLog } from "../types";

/**
 * Adds an audit log via backend API instead of Firestore
 * Function name unchanged: addAuditLog
 */
export async function addAuditLog(log: Omit<AuditLog, "id">): Promise<AuditLog | null> {
  try {
    const { data: response } = await serverApi.post(
      "/api/audit-logs/add",
      log,
      {
        headers: { withCredentials: true },
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