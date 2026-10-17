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
import { updatePcr, updatePcrDetailed } from './repos/pcr';

/**
 * Upload a file via backend API (server handles Firebase Storage)
 */
export async function uploadFile(formData: FormData): Promise<{ fileUrl?: string; error?: string }> {
  const token = await getToken();
  try {
    // files go to the media library; the backend answers { data: [{ file_path, ... }] }
    const { data } = await serverApi.post('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
    });
    const first = Array.isArray(data?.data) ? data.data[0] : null;
    return first ? { fileUrl: first.file_path } : { error: 'Failed to upload file.' };
  } catch (error: any) {
    console.error(`Error marking notification  as read via API:`, error?.response?.status, error?.response?.data, error?.message);
    return { error: 'Failed to upload file.' };
  }
}

/**
 * Generate objective notes via AI backend endpoint
 */
export async function handleGenerateNotes(formData: FormData): Promise<{ objectiveNotes?: string; error?: string }> {
  // only a logged-in user may use the AI; the flow runs here on the server
  const user = await getCurrentUser();
  if (!user) return { error: 'Please sign in to use this feature.' };

  const patientDescription = String(formData.get('patientDescription') ?? formData.get('description') ?? '').trim();
  if (patientDescription.length < 10) return { error: 'Please describe the problem in a little more detail.' };

  try {
    const { generateObjectiveNotes } = await import('@/ai/flows/generate-objective-notes');
    const result = await generateObjectiveNotes({ patientDescription });
    return { objectiveNotes: result.objectiveNotes };
  } catch (error: any) {
    console.error('Error generating objective notes:', error?.message);
    return { error: 'Failed to generate notes.' };
  }
}

/**
 * Lock the PCR. The server then creates the payout line itself (tier fee, GST on the fee, TDS) when the payment, the
 * start code and the lock are all in place, and says so in its reply.
 */
export async function createPayoutItemForBooking(bookingId: number): Promise<{ success: boolean; message: string; payoutItemId?: string; }> {
  const res = await updatePcrDetailed(bookingId, { status: 'locked', pcrStatus: 'locked' } as any);
  if (!res.ok) return { success: false, message: res.error || 'The report could not be locked.' };
  if (res.payout && res.payout.created === false) {
    return { success: true, message: `Report locked. No payout line was made yet: ${res.payout.reason || 'a condition is missing'}.` };
  }
  return { success: true, message: 'Report locked and the payout was scheduled.' };
}

/**
 * Generate missing referral codes for therapists
 */
