
'use server';

import { sub, startOfWeek, endOfWeek } from 'date-fns';
import type { Appointment, Therapist, PayoutItem, AuditLog } from '@/lib/types';
import { listAppointments, getAppointmentById } from '@/lib/repos/appointments';
import { getTherapistById } from '@/lib/repos/therapists';
import { addPayoutItem, getPayoutItemBySourceId } from '@/lib/repos/payouts';
import { addAuditLog } from '@/lib/repos/logs';


/**
 * This service encapsulates the logic for the weekly payout automation.
 * In a real-world scenario, the `runWeeklyPayout` function would be
 * triggered by a scheduled Cloud Function (e.g., every Friday at 10:00 AM).
 */

/**
 * This function is the core logic that should be triggered when a PCR is locked.
 * It creates a `payoutItems` ledger entry for a given booking.
 * @param bookingId The ID of the booking associated with the locked PCR.
 */
export async function createPayoutItemForBooking(bookingId: number): Promise<{ success: boolean; message: string; payoutItemId?: string; }> {
  console.log(`Triggered payout item creation for bookingId: ${bookingId}`);
  
  // Idempotency Check: Has a payout item already been created for this booking?
  const existingItem = await getPayoutItemBySourceId(bookingId);
  if (existingItem) {
    console.log(`Payout item for booking ${bookingId} already exists. Skipping.`);
    return { success: true, message: 'Payout item already exists.' };
  }

  // 1. Fetch related documents
  const appointment = await getAppointmentById(bookingId);
  if (!appointment) {
    return { success: false, message: `Appointment ${bookingId} not found.` };
  }
  
  const therapist = await getTherapistById(appointment.therapistId);
  if (!therapist) {
    return { success: false, message: `Therapist ${appointment.therapistId} not found.` };
  }
  
  // 2. Validate conditions for payout
  const isPaid = appointment.paymentStatus === 'Paid';
  const isValidStatus = ['Completed', 'Confirmed'].includes(appointment.status); // Allow late PCR locks

  if (!isPaid) {
    return { success: false, message: `Booking ${bookingId} is not paid.` };
  }
  if (!isValidStatus) {
    return { success: false, message: `Booking ${bookingId} has an invalid status: ${appointment.status}.` };
  }

  // 3. Compute payout details
  const grossAmount = appointment.serviceAmount || appointment.totalAmount || 0;
  const membershipPlanSnapshot = therapist.membershipPlan || 'standard';
  const platformFeePct = membershipPlanSnapshot === 'premium' ? 0.10 : 0.00;
  const platformFeeAmount = Math.round(grossAmount * platformFeePct);
  const netAmount = grossAmount - platformFeeAmount;
  
  const bookingDate = new Date(appointment.date);
  const weekStart = startOfWeek(bookingDate, { weekStartsOn: 1 }).toISOString();

  // 4. Create the payoutItems document
  const newPayoutItem: PayoutItem = {
    type: 'service',
    sourceId: bookingId,
    therapistId: appointment.therapistId,
    patientId: appointment.patientId,
    serviceTypeId: appointment.serviceTypeId,
    grossAmount,
    platformFeePct,
    platformFeeAmount,
    netAmount,
    currency: 'INR',
    state: 'onHold', // Default state, to be picked up by weekly batch job
    weekStart: weekStart,
    createdAt: new Date() as any, // Cast for mock environment
    membershipPlanSnapshot,
  };
  
  const createdItem = await addPayoutItem(newPayoutItem);
  
  // 5. Create the audit log entry
  const auditLog: AuditLog = {
      actorId: 'system',
      action: 'payout.item.created',
      entityType: 'booking',
      entityId: bookingId,
      timestamp: new Date() as any, // Cast for mock environment
      details: {
          payoutItemId: createdItem.id,
          netAmount: netAmount,
          therapistId: therapist.id,
      }
  };
  await addAuditLog(auditLog);

  console.log(`Successfully created payout item ${createdItem.id} for booking ${bookingId}.`);

  return { success: true, message: 'Payout item created successfully.', payoutItemId: createdItem.id };
}


/**
 * This service encapsulates the logic for the weekly payout automation.
 * In a real-world scenario, the `runWeeklyPayout` function would be
 * triggered by a scheduled Cloud Function (e.g., every Friday at 10:00 AM).
 */
/**
 * Executes the weekly payout process for all eligible therapists.
 */
export async function runWeeklyPayout() {
  console.log('Starting weekly payout process...');

  // 1. Determine the date range for the previous week (Monday to Sunday)
  const today = new Date();
  const lastWeek = sub(today, { weeks: 1 });
  const startOfLastWeek = startOfWeek(lastWeek, { weekStartsOn: 1 }); // Monday
  const endOfLastWeek = endOfWeek(lastWeek, { weekStartsOn: 1 });     // Sunday

  console.log(`Processing payouts for period: ${startOfLastWeek.toISOString()} to ${endOfLastWeek.toISOString()}`);

  // 2. Query for all eligible appointments within the date range
  const eligibleAppointments = await getEligibleAppointments(startOfLastWeek, endOfLastWeek);

  if (eligibleAppointments.length === 0) {
    console.log('No eligible appointments found for this payout period. Exiting.');
    return { status: 'success', message: 'No eligible appointments to process.' };
  }

  // 3. Group appointments by therapist
  const appointmentsByTherapist = eligibleAppointments.reduce((acc, appt) => {
    const therapistId = appt.therapistId;
    if (!acc[therapistId]) {
      acc[therapistId] = [];
    }
    acc[therapistId].push(appt);
    return acc;
  }, {} as Record<string, any[]>);

  // 4. Process payouts for each therapist
  for (const therapistId in appointmentsByTherapist) {
    const therapistAppointments = appointmentsByTherapist[therapistId];
    console.log(`Processing payout for therapist ${therapistId} with ${therapistAppointments.length} appointments.`);

    try {
        const { payoutItems, totals } = await createPayoutItemsForBatch(therapistAppointments);
        const batchId = await createPayoutBatch(therapistId, startOfLastWeek, endOfLastWeek, totals);
        await updatePayoutItemsWithBatchId(payoutItems, batchId);
        await sendPayoutNotification(therapistId, totals.net);

    } catch (error) {
        console.error(`Failed to process payout for therapist ${therapistId}`, error);
    }
  }

  console.log('Weekly payout process completed.');
  return { status: 'success', message: 'Payouts processed.' };
}

async function getEligibleAppointments(startDate: Date, endDate: Date): Promise<any[]> {
    console.log(`Querying eligible appointments between ${startDate} and ${endDate}`);
    return [
        { bookingId: 'BK-001', therapistId: 'therapist-123', gross: 1500, commission: 150 },
        { bookingId: 'BK-003', therapistId: 'therapist-123', gross: 2000, commission: 200 },
        { bookingId: 'BK-007', therapistId: 'therapist-456', gross: 1800, commission: 180 },
    ];
}

async function createPayoutItemsForBatch(appointments: any[]) {
    const payoutItems: any[] = [];
    const totals = { gross: 0, commission: 0, penalties: 0, net: 0 };
    
    for (const appt of appointments) {
        const net = appt.gross - appt.commission;
        const item = {
            therapistId: appt.therapistId,
            bookingId: appt.bookingId,
            gross: appt.gross,
            commission: appt.commission,
            penalties: 0,
            refunds: 0,
            net: net,
            state: 'inBatch'
        };
        payoutItems.push({ id: 'mock-item-id', ...item });
        totals.gross += item.gross;
        totals.commission += item.commission;
        totals.net += item.net;
    }

    return { payoutItems, totals };
}

async function createPayoutBatch(therapistId: string, weekStart: Date, weekEnd: Date, totals: any) {
    const batch = {
        therapistId,
        weekStart: weekStart,
        weekEnd: weekEnd,
        payoutDate: new Date(),
        totals,
        status: 'processing',
    };
    return 'mock-batch-id';
}

async function updatePayoutItemsWithBatchId(payoutItems: any[], batchId: string) {
    console.log(`Updated ${payoutItems.length} items with batchId ${batchId}`);
}

async function sendPayoutNotification(therapistId: string, netAmount: number) {
    const notification = {
        userId: therapistId,
        type: 'payment_receipt',
        title: 'Payout Processed',
        message: `Your weekly payout of ₹${netAmount.toFixed(2)} has been processed.`,
        read: false,
        createdAt: new Date(),
        link: '/dashboard/earnings'
    };
    console.log(`Sent notification to therapist ${therapistId}`);
}
