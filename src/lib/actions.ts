'use server';

import serverApi from "@/lib/repos/axios.server";

import type {
  AIFeedback, Appointment, AuditLog, Coupon, PayoutItem,
  ProfileChangeRequest, SupportTicket, Therapist
} from '@/lib/types';
import { z } from 'zod';

import { sub, startOfWeek, endOfWeek } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { listAppointments, getAppointmentById } from '@/lib/repos/appointments';
import { getTherapistById } from '@/lib/repos/therapists';
import { addPayoutItem, getPayoutItemBySourceId } from '@/lib/repos/payouts';
import { addAuditLog } from '@/lib/repos/logs';
import { getTherapistProfileById } from './repos/therapistProfiles';
import { getCurrentUser, getToken } from '@/lib/auth';
import { updatePcr } from './repos/pcr';

/**
 * Upload a file via backend API (server handles Firebase Storage)
 */
export async function uploadFile(formData: FormData): Promise<{ fileUrl?: string; error?: string }> {
  const token = await getToken();
  try {
    const { data } = await serverApi.post('/api/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (error: any) {
    console.error('File upload failed via API:', error?.response || error?.message);
    return { error: 'Failed to upload file.' };
  }
}

/**
 * Generate objective notes via AI backend endpoint
 */
export async function handleGenerateNotes(formData: FormData): Promise<{ objectiveNotes?: string; error?: string }> {
  const token = await getToken();
  try {
    const { data } = await serverApi.post('/api/ai/objective-notes', formData, {
      headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (error: any) {
    console.error('Failed to generate notes via API:', error?.response || error?.message);
    return { error: 'Failed to generate notes.' };
  }
}

/**
 * Create payout item for a booking
 */
export async function createPayoutItemForBooking(bookingId: number): Promise<{ success: boolean; message: string; payoutItemId?: string; }> {
  console.log(`Triggered payout item creation for bookingId: ${bookingId}`);

  // This should ideally be a transaction, but for simplicity we'll do it step-by-step.
  // Idempotency Check
  const existingItem = await getPayoutItemBySourceId(bookingId);
  if (existingItem) {
    console.log(`Payout item for booking ${bookingId} already exists. Skipping.`);
    return { success: true, message: 'Payout item already exists.' };
  }

  // 1. Fetch related documents
  const appointment = await getAppointmentById(bookingId);
  if (!appointment) {
    throw new Error(`Appointment ${bookingId} not found.`);
  }

  const therapist = await getTherapistProfileById(appointment.therapistId);
  if (!therapist) {
    throw new Error(`Therapist ${appointment.therapistId} not found.`);
  }

  // 2. Validate conditions for payout
  if (appointment.paymentStatus !== 'Paid') {
    await updatePcr(bookingId, { status: 'in_progress' }); // Revert lock status
    return { success: false, message: `Payment not confirmed for booking ${bookingId}. PCR has been unlocked.` };
  }

  // 3. Compute payout details
  const grossAmount = appointment.serviceAmount || 0;
  const membershipPlanSnapshot = therapist.membershipPlan || 'standard';
  const platformFeePct = membershipPlanSnapshot === 'premium' ? 0.10 : 0.00;
  const platformFeeAmount = Math.round(grossAmount * platformFeePct);

  // GST is 18% on the platform fee.
  const gstOnPlatformFee = platformFeeAmount > 0 ? platformFeeAmount * 0.18 : 0;

  const preTdsPayable = grossAmount - platformFeeAmount;

  // TDS is 10% on the amount after platform fee deduction.
  const tdsDeducted = preTdsPayable > 0 ? preTdsPayable * 0.10 : 0;

  const netAmount = preTdsPayable - tdsDeducted;

  const bookingDate = new Date(appointment.date as any);
  const weekStart = startOfWeek(bookingDate, { weekStartsOn: 1 }).toISOString();

  // 4. Create the payoutItems document
  const newPayoutItem: Omit<PayoutItem, 'id'> = {
    type: 'service',
    sourceId: bookingId,
    therapistId: appointment.therapistId,
    patientId: appointment.patientId,
    serviceTypeId: appointment.serviceTypeId,
    grossAmount,
    platformFeePct,
    platformFeeAmount,
    gstOnPlatformFee,
    preTdsPayable,
    tdsDeducted,
    netAmount,
    currency: 'INR',
    state: 'onHold', // Default state, to be picked up by weekly batch job
    weekStart,
    createdAt: new Date(),
    membershipPlanSnapshot,
  };

  const createdItem = await addPayoutItem(newPayoutItem);

  // 5. Create the audit log entry
  const auditLog: AuditLog = {
    actorId: 'system',
    action: 'payout.item.created',
    entityType: 'booking',
    entityId: bookingId,
    timestamp: new Date(),
    details: {
      payoutItemId: createdItem.id,
      netAmount: netAmount,
      therapistId: therapist.id,
    }
  };
  await addAuditLog(auditLog);
  
  // 6. Finalize the PCR status to 'locked' atomically
  await updatePcr(bookingId, { 
    status: 'locked', 
    pcrStatus: 'locked' 
  });

  return { success: true, message: 'Payout item created and PCR locked successfully.', payoutItemId: createdItem.id };
}

/**
 * Generate missing referral codes for therapists
 */
export async function generateMissingTherapistCodes(): Promise<Coupon[]> {
  const token = await getToken();
  try {
    const { data } = await serverApi.post('/api/coupons/generate-missing', null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data ?? [];
  } catch (error: any) {
    console.error('Error generating therapist codes via API:', error?.response || error?.message);
    return [];
  }
}

import {
  createSupportTicket as createTicketRepo,
  replyToSupportTicket as replyTicketRepo,
  closeSupportTicket as closeTicketRepo
} from '@/lib/repos/support';

/**
 * Create a support ticket
 */
export async function createSupportTicket(data: any) {
  return await createTicketRepo(data);
}

/**
 * Reply to a support ticket
 */
export async function replyToSupportTicketAction(data: { ticketId: number; message: string; sender_type: string }) {
  return await replyTicketRepo(data);
}

/**
 * Close a support ticket
 */
export async function closeSupportTicketAction(ticketId: number) {
  return await closeTicketRepo(ticketId);
}

import {
  approveProfileChangeRequest as approveRepo,
  rejectProfileChangeRequest as rejectRepo,
  getProfileChangeRequest
} from '@/lib/repos/content';

/**
 * Approve a profile change request
 */
export async function approveProfileChangeRequestAction(requestId: string) {
  const currentUser = await getCurrentUser();
  const res = await approveRepo(requestId, currentUser?.uid);
  if (res.success) {
    revalidatePath('/dashboard/admin/profile-approvals');
    revalidatePath('/dashboard/therapy-admin/users');
  }
  return res;
}

/**
 * Reject a profile change request
 */
export async function rejectProfileChangeRequestAction(requestId: string, reason?: string) {
  const currentUser = await getCurrentUser();
  const res = await rejectRepo(requestId, reason, currentUser?.uid);
  if (res.success) {
    revalidatePath('/dashboard/admin/profile-approvals');
    revalidatePath('/dashboard/therapy-admin/users');
  }
  return res;
}

/**
 * Review a profile change request
 * Fetches current changes and previously stored data via /change-request/:id
 */
export async function reviewProfileChangeRequest(
  requestId: string,
  action: 'approve' | 'reject',
  reason?: string
) {
  // Integrate the fetch portion to ensure we have the latest changes/old data
  const requestDetails = await getProfileChangeRequest(requestId);

  if (!requestDetails) {
    console.error(`Could not fetch details for request ${requestId}`);
  } else {
    console.log(`Reviewing changes for ${requestDetails.userName || requestDetails.userId}:`, requestDetails.changes);
  }

  const currentUser = await getCurrentUser();
  const actorId = currentUser?.uid;

  let res;
  if (action === 'approve') {
    res = await approveRepo(requestId, actorId);
  } else {
    res = await rejectRepo(requestId, reason, actorId);
  }

  if (res.success) {
    revalidatePath('/dashboard/admin/profile-approvals');
    revalidatePath('/dashboard/therapy-admin/users');
    if (requestDetails?.userId) {
       revalidatePath(`/therapists/${requestDetails.userId}`);
    }
  }
  return res;
}

/**
 * Log AI feedback
 */
export async function logAIFeedbackAction(feedbackData: Omit<AIFeedback, 'id' | 'timestamp' | 'userId'>) {
  const token = await getToken();
  try {
    const { data } = await serverApi.post('/api/ai-feedback/log', feedbackData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error: any) {
    console.error('Error logging AI feedback via API:', error?.response || error?.message);
    return { success: false, error: 'Failed to log AI feedback.' };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const token = await getToken();
  try {
    const { data } = await serverApi.post(`/api/notifications/read/${notificationId}`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error: any) {
    console.error(`Error marking notification ${notificationId} as read via API:`, error?.response || error?.message);
    return { success: false, error: 'Failed to mark notification as read.' };
  }
}

/**
 * Update the status of a journal/knowledge base entry (e.g., Approve & Publish)
 */
export async function updateJournalStatus(
  id: string | number,
  status: "published" | "draft" | "pending_review" | "archived",
  token?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { data } = await serverApi.patch(
      `/api/general/knowledge-base/${id}/status`,
      { status },
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );

    return {
      success: data.success ?? true,
      message: data.message || `Journal entry updated to ${status}.`
    };
  } catch (error: any) {
    console.error('Failed to update journal status:', error?.response || error?.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update journal status.'
    };
  }
}