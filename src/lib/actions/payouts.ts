
'use server';

import { db } from '@/lib/db';
import { FieldValue } from 'firebase-admin/firestore';
import { addAuditLog } from '../repos/logs';
import { getCurrentUser } from '../auth';

/**
 * Updates the status of a payout batch.
 * This action is protected and should only be callable by authorized admins.
 * @param batchId - The ID of the payout batch to update.
 * @param newStatus - The new status to set ('onHold' or 'processing').
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

  const batchRef = db.collection('payoutBatches').doc(batchId);
  const doc = await batchRef.get();

  if (!doc.exists) {
    return { success: false, error: 'Payout batch not found.' };
  }

  try {
    // Update the document
    await batchRef.update({
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create an audit log entry
    await addAuditLog({
      actorId: user.uid,
      action: newStatus === 'onHold' ? 'payout.batch.hold' : 'payout.batch.release',
      entityType: 'payoutBatch',
      entityId: batchId,
      details: { previousStatus: doc.data()?.status, newStatus },
      timestamp: FieldValue.serverTimestamp(),
    });

    console.log(`Payout batch ${batchId} status updated to ${newStatus} by ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to update payout batch ${batchId}:`, error);
    return { success: false, error: 'An unexpected error occurred while updating the payout status.' };
  }
}
