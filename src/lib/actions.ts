

'use server';

import { db } from '@/lib/db';
import { getStorage } from 'firebase-admin/storage';
import { z } from 'zod';
import { generateObjectiveNotes } from '@/ai/flows/generate-objective-notes';
import type { AIFeedback, Appointment, AuditLog, Coupon, PayoutItem, ProfileChangeRequest, SupportTicket, Therapist } from '@/lib/types';
import { startOfWeek } from 'date-fns';
import { getAppointmentById } from './repos/appointments';
import { getTherapistProfileById } from './repos/therapistProfiles';
import { listTherapists } from './repos/therapists';
import { addAuditLog } from './repos/logs';
import { addPayoutItem, getPayoutItemBySourceId } from './repos/payouts';
import { updatePcr } from './repos/pcr';
import { FieldValue } from 'firebase-admin/firestore';
import { listCoupons } from './repos/coupons';
import { getCurrentUser } from './api/auth';
import { revalidatePath } from 'next/cache';

// --- File Upload Action ---
/**
 * Uploads a file to Firebase Storage and returns its public URL.
 * @param formData - The FormData object containing the file.
 * @returns An object with either the fileUrl or an error message.
 */
export async function uploadFile(formData: FormData): Promise<{ fileUrl?: string; error?: string }> {
  const file = formData.get('file') as File;
  if (!file) {
    return { error: 'No file provided.' };
  }

  try {
    const storage = getStorage();
    const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    
    // Create a unique filename
    const fileName = `${Date.now()}-${file.name}`;
    const fileRef = bucket.file(fileName);

    // Upload the file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make the file public and get its URL
    await fileRef.makePublic();
    const fileUrl = fileRef.publicUrl();

    console.log(`File uploaded successfully: ${fileUrl}`);
    return { fileUrl };

  } catch (error) {
    console.error('File upload failed:', error);
    return { error: 'Failed to upload file.' };
  }
}


type State = {
  objectiveNotes?: string;
  error?: string | null;
};

export async function handleGenerateNotes(
  prevState: State,
  formData: FormData
): Promise<State> {
  const ObjectiveNotesSchema = z.object({
    patientDescription: z
      .string()
      .min(10, 'Please provide a more detailed description.'),
  });
  
  try {
    const parsed = ObjectiveNotesSchema.parse({
      patientDescription: formData.get('patientDescription'),
    });

    const result = await generateObjectiveNotes(parsed);

    if (!result || !result.objectiveNotes) {
      return { error: 'Failed to generate notes. Please try again.' };
    }

    return { objectiveNotes: result.objectiveNotes, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors[0].message };
    }
    console.error(e);
    return { error: 'An unexpected error occurred.' };
  }
}

/**
 * This function is the core logic that should be triggered when a PCR is locked.
 * It creates a `payoutItems` ledger entry for a given booking.
 * @param bookingId The ID of the booking associated with the locked PCR.
 */
export async function createPayoutItemForBooking(bookingId: string): Promise<{ success: boolean; message: string; payoutItemId?: string; }> {
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
    createdAt: FieldValue.serverTimestamp() as any,
    membershipPlanSnapshot,
  };
  
  const createdItem = await addPayoutItem(newPayoutItem);

  // 5. Create the audit log entry
  const auditLog: AuditLog = {
      actorId: 'system',
      action: 'payout.item.created',
      entityType: 'booking',
      entityId: bookingId,
      timestamp: FieldValue.serverTimestamp() as any,
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
 * Generates missing referral codes for therapists who are public and active.
 * This is an idempotent operation.
 */
export async function generateMissingTherapistCodes(): Promise<Coupon[]> {
    const allTherapists = await listTherapists();
    const allCoupons = await listCoupons();

    const therapistsWithCodes = new Set(allCoupons.map(c => c.therapistId));
    
    const therapistsMissingCodes = allTherapists.filter(t => 
        !therapistsWithCodes.has(t.id) && t.isProfilePublic === true
    );

    if (therapistsMissingCodes.length === 0) {
        return [];
    }

    const newCoupons: Coupon[] = [];
    const batch = db.batch();

    for (const therapist of therapistsMissingCodes) {
        const newCode = `DR${therapist.name.split(' ').pop()?.toUpperCase()}${Math.floor(Math.random() * 90) + 10}`;
        const newCoupon: Coupon = {
            id: `coupon-${therapist.id}`,
            code: newCode,
            therapistId: therapist.id,
            discountType: 'percent',
            value: 0.05,
            permanent: true,
            active: true,
            status: 'Active',
            createdAt: FieldValue.serverTimestamp() as any,
        };
        
        const couponRef = db.collection('coupons').doc(newCoupon.id);
        batch.set(couponRef, newCoupon);
        newCoupons.push(newCoupon);
    }
    
    await batch.commit();
    console.log(`Generated ${newCoupons.length} new referral codes.`);
    return newCoupons;
}


const supportTicketSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  subject: z.string(),
  message: z.string(),
  topic: z.string(),
});

