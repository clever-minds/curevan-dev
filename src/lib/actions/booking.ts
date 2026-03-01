import axios from "axios";
import type { Appointment, AuditLog } from '../types';

async function getNextInvoiceNumber(type: 'goods' | 'service'): Promise<string> {
    const series = type === 'goods' ? 'ORD' : 'BK';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `INV-${series}-${randomNum}`;
}

/**
 * Creates a new appointment and a corresponding invoice
 * by calling a backend API instead of Firebase.
 */
export async function createBookingAndInvoice(
    bookingData: Omit<Appointment, 'id' | 'createdAt' | 'paymentStatus' | 'pcrStatus'>,
    paymentDetails: { paymentId: string; gateway: string; }
): Promise<{ success: boolean; appointmentId?: string; error?: string }> {

    try {
        // 1️⃣ Prepare payload for backend API
        const payload = {
            bookingData: {
                ...bookingData,
                status: 'Pending',              // Ensure matches literal type
                verificationStatus: 'Pending',  // Or 'Not Verified' if your backend expects that
                paymentStatus: 'Paid',
                pcrStatus: 'not_started',
            },
            paymentDetails,
        };

        // 2️⃣ Call backend API
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/create-appointment`,
            payload,
            {
                headers: { "Content-Type": "application/json" },
                withCredentials: true, // ✅ send cookies/session info
            }
        );

        // 3️⃣ Return API result
        if (response.data?.success) {
            return { success: true, appointmentId: response.data?.appointmentId };
        } else {
            return { success: false, error: response.data?.error || 'Failed to create booking' };
        }

    } catch (error: any) {
        console.error("Error creating booking via API:", error.response || error.message);
        if (error?.response) {
            return { success: false, error: error.response.data?.message || 'API call failed' };
        }
        return { success: false, error: 'Something went wrong' };
    }
}