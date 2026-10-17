'use server';

import serverApi from '@/lib/repos/axios.server';
import { getToken } from '@/lib/auth';

export interface AffiliateStats {
  code: string | null;
  codeStatus: string | null;
  patientDiscountPct: number;
  commissionPct: number;
  redemptions: number;
  grossSales: number;
  pending: number;
  eligible: number;
  paid: number;
  topProducts: { name: string; units: number; sales: number }[];
}

/** The signed-in therapist's DR code and commission numbers. GET /api/therapists/affiliate */
export async function getAffiliateStats(): Promise<AffiliateStats | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    const { data } = await serverApi.get('/api/therapists/affiliate', { headers: { Authorization: `Bearer ${token}` } });
    return data?.data ?? null;
  } catch (error: any) {
    console.error('Failed to load affiliate stats:', error?.response?.data || error?.message);
    return null;
  }
}
