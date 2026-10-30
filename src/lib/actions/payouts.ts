import serverApi from "@/lib/repos/axios.server";
import { getToken } from "../auth";

type Result = { success: boolean; error?: string };

async function call(path: string, body: Record<string, unknown> = {}): Promise<Result> {
  try {
    const token = await getToken();
    await serverApi.post(path, body, { headers: { Authorization: `Bearer ${token}` } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.response?.data?.error || 'Something went wrong. Please try again.' };
  }
}

// The server checks who may do what (approve and mark paid: Super Admin; hold and release: Super Admin or Therapy Admin).
export const approvePayoutBatch = (id: number) => call(`/api/payout-batches/${id}/approve`);
export const holdPayoutBatch = (id: number, reason: string) => call(`/api/payout-batches/${id}/hold`, { reason });
export const releasePayoutBatch = (id: number) => call(`/api/payout-batches/${id}/release`);
export const markPayoutBatchPaid = (id: number, utr: string, paidAt?: string) => call(`/api/payout-batches/${id}/mark-paid`, { utr, paidAt });