export async function createSupportTicket(data: unknown): Promise<{ success: boolean; error?: string; ticketId?: string }> {
  try {
    const validatedData = supportTicketSchema.parse(data);
    const user = await getCurrentUser();

    // In a real app, you might want to link this to a user ID if they are logged in.
    const newTicket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'| 'status'> = {
      userId: user?.uid || validatedData.email,
      topic: validatedData.topic,
      subject: validatedData.subject,
      messages: [
        { by: 'user', at: new Date().toISOString(), text: validatedData.message }
      ]
    };

    const docRef = await db.collection('supportTickets').add({
        ...newTicket,
        status: 'open',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
    
    console.log(`Support ticket created with ID: ${docRef.id}`);
    return { success: true, ticketId: docRef.id };

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation failed for support ticket:', error.errors);
      return { success: false, error: "Validation failed. Please check your input." };
    }
    console.error('Error creating support ticket:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function reviewProfileChangeRequest(
  requestId: string,
  action: 'approve' | 'reject',
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || (!user.roles?.includes('admin.super') && !user.roles?.includes('admin.therapy'))) {
    return { success: false, error: 'Permission denied.' };
  }
  
  const requestRef = db.collection('profileChangeRequests').doc(requestId);

  try {
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) {
      return { success: false, error: 'Request not found.' };
    }
    const requestData = requestSnap.data() as ProfileChangeRequest;

    if (requestData.status !== 'pending') {
      return { success: false, error: 'This request has already been processed.' };
    }
    
    const batch = db.batch();
    const updatePayload: Record<string, any> = {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedAt: FieldValue.serverTimestamp(),
        reviewerId: user.uid,
    };
    if (reason) {
        updatePayload.reason = reason;
    }

    // Only apply changes if the action is 'approve'
    if (action === 'approve') {
        const isTherapist = requestData.role === 'therapist';
        const collectionName = isTherapist ? 'therapistProfiles' : 'patientProfiles';
        const entityRef = db.collection(collectionName).doc(requestData.entityId);

        const updateData: Record<string, any> = {};
        for (const change of requestData.changes) {
            updateData[change.fieldPath] = change.new;
        }

        // The key change: only set isProfilePublic for therapists upon approval
        if (isTherapist) {
          updateData.isProfilePublic = true;
        }
        
        batch.update(entityRef, updateData);
    }
    
    batch.update(requestRef, updatePayload);

    await batch.commit();

    await addAuditLog({
        actorId: user.uid,
        action: `profileChange.${action}`,
        entityType: 'profileChangeRequest',
        entityId: requestId,
        details: { targetUser: requestData.userId, reason: reason || 'N/A' },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error processing profile change request:', error);
    return { success: false, error: 'An unexpected server error occurred.' };
  }
}

/**
 * Logs user feedback for an AI interaction to the `aiFeedback` collection.
 */
export async function logAIFeedbackAction(
  feedbackData: Omit<AIFeedback, 'id' | 'timestamp' | 'userId'>
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'User must be logged in to provide feedback.' };
  }

  try {
    const feedbackRef = db.collection('aiFeedback').doc();
    await feedbackRef.set({
      ...feedbackData,
      id: feedbackRef.id,
      userId: user.uid,
      timestamp: FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error logging AI feedback:', error);
    return { success: false, error: 'Failed to save feedback.' };
  }
}

/**
 * Marks a specific notification as read for the currently authenticated user.
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const notificationRef = db.collection('notifications').doc(notificationId);
    const doc = await notificationRef.get();

    if (!doc.exists) {
        return { success: false, error: 'Notification not found.' };
    }

    const notificationData = doc.data();

    // Security check: Make sure the user owns this notification
    if (notificationData?.userId !== user.uid) {
        return { success: false, error: 'Permission denied.' };
    }

    // Only update if it's not already read to avoid unnecessary writes
    if (notificationData.read === false) {
       await notificationRef.update({ read: true });
    }
    
    // Revalidate the path to ensure the UI updates on the next visit.
    // This is a Next.js 13+ feature for server actions.
    revalidatePath('/dashboard/notifications', 'layout');

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Failed to update notification.' };
  }
}
