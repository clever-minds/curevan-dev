

'use client';

import { add, nextFriday, startOfWeek } from 'date-fns';

/**
 * Calculates the date of the next payout.
 * Payouts are on Friday for the work done from the previous Monday to Sunday.
 */
export function getNextPayoutDate(): string {
  const today = new Date();
  // Get the start of the current week (assuming Monday is the first day)
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
  // The payout for this week's work happens on the Friday of NEXT week.
  const payoutFriday = nextFriday(add(startOfThisWeek, { weeks: 1 }));
  
  return payoutFriday.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// In a real app, these would be API calls to a secure backend.

export interface EarningItem {
    source: string; // bookingId or orderId
    patientName?: string; // only for services
    sessionDate: string;
    grossAmount: number;
    platformFee: number;
    gstOnPlatformFee: number;
    preTdsPayable: number;
    tdsDeducted: number;
    netPayable: number;
    status: 'On-Hold' | 'Payout Scheduled' | 'Paid' | 'Disputed';
    type: 'service' | 'product';
    reason?: string; // Reason for On-Hold status
}

export function getEarningsHistory(therapistId: string, period: 'mtd' | 'last7' | 'last30'): EarningItem[] {
    // Mock data simulation
    const mockData = [
        { source: 'BK-001', patientName: 'Alice Johnson', sessionDate: '2024-07-29', grossAmount: 1500, status: 'Payout Scheduled', type: 'service', isPremium: true },
        { source: 'ORD-123', sessionDate: '2024-07-29', grossAmount: 500, status: 'Payout Scheduled', type: 'product', isPremium: true },
        { source: 'BK-002', patientName: 'Bob Williams', sessionDate: '2024-07-28', grossAmount: 1500, status: 'On-Hold', reason: 'PCR not locked', type: 'service', isPremium: false },
        { source: 'BK-003', patientName: 'Charlie Brown', sessionDate: '2024-07-27', grossAmount: 2000, status: 'Paid', type: 'service', isPremium: true },
        { source: 'ORD-124', sessionDate: '2024-07-27', grossAmount: 300, status: 'Paid', type: 'product', isPremium: false },
        { source: 'BK-004', patientName: 'Diana Miller', sessionDate: '2024-07-26', grossAmount: 1200, status: 'Paid', type: 'service', isPremium: false },
        { source: 'BK-005', patientName: 'Ethan Davis', sessionDate: '2024-07-25', grossAmount: 1800, status: 'On-Hold', reason: 'Awaiting patient feedback', type: 'service', isPremium: true },
    ];

    return mockData.map(item => {
        const platformFee = item.isPremium ? item.grossAmount * 0.10 : 0;
        const gstOnPlatformFee = item.isPremium ? platformFee * 0.18 : 0;
        
        // Amount on which TDS is applicable
        const preTdsPayable = item.grossAmount - platformFee;

        // TDS is 10% on the amount after platform fee deduction
        const tdsDeducted = preTdsPayable > 0 ? preTdsPayable * 0.10 : 0;

        // Final amount credited to the therapist
        const netPayable = preTdsPayable - tdsDeducted;

        return {
            source: item.source,
            patientName: item.patientName,
            sessionDate: item.sessionDate,
            grossAmount: item.grossAmount,
            platformFee,
            gstOnPlatformFee,
            preTdsPayable,
            tdsDeducted,
            netPayable,
            status: item.status as any,
            type: item.type as any,
            reason: item.reason,
        };
    });
}

export interface PayoutSummary {
    payoutId: string;
    period: string; // e.g., "Jul 22 - Jul 28, 2024"
    payoutDate: string;
    totalAmount: number;
    status: 'Paid' | 'Processing';
    numberOfSessions: number;
}

export function getPayoutHistory(therapistId: string): PayoutSummary[] {
    // Mock data simulation
    return [
        { payoutId: 'PO-101', period: 'Jul 22 - Jul 28, 2024', payoutDate: '2024-08-02', totalAmount: 15480.50, status: 'Paid', numberOfSessions: 12 },
        { payoutId: 'PO-102', period: 'Jul 15 - Jul 21, 2024', payoutDate: '2024-07-26', totalAmount: 14200.00, status: 'Paid', numberOfSessions: 11 },
        { payoutId: 'PO-103', period: 'Jul 08 - Jul 14, 2024', payoutDate: '2024-07-19', totalAmount: 16100.00, status: 'Paid', numberOfSessions: 13 },
    ];
}
