
import { describe, it, expect } from 'vitest';

// Mock data and functions based on what's in the app
const mockTherapist = {
    availability: {
        windows: {
            mon: { enabled: true, morning: { start: '09:00', end: '13:00' }, evening: { start: '16:00', end: '18:00' } },
            tue: { enabled: false, morning: { start: '09:00', end: '13:00' }, evening: { start: '16:00', end: '18:00' } },
        }
    }
};

const mockBookedAppointments = [
    { date: new Date('2024-08-05'), time: '10:00', status: 'Confirmed' } // Monday
];

// This is the core logic from the booking form, refactored into a testable function.
function isTimeSlotAvailable(
    time: string, 
    selectedDate: Date, 
    therapist: any, 
    bookedAppointments: any[]
): boolean {
    if (!selectedDate) return false;

    const dayOfWeek = selectedDate.toLocaleString('en-US', { weekday: 'short' }).toLowerCase();
    const availability = therapist.availability.windows[dayOfWeek];
    if (!availability || !availability.enabled) return false;

    const [hour] = time.split(':').map(Number);
    const morningStart = parseInt(availability.morning.start.split(':')[0]);
    const morningEnd = parseInt(availability.morning.end.split(':')[0]);
    const eveningStart = parseInt(availability.evening.start.split(':')[0]);
    const eveningEnd = parseInt(availability.evening.end.split(':')[0]);

    const isWithinHours = (hour >= morningStart && hour < morningEnd) || (hour >= eveningStart && hour < eveningEnd);
    if (!isWithinHours) return false;

    const isBooked = bookedAppointments.some(app => 
        app.date.getTime() === selectedDate.getTime() &&
        app.time === time &&
        app.status !== 'Cancelled'
    );
    return !isBooked;
}

describe('Booking Logic: isTimeSlotAvailable', () => {
    const monday = new Date('2024-08-05'); // A Monday
    const tuesday = new Date('2024-08-06'); // A Tuesday

    it('should return true for an available slot within working hours', () => {
        expect(isTimeSlotAvailable('09:00', monday, mockTherapist, mockBookedAppointments)).toBe(true);
    });

    it('should return false for a slot that is already booked', () => {
        expect(isTimeSlotAvailable('10:00', monday, mockTherapist, mockBookedAppointments)).toBe(false);
    });

    it('should return false for a slot outside of working hours (in the gap)', () => {
        expect(isTimeSlotAvailable('14:00', monday, mockTherapist, mockBookedAppointments)).toBe(false);
    });

    it('should return false for a day the therapist is not working', () => {
        expect(isTimeSlotAvailable('09:00', tuesday, mockTherapist, mockBookedAppointments)).toBe(false);
    });
});
