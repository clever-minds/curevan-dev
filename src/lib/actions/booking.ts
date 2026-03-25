import serverApi from "@/lib/repos/axios.server";
import type { Appointment } from '../types';
import { getToken } from "@/lib/auth";
/**
 * Creates a new appointment and a corresponding invoice
 * by calling backend API using serverApi.
 */
export async function createBookingAndInvoice(
  bookingData: Omit<Appointment, 'id' | 'createdAt' | 'paymentStatus' | 'pcrStatus'>,
  paymentDetails: { paymentId: string; gateway: string; }
): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  try {
    // 1️⃣ Prepare payload
    const payload = {
      bookingData: {
        ...bookingData,
        status: 'Pending',               // Matches backend expectation
        verificationStatus: 'Pending',   // Or 'Not Verified' if required
        paymentStatus: 'Paid',
        pcrStatus: 'not_started',
      },
      paymentDetails,
    };
const token = await getToken();
    // 2️⃣ Call backend API via serverApi
    const { data } = await serverApi.post(
      '/api/appointments/create-appointment',
      payload,
      {
        headers: {  
          Authorization: `Bearer ${token}`,
        }, // use same style as cart/consent
      }
    );

    // 3️⃣ Return API result
    if (data?.success) {
      return { success: true, appointmentId: data?.appointmentId };
    } else {
      return { success: false, error: data?.error || 'Failed to create booking' };
    }

  } catch (error: any) {
    console.error("Error creating booking via API:", error?.response || error?.message);
    if (error?.response) {
      return { success: false, error: error.response.data?.message || 'API call failed' };
    }
    return { success: false, error: 'Something went wrong' };
  }
}