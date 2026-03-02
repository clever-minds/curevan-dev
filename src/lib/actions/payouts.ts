import serverApi from "@/lib/repos/axios.server";
import { getCurrentUser } from "../auth";

/**
 * Updates the status of a payout batch via backend API.
 * Maintains admin permission checks before calling API.
 */
export async function updatePayoutBatchStatus(
  batchId: string,
  newStatus: 'onHold' | 'processing'
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();

  // Security Check
  if (!user || (!user.roles?.includes('admin.super') && !user.roles?.includes('admin.therapy'))) {
    return { success: false, error: 'Permission denied. You do not have access to perform this action.' };
  }

  if (!batchId || !newStatus) {
    return { success: false, error: 'Invalid batch ID or status provided.' };
  }

  try {
    // Call backend API to update payout batch
    const { data: response } = await serverApi.post(
      '/api/payout-batches/update-status',
      {
        batchId,
        newStatus,
        actorId: user.uid, // pass current user ID for audit logging
      },
      {
        headers: {
          withCredentials: true, // maintain session/cookies
        },
      }
    );

    if (response?.success) {
      console.log(`Payout batch ${batchId} status updated to ${newStatus} by ${user.email}`);
      return { success: true };
    } else {
      return { success: false, error: response?.error || 'Failed to update payout batch status.' };
    }
  } catch (error: any) {
    console.error(`Failed to update payout batch ${batchId}:`, error?.response || error?.message);
    return { success: false, error: 'An unexpected error occurred while updating the payout status.' };
  }
}