export async function generateMissingTherapistCodes(): Promise<Coupon[]> {
  const token = await getToken();
  try {
    const { data } = await serverApi.post('/api/coupons/generate-missing', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data ?? [];
  } catch (error: any) {
    console.error(`Error marking notification  as read via API:`, error?.response?.status, error?.response?.data, error?.message);
    return [];
  }
}

import {
  createSupportTicket as createTicketRepo,
  replyToSupportTicket as replyTicketRepo,
  closeSupportTicket as closeTicketRepo,
  submitContactUs as submitContactUsRepo
} from '@/lib/repos/support';

/**
 * Create a support ticket
 */
export async function createSupportTicket(data: any) {
  return await createTicketRepo(data);
}

/**
 * Submit contact us form
 */
export async function submitContactUsAction(data: any) {
  return await submitContactUsRepo(data);
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
    console.error(`Error marking notification  as read via API:`, error?.response?.status, error?.response?.data, error?.message);
    return { success: false, error: 'Failed to log AI feedback.' };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const token = await getToken();
  try {
    const { data } = await serverApi.post(`/api/notifications/read/${notificationId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error: any) {
    console.error(`Error marking notification  as read via API:`, error?.response?.status, error?.response?.data, error?.message);
    return { success: false, error: 'Failed to mark notification as read.' };
  }
}

/**
 * Update the status of a journal/knowledge base entry (e.g., Approve & Publish)
 */
export async function updateJournalStatus(
  id: string | number,
  status: "published" | "draft" | "pending_review" | "archived" | "scheduled",
  token?: string,
  publishedAt?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const payload: any = { status };
    if (publishedAt) payload.publishedAt = publishedAt;
    
    const { data } = await serverApi.patch(
      `/api/general/knowledge-base/${id}/status`,
      payload,
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
    console.error(`Error marking notification  as read via API:`, error?.response?.status, error?.response?.data, error?.message);
    return {
      success: false,
      message: (error.response?.data?.error || error.response?.data?.message) || 'Failed to update journal status.'
    };
  }
}

/**
 * Delete a journal/knowledge base entry
 */
export async function deleteJournal(
  id: string | number,
  token?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { data } = await serverApi.delete(
      `/api/general/knowledge-base/delete/${id}`,
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );

    return {
      success: data.success ?? true,
      message: data.message || `Journal entry deleted successfully.`
    };
  } catch (error: any) {
    console.error(`Error marking notification  as read via API:`, error?.response?.status, error?.response?.data, error?.message);
    return {
      success: false,
      message: (error.response?.data?.error || error.response?.data?.message) || 'Failed to delete journal.'
    };
  }
}


import { requestReturn, approveReturn, listReturns, returnStep } from './repos/returns';
import { listRefunds, getMyRefunds, initiateRefund } from './repos/refunds';

/**
 * Request a return for an order
 */
export async function requestReturnAction(orderId: number, data?: any) {
  const res = await requestReturn(orderId, data);
  if (res.success) {
    revalidatePath('/dashboard/patient/orders');
    revalidatePath('/dashboard/admin/returns');
  }
  return res;
}

/**
 * Approve a return request (Admin)
 */
export async function approveReturnAction(returnId: string | number) {
  const res = await approveReturn(returnId);
  if (res.success) {
    revalidatePath('/dashboard/admin/returns');
    revalidatePath('/dashboard/ecom-admin/returns');
  }
  return res;
}

/** Reject, receive or inspect a return (Admin) */
export async function returnStepAction(returnId: string | number, step: 'reject' | 'receive' | 'inspect', body: Record<string, unknown> = {}) {
  const res = await returnStep(returnId, step, body);
  if (res.success) {
    revalidatePath('/dashboard/admin/returns');
    revalidatePath('/dashboard/ecom-admin/returns');
    revalidatePath('/dashboard/patient/orders');
  }
  return res;
}

/**
 * Initiate a refund (Admin)
 */
export async function initiateRefundAction(data: { orderId: string | number; amount: number; reason?: string }) {
  const res = await initiateRefund(data);
  if (res.success) {
    revalidatePath('/dashboard/admin/orders');
    revalidatePath('/dashboard/admin/returns');
  }
  return res;
}

/**
 * List refunds (Admin)
 */
export async function listRefundsAction(filters?: any) {
  return await listRefunds(filters);
}

/**
 * List user refunds
 */
export async function getMyRefundsAction() {
  return await getMyRefunds();
}

/**
 * List returns (Admin)
 */
export async function listReturnsAction(filters?: any) {
  return await listReturns(filters);
}

/**
 * Submit a review for a therapist via an appointment
 */
export async function submitTherapistReviewAction(appointmentId: string | number, data: { rating: number, review: string }) {
  const token = await getToken();
  try {
    const response = await serverApi.post(`/api/appointments/${appointmentId}/review`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return { success: true, ...response.data };
  } catch (error: any) {
    console.error("Failed to submit review:", error?.response?.data || error?.message);
    return { success: false, error: error?.response?.data?.error || "Failed to submit review" };
  }
}

/**
 * Update FCM Token for push notifications
 */
export async function updateFcmTokenAction(fcmToken: string) {
  const token = await getToken();
  if (!token) return { success: false, message: "Unauthorized" };

  try {
    const response = await serverApi.put(`/api/auth/update-fcm-token`, { fcm_token: fcmToken }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return { success: true, ...response.data };
  } catch (error: any) {
    console.error("Failed to update FCM token:", error?.response?.data || error?.message);
    return { success: false, message: "Failed to update FCM token" };
  }
}
