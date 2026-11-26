import serverApi from "@/lib/repos/axios.server";
import type { Appointment } from '../types';
import { getToken } from "@/lib/auth";

type BookingInput = Omit<Appointment, 'id' | 'createdAt' | 'paymentStatus' | 'pcrStatus'>;

// Prices, status, payment state and the patient id are decided by the server. They are not sent.
function toServerBooking(b: BookingInput) {
  const {
    serviceAmount, totalAmount, status, verificationStatus, patientId,
    ...rest
  } = b as any;
  return rest;
}

export interface BookingPaymentStart {
  success: boolean;
  appointmentId?: number;
  /** true when the therapist must approve first; the patient pays afterwards with "Pay now" */
  requiresApproval?: boolean;
  razorpayOrderId?: string;
  amountPaise?: number;
  keyId?: string;
  paidWith?: string;
  carePackId?: number;
  sessionsRemaining?: number;
  error?: string;
}

function fail(error: any, fallback: string): { success: false; error: string } {
  console.error(fallback, error?.response?.data || error?.message);
  return { success: false, error: error?.response?.data?.error || error?.response?.data?.message || fallback };
}

/**
 * Step A of a direct booking. The server prices the session and either returns a Razorpay order
 * (pay immediately) or asks for therapist approval first. The 2nd argument is kept for
 * compatibility and ignored.
 */
export async function createBookingAndInvoice(
  bookingData: BookingInput,
  _legacyPaymentDetails?: unknown
): Promise<BookingPaymentStart> {
  try {
    const token = await getToken();
    const { data } = await serverApi.post(
      '/api/appointments/create-appointment',
      { bookingData: toServerBooking(bookingData) },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!data?.success) return { success: false, error: data?.error || 'Failed to create booking' };
    return {
      success: true,
      appointmentId: data.appointmentId,
      requiresApproval: !!data.requiresApproval,
      razorpayOrderId: data.razorpayOrderId,
      amountPaise: data.amountPaise,
      keyId: data.keyId,
      paidWith: data.paidWith,
      carePackId: data.carePackId,
      sessionsRemaining: data.sessionsRemaining,
    };
  } catch (error: any) {
    return fail(error, 'Failed to create booking');
  }
}

/** "Request a therapist": no therapist and no payment yet. Never creates a paid booking. */
export async function requestTherapist(bookingData: BookingInput): Promise<{ success: boolean; appointmentId?: number; error?: string }> {
  try {
    const token = await getToken();
    const { data } = await serverApi.post(
      '/api/appointments/request',
      { bookingData: toServerBooking(bookingData) },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!data?.success) return { success: false, error: data?.error || 'Failed to submit request' };
    return { success: true, appointmentId: data.appointmentId };
  } catch (error: any) {
    return fail(error, 'Failed to submit request');
  }
}

/** "Pay now" for an accepted booking/request: asks the server for a Razorpay order. */
export async function startAppointmentPayment(appointmentId: number): Promise<BookingPaymentStart> {
  try {
    const token = await getToken();
    const { data } = await serverApi.post(
      '/api/appointments/create-appointment',
      { appointmentId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!data?.success) return { success: false, error: data?.error || 'Could not start payment' };
    return { success: true, appointmentId: data.appointmentId, razorpayOrderId: data.razorpayOrderId, amountPaise: data.amountPaise, keyId: data.keyId };
  } catch (error: any) {
    return fail(error, 'Could not start payment');
  }
}

/** Step B: the server checks the Razorpay signature before the booking becomes Paid. */
export async function verifyBookingPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getToken();
    const { data } = await serverApi.post(
      '/api/payments/verify-booking',
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: !!data?.success };
  } catch (error: any) {
    return { success: false, error: error?.response?.data?.message || 'Payment could not be verified' };
  }
}
