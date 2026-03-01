import serverApi from '@/lib/repos/axios.server';
import type { Appointment, ApiResponse } from '@/lib/types';
import { getSafeDate } from '@/lib/utils';

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
        const { data: response } = await serverApi.get<ApiResponse<Appointment[]>>('/api/appointments', {
            params: filters,
        });

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
                appt.id.toLowerCase().includes(searchTerm)
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
export async function getAppointmentById(id: string): Promise<Appointment | null> {
    if (!id) return null;

    try {
        const { data: response } = await serverApi.get<ApiResponse<Appointment>>(`/api/appointments/${id}`);
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
export async function listAppointmentsForUser(userId: number, role: 'patient' | 'therapist'): Promise<Appointment[]> {
    try {
        const { data: response } = await serverApi.get<ApiResponse<Appointment[]>>(`/api/appointments/user/${userId}/appointments`, {
            params: { role },
            withCredentials: true,
        });
        if (response.status === 304) {
            // cached data use करो या empty array return करो
            return [];
        }
        const appointmentsData = response?.data ?? [];

        return appointmentsData.map(appt => ({
            ...appt,
            date: appt.date,
             createdAt: appt.createdAt, // Firestore Timestamp
            startTime: appt.startTime, // Firestore Timestamp
            endTime: appt.endTime,     // Firestore Timestamp
        }));
    } catch (err) {
        console.error('Error fetching user appointments:', err);
        return [];
    }
}