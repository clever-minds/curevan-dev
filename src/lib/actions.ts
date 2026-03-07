import serverApi from "@/lib/repos/axios.server";
import type { 
  AIFeedback, Appointment, AuditLog, Coupon, PayoutItem, 
  ProfileChangeRequest, SupportTicket, Therapist 
} from '@/lib/types';
import { z } from 'zod';

import { sub, startOfWeek, endOfWeek } from 'date-fns';
import { listAppointments, getAppointmentById } from '@/lib/repos/appointments';
import { getTherapistById } from '@/lib/repos/therapists';
import { addPayoutItem, getPayoutItemBySourceId } from '@/lib/repos/payouts';
import { addAuditLog } from '@/lib/repos/logs';
import { getTherapistProfileById } from './repos/therapistProfiles';

import { updatePcr } from './repos/pcr';

/**
 * Upload a file via backend API (server handles Firebase Storage)
 */
export async function uploadFile(formData: FormData): Promise<{ fileUrl?: string; error?: string }> {
  try {
    const { data } = await serverApi.post('/api/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data', withCredentials: true },
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
  try {
    const { data } = await serverApi.post('/api/ai/objective-notes', formData, {
      headers: { 'Content-Type': 'multipart/form-data', withCredentials: true },
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
  
  return { success: true, message: 'Payout item created successfully.', payoutItemId: createdItem.id };
}

/**
 * Generate missing referral codes for therapists
 */
export async function generateMissingTherapistCodes(): Promise<Coupon[]> {
  try {
    const { data } = await serverApi.post('/api/coupons/generate-missing', null, {
      headers: { withCredentials: true },
    });
    return data ?? [];
  } catch (error: any) {
    console.error('Error generating therapist codes via API:', error?.response || error?.message);
    return [];
  }
}

/**
 * Create a support ticket
 */
export async function createSupportTicket(data: unknown) {
  try {
    const { data: response } = await serverApi.post('/api/support-tickets/create', data, {
      headers: { withCredentials: true },
    });
    return response;
  } catch (error: any) {
    console.error('Error creating support ticket via API:', error?.response || error?.message);
    return { success: false, error: 'Failed to create support ticket.' };
  }
}

/**
 * Review a profile change request
 */
export async function reviewProfileChangeRequest(
  requestId: string,
  action: 'approve' | 'reject',
  reason?: string
) {
  try {
    const { data } = await serverApi.post(
      `/api/profile-change-requests/review/${requestId}`,
      { action, reason },
      { headers: { withCredentials: true } }
    );
    return data;
  } catch (error: any) {
    console.error(`Error reviewing profile change request ${requestId}:`, error?.response || error?.message);
    return { success: false, error: 'Failed to review profile change request.' };
  }
}

/**
 * Log AI feedback
 */
export async function logAIFeedbackAction(feedbackData: Omit<AIFeedback, 'id' | 'timestamp' | 'userId'>) {
  try {
    const { data } = await serverApi.post('/api/ai-feedback/log', feedbackData, {
      headers: { withCredentials: true },
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
  try {
    const { data } = await serverApi.post(`/api/notifications/read/${notificationId}`, null, {
      headers: { withCredentials: true },
    });
    return data;
  } catch (error: any) {
    console.error(`Error marking notification ${notificationId} as read via API:`, error?.response || error?.message);
    return { success: false, error: 'Failed to mark notification as read.' };
  }
}