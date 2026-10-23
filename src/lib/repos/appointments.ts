import serverApi from '@/lib/repos/axios.server';
import type { Appointment, ApiResponse } from '@/lib/types';
import { getSafeDate } from '@/lib/utils';
import { getToken } from '@/lib/auth';

/**
 * List all appointments with optional filters
 */
function parseDate(ts: any): Date | undefined {
    if (!ts) return undefined;

    // Already JS Date
    if (ts instanceof Date) return ts;

    // Firestore Timestamp object
    if ('_seconds' in ts && '_nanoseconds' in ts) {
        return new Date(ts._seconds * 1000 + ts._nanoseconds / 1000000);
    }

    // String timestamp
    if (typeof ts === 'string') return new Date(ts);

    return undefined;
}
export async function listAppointments(filters?: any): Promise<Appointment[]> {
    try {
       const token =await getToken();
     if (!token) {
        throw new Error('Token missing, please login again');
      }
        const { data: response } =
          await serverApi.get<ApiResponse<Appointment[]>>(
            '/api/appointments',
            {
              params: filters,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        const appointmentsData = response?.data ?? [];

       const appointments = appointmentsData.map(appt => ({
            ...appt,
            date: appt.date,          // string
            createdAt: appt.createdAt, // Firestore Timestamp
            startTime: appt.startTime, // Firestore Timestamp
            endTime: appt.endTime,     // Firestore Timestamp
        }));

        if (filters?.search) {
            const searchTerm = filters.search.toLowerCase();
            return appointments.filter(appt =>
                appt.patientName.toLowerCase().includes(searchTerm) ||
                appt.therapist.toLowerCase().includes(searchTerm) ||
                appt.id.toString().includes(searchTerm)
            );
        }

        return appointments;

    } catch (err) {
        console.error('Error fetching appointments:', err);
        return [];
    }
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id: number): Promise<Appointment | null> {
  console.log(`Fetching appointment by ID: ${id}`);

    if (!id) return null;
    const token =await getToken();
     if (!token) {
        throw new Error('Token missing, please login again');
      }
    try {
        const { data: response } = await serverApi.get<ApiResponse<Appointment>>(`/api/appointments/${id}`,{
          headers: {
            Authorization: `Bearer ${token}`, 
          },
        });
        const appt = response?.data;
        if (!appt) return null;

        // Firestore Timestamp object ko directly assign karo
        return {
            ...appt,
            date: appt.date,           // string
            createdAt: appt.createdAt, // Firestore Timestamp
            startTime: appt.startTime, // Firestore Timestamp
            endTime: appt.endTime,     // Firestore Timestamp
        };
    } catch (err) {
        console.error('Error fetching appointment by ID:', err);
        return null;
    }
}

/**
 * List appointments for a specific user (patient or therapist)
 */
export async function listAppointmentsForUser(
  userId: number,
  role: 'patient' | 'therapist'
): Promise<Appointment[]> {
  try {
     const token =await getToken();
     if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data: response } = await serverApi.get<ApiResponse<Appointment[]>>(
      `/api/appointments/user/${userId}/appointments`,
      {
        params: { role },
        withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`, 
          },
      }
    )

    // 🔹 Check success field, not status
    if (response?.success === false) {
      return []
    }

    const appointmentsData = response?.data ?? []

    return appointmentsData.map((appt) => ({
      ...appt,
      date: appt.date,
      createdAt: appt.createdAt, // Firestore Timestamp
      startTime: appt.startTime, // Firestore Timestamp
      endTime: appt.endTime,     // Firestore Timestamp
    }))
  } catch (err) {
    console.error('Error fetching user appointments:', err)
    return []
  }
}
export async function cancelAppointments(appointmentId: number): Promise<boolean> {
  try {
    const token =await getToken();
     if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data: response } = await serverApi.patch<ApiResponse<Appointment>>(
      `/api/appointments/${appointmentId}/cancel`,
      {},
      { 
        headers: {  
          Authorization: `Bearer ${token}`,
        }
      }
    )

    // 🔹 response.success use karo, status nahi
    return response?.success === true
  } catch (err) {
    console.error('Error cancelling appointment:', err)
    return false
  }
}

/**
 * Get available booking requests for therapists (Status: Searching)
 */
export async function getAvailableRequests(therapistId: number): Promise<Appointment[]> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');

    const { data: response } = await serverApi.get<ApiResponse<Appointment[]>>(
      `/api/appointments/requests/available`,
      {
        params: { therapistId },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response?.success ? (response.data ?? []) : [];
  } catch (err) {
    console.error('Error fetching available requests:', err);
    return [];
  }
}

/**
 * Accept a booking request
 */
export async function acceptBookingRequest(appointmentId: number, therapistData: any): Promise<{success: boolean, error?: string}> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');

    const { data: response } = await serverApi.post<ApiResponse<any>>(
      `/api/appointments/accept/${appointmentId}`,
      therapistData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { success: response?.success === true, error: response?.error };
  } catch (err: any) {
    console.error('Error accepting booking request:', err);
    return { success: false, error: err.response?.data?.error || err.message };
  }
}

/**
 * Update the status of an appointment (e.g. Navigating, Arrived, In Progress)
 */
export async function updateAppointmentStatus(appointmentId: number, status: string): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');

    const { data: response } = await serverApi.put<ApiResponse<any>>(
      `/api/appointments/status/${appointmentId}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response?.success === true;
  } catch (err) {
    console.error('Error updating appointment status:', err);
    return false;
  }
}

export interface CancelQuote {
  band: string; chargePct: number; chargeInr: number; refundInr: number; amountInr: number; paid: boolean; hoursBefore: number | null;
}

/** What cancelling costs right now (decided by the server). */
export async function getCancelQuote(appointmentId: number): Promise<{ quote?: CancelQuote; error?: string }> {
  try {
    const token = await getToken();
    if (!token) return { error: 'Please sign in again.' };
    const { data: response } = await serverApi.get<any>(`/api/appointments/${appointmentId}/cancel-quote`, { headers: { Authorization: `Bearer ${token}` } });
    return { quote: response?.data };
  } catch (err: any) {
    return { error: err?.response?.data?.error || 'Could not work out the cancellation charge.' };
  }
}

/** Cancel with the policy applied. `acceptedChargeInr` is the charge the patient saw and agreed to. */
export async function cancelWithPolicy(appointmentId: number, body: { reason?: string; acceptedChargeInr?: number }): Promise<{ success: boolean; error?: string; quote?: CancelQuote }> {
  try {
    const token = await getToken();
    if (!token) return { success: false, error: 'Please sign in again.' };
    const { data: response } = await serverApi.post<any>(`/api/appointments/${appointmentId}/cancel`, body, { headers: { Authorization: `Bearer ${token}` } });
    return { success: response?.success === true, quote: response?.quote };
  } catch (err: any) {
    const d = err?.response?.data;
    return { success: false, error: d?.error || 'Could not cancel the booking.', quote: err?.response?.status === 409 ? d?.quote : undefined };
  }
}

/** Bookable times for one therapist on one date (YYYY-MM-DD). The server decides; the form shows only these. */
export type FollowUpOptions = { mode: 'dates' | 'any' | 'none' | 'proposed' | 'booked'; dates?: string[]; message?: string; note?: string };

/** May the patient book a follow-up of this completed visit, and on which dates (the dates the doctor gave in the report)? */
export async function getFollowUpOptions(visitId: number): Promise<{ ok: true; options: FollowUpOptions } | { ok: false; error: string }> {
  try {
    const token = await getToken();
    const { data: response } = await serverApi.get<any>(`/api/appointments/${visitId}/follow-up-options`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return { ok: true, options: response.data };
  } catch (err: any) {
    return { ok: false, error: err?.response?.data?.error || 'Could not check the follow-up options.' };
  }
}

export async function getTherapistSlots(therapistId: number | string, date: string): Promise<{ slots: string[]; minLeadHours: number; maxAdvanceDays: number; error?: string }> {
  const fallback = { slots: [] as string[], minLeadHours: 4, maxAdvanceDays: 30 };
  try {
    const { data: response } = await serverApi.get<any>(`/api/therapists/${therapistId}/slots`, { params: { date } });
    const d = response?.data;
    return {
      slots: (d?.slots ?? []).map((x: { time: string }) => x.time),
      minLeadHours: Number(d?.minLeadHours) || fallback.minLeadHours,
      maxAdvanceDays: Number(d?.maxAdvanceDays) || fallback.maxAdvanceDays,
    };
  } catch (err: any) {
    return { ...fallback, error: err?.response?.data?.error || 'Could not load the available times.' };
  }
}

/**
 * Same as updateAppointmentStatus but also returns the server's reason when a move is refused.
 */
export async function transitionAppointment(appointmentId: number, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getToken();
    if (!token) return { success: false, error: 'Please sign in again.' };
    const { data: response } = await serverApi.put<ApiResponse<any>>(
      `/api/appointments/status/${appointmentId}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: response?.success === true };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.error || err?.message || 'Could not update the booking.' };
  }
}

/** Patient: the code to tell the therapist at the door. Only available shortly before the session. */
export async function getStartOtp(appointmentId: number): Promise<{ success: boolean; otp?: string; error?: string }> {
  try {
    const token = await getToken();
    if (!token) return { success: false, error: 'Please sign in again.' };
    const { data: response } = await serverApi.get<ApiResponse<{ otp: string }>>(
      `/api/appointments/${appointmentId}/otp`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: response?.success === true, otp: response?.data?.otp };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.error || 'The start code is not available yet.' };
  }
}

/** Therapist: check the code the patient gave. On success the session is "in progress". */
export async function verifyStartOtp(appointmentId: number, otp: string): Promise<{ success: boolean; error?: string; attemptsLeft?: number; locked?: boolean }> {
  try {
    const token = await getToken();
    if (!token) return { success: false, error: 'Please sign in again.' };
    const { data: response } = await serverApi.post<any>(
      `/api/appointments/${appointmentId}/verify-start-otp`,
      { otp },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: response?.success === true };
  } catch (err: any) {
    const d = err?.response?.data;
    return { success: false, error: d?.error || 'Could not verify the code.', attemptsLeft: d?.attemptsLeft, locked: err?.response?.status === 423 };
  }
}

/** Non-secret rule values (session timer, travel window, code length). */
export async function getPublicConfig(): Promise<{ timerMinutes: number; travelFromMinutesBefore: number; otpLength: number }> {
  const fallback = { timerMinutes: 60, travelFromMinutesBefore: 45, otpLength: 4 };
  try {
    const { data: response } = await serverApi.get<any>('/api/config/public');
    const d = response?.data;
    return {
      timerMinutes: Number(d?.session?.timerMinutes) || fallback.timerMinutes,
      travelFromMinutesBefore: Number(d?.visit?.travelFromMinutesBefore) || fallback.travelFromMinutesBefore,
      otpLength: Number(d?.otp?.length) || fallback.otpLength,
    };
  } catch {
    return fallback;
  }
}

/**
 * Submit a review for a completed appointment
 */
export async function submitReview(appointmentId: number, rating: number, review: string): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');

    const { data: response } = await serverApi.post<ApiResponse<any>>(
      `/api/appointments/${appointmentId}/review`,
      { rating, review },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response?.success === true;
  } catch (err) {
    console.error('Error submitting review:', err);
    return false;
  }
}
/**
 * Reject a booking request
 */
export async function rejectBookingRequest(appointmentId: number): Promise<{success: boolean, error?: string}> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');

    const { data: response } = await serverApi.post<ApiResponse<any>>(
      `/api/appointments/reject/${appointmentId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: response?.success === true, error: response?.error };
  } catch (err: any) {
    console.error('Error rejecting booking request:', err);
    return { success: false, error: err.response?.data?.error || err.message };
  }
}


export async function rescheduleAppointment(appointmentId: number, date: string, time: string): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing');
    const { data: response } = await serverApi.put<ApiResponse<any>>(
      `/api/appointments/reschedule/${appointmentId}`,
      { date, time },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response?.success === true;
  } catch (err: any) {
    console.error('Error rescheduling appointment:', err);
    throw new Error(err?.response?.data?.error || 'Failed to reschedule appointment');
  }
}
