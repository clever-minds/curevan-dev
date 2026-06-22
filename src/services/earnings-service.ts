'use client';

import { add, nextFriday, startOfWeek } from 'date-fns';
import clientApi from '@/lib/repos/axios';

/**
 * Calculates the date of the next payout.
 * Payouts are on Friday for the work done from the previous Monday to Sunday.
 */
export function getNextPayoutDate(): string {
  const today = new Date();
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const payoutFriday = nextFriday(add(startOfThisWeek, { weeks: 1 }));
  
  return payoutFriday.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export interface EarningItem {
    source: string; 
    patientName?: string; 
    sessionDate: string;
    grossAmount: number;
    platformFee: number;
    gstOnPlatformFee: number;
    preTdsPayable: number;
    tdsDeducted: number;
    netPayable: number;
    status: 'On-Hold' | 'Payout Scheduled' | 'Paid' | 'Disputed';
    type: 'service' | 'product';
    mode?: string;
    reason?: string; 
}

export interface PayoutSummary {
    payoutId: string;
    period: string;
    payoutDate: string;
    totalAmount: number;
    status: 'Paid' | 'Processing';
    numberOfSessions: number;
}

export interface EarningsData {
    earningsHistory: EarningItem[];
    payoutHistory: PayoutSummary[];
    dailyEarningsData: { date: string; net: number }[];
    modeSplitData: { name: string; value: number; fill: string }[];
    summary: { totalServices: number; totalProducts: number };
}

export async function fetchEarningsData(therapistId: string | number): Promise<EarningsData | null> {
    try {
        const { data } = await clientApi.get(`/api/therapist/earnings/${therapistId}`);
        if (data?.success || data?.status) {
            return data.data;
        }
        return null;
    } catch (error) {
        console.error("Error fetching earnings data:", error);
        return null;
    }
}
