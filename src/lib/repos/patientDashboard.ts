'use server';

import serverApi from '@/lib/repos/axios.server';
import { getToken } from '@/lib/auth';
import type { PlanGoalProgress, PlanMeasureProgress } from '@/lib/types';

export interface DashboardBooking {
  id: number; date: string; time: string; status: string; paymentStatus: string; mode?: string | null; therapyType?: string | null;
  therapistId: number | null; therapistName?: string | null; qualification?: string | null; therapistPhoto?: string | null; otpAvailable: boolean;
}
export interface DashboardProposal { id: number; status: string; holdExpiresAt: string | null; date: string; time: string; therapistName?: string | null }
export interface DashboardRecovery {
  planId: number; condition: string; status: string; sessionsDone: number; plannedSessions: number | null;
  adherence: { attended: number; plannedToDate: number; ratio: number | null }; sessionsToNextReview: number | null; followUpOverdue: boolean;
  goals: PlanGoalProgress[]; measures: PlanMeasureProgress[];
}
export interface DashboardOrder { id: number; number: string; total: number | string; status: string; createdAt: string; deliveredAt?: string | null; awb?: string | null }
export interface PatientDashboard {
  activeBooking: DashboardBooking | null;
  proposals: DashboardProposal[];
  recovery: DashboardRecovery | null;
  quickScores: { date: string; functionalScore: number | null; painVas: number | null }[];
  records: { pcrs: { appointmentId: number; date: string; therapistName?: string | null; therapyType?: string | null }[]; reports: { id: number; reportType: 'review' | 'discharge'; createdAt: string }[] };
  orders: DashboardOrder[];
  lastTherapist: { therapistId: number; name: string } | null;
  isNew: boolean;
}

/** One call for the patient home screen. GET /api/patients/me/dashboard */
export async function getPatientDashboard(): Promise<PatientDashboard | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    const { data } = await serverApi.get('/api/patients/me/dashboard', { headers: { Authorization: `Bearer ${token}` } });
    return data?.data ?? null;
  } catch (error: any) {
    console.error('Failed to load the patient dashboard:', error?.response?.data || error?.message);
    return null;
  }
}
