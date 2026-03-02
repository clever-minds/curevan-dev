'use server';

import serverApi from "@/lib/repos/axios.server";
import type { 
  AIFeedback, Appointment, AuditLog, Coupon, PayoutItem, 
  ProfileChangeRequest, SupportTicket, Therapist 
} from '@/lib/types';
import { z } from 'zod';

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
export async function createPayoutItemForBooking(bookingId: string) {
  try {
    const { data } = await serverApi.post(`/api/payouts/create-item/${bookingId}`, null, {
      headers: { withCredentials: true },
    });
    return data;
  } catch (error: any) {
    console.error(`Error creating payout item for booking ${bookingId}:`, error?.response || error?.message);
    return { success: false, message: 'Failed to create payout item.' };
  }
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