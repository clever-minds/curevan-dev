
'use server';

import { getFirestore, Timestamp } from 'firebase-admin/firestore';

/**
 * @fileoverview This file contains the logic for server-side validation hooks.
 * In a production Firebase environment, these functions would be deployed as
 * Cloud Functions that trigger on specific Firestore document events
 * (e.g., onCreate, onUpdate). This ensures data integrity and automates
 * key business logic.
 */

const db = getFirestore();

/**
 * TRIGGER: onCreate on `paymentTransactions` collection.
 *
 * When a new payment transaction is created with status 'paid', this function
 * updates the corresponding appointment's payment status.
 *
 * @param transaction - The newly created paymentTransaction document data.
 */
export async function onPaymentSuccess(transaction: { id: string; bookingId?: string; status: string }) {
  if (transaction.status !== 'paid' || !transaction.bookingId) {
    return; // Not a successful payment for a booking.
  }

  console.log(`Processing successful payment for booking: ${transaction.bookingId}`);

  const appointmentRef = db.collection('appointments').doc(transaction.bookingId);
  try {
    await appointmentRef.update({ 'payment.status': 'paid' });
    console.log(`Marked appointment ${transaction.bookingId} as paid.`);
  } catch (error) {
    console.error(`Failed to update appointment ${transaction.bookingId} after payment.`, error);
  }
}

/**
 * TRIGGER: onUpdate on `pcr` collection.
 *
 * When a PCR's status is changed to 'locked', this function re-evaluates
 * the payout eligibility flags for the associated booking.
 *
 * @param pcr - The updated PCR document data.
 */
export async function onPcrLocked(pcr: { id: string; lockStatus: string }) {
  if (pcr.lockStatus !== 'Final') {
    return; // Only act when the PCR is finalized/locked.
  }
  
  const bookingId = pcr.id; // Assuming PCR doc ID is the bookingId
  console.log(`PCR for booking ${bookingId} has been locked. Re-evaluating eligibility.`);
  
  const appointmentRef = db.collection('appointments').doc(bookingId);
  try {
    // In a real app, you might have a more complex eligibility engine.
    // This is a simplified example.
    await appointmentRef.update({ 'eligibility.pcrLocked': true });
    console.log(`Updated eligibility flag for booking ${bookingId}.`);
  } catch (error) {
    console.error(`Failed to update eligibility for booking ${bookingId} after PCR lock.`, error);
  }
}

/**
 * TRIGGER: onWrite on `appointments` collection.
 *
 * When an appointment is created or updated, this function could be used
 * to synchronize data with other parts of the system, like verification logs.
 *
 * @param appointment - The created or updated appointment document data.
 */
export async function onAppointmentWrite(appointment: { id: string; status: string; therapistId: string }) {
  console.log(`Write event for appointment ${appointment.id} with status ${appointment.status}.`);
  
  // Example: If an appointment is confirmed, create a placeholder verification log.
  if (appointment.status === 'confirmed') {
    const verificationLogRef = db.collection('verificationLogs').doc(appointment.id);
    await verificationLogRef.set({
      bookingId: appointment.id,
      therapistId: appointment.therapistId,
      status: 'pending', // Awaiting verification at session start
      createdAt: Timestamp.now(),
    }, { merge: true });
    console.log(`Created/updated pending verification log for booking ${appointment.id}.`);
  }
}
