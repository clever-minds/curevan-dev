import serverApi from '@/lib/repos/axios.server';
import { getToken } from '@/lib/auth';
import type { OutcomeMeasure, PlanProgress, ProgressReportRow, TreatmentPlanSummary, DueMeasure, CaregiverLink } from '@/lib/types';

async function auth() {
  const token = await getToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}
const errorOf = (e: any, fallback: string) => e?.response?.data?.error || e?.message || fallback;

export async function listMeasures(all = false): Promise<OutcomeMeasure[]> {
  try {
    const { data } = await serverApi.get('/api/clinical/measures', { ...(await auth()), params: all ? { all: 1 } : undefined });
    return data?.data ?? [];
  } catch { return []; }
}

export async function createMeasure(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try { await serverApi.post('/api/clinical/measures', body, await auth()); return { ok: true }; }
  catch (e) { return { ok: false, error: errorOf(e, 'Could not add the measure') }; }
}

export async function setMeasureActive(id: number, active: boolean): Promise<boolean> {
  try { await serverApi.patch(`/api/clinical/measures/${id}`, { active }, await auth()); return true; } catch { return false; }
}

export async function listPlans(params?: { patientId?: number; stalled?: boolean }): Promise<TreatmentPlanSummary[]> {
  try {
    const { data } = await serverApi.get('/api/clinical/plans', { ...(await auth()), params: { patientId: params?.patientId, stalled: params?.stalled ? 1 : undefined } });
    return data?.data ?? [];
  } catch { return []; }
}

export async function getPlanProgress(planId: number): Promise<PlanProgress | null> {
  try { const { data } = await serverApi.get(`/api/clinical/plans/${planId}/progress`, await auth()); return data?.data ?? null; } catch { return null; }
}

export async function listPlanReports(planId: number): Promise<ProgressReportRow[]> {
  try { const { data } = await serverApi.get(`/api/clinical/plans/${planId}/reports`, await auth()); return data?.data ?? []; } catch { return []; }
}

export async function downloadReportPdf(reportId: number): Promise<Blob | null> {
  try { const res = await serverApi.get(`/api/clinical/reports/${reportId}/pdf`, { ...(await auth()), responseType: 'blob' }); return res.data as Blob; } catch { return null; }
}

export async function createPlan(body: Record<string, unknown>): Promise<{ ok: boolean; id?: number; error?: string }> {
  try { const { data } = await serverApi.post('/api/clinical/plans', body, await auth()); return { ok: true, id: data?.data?.id }; }
  catch (e) { return { ok: false, error: errorOf(e, 'Could not create the plan') }; }
}

export async function listCaregivers(): Promise<CaregiverLink[]> {
  try { const { data } = await serverApi.get('/api/clinical/caregivers', await auth()); return data?.data ?? []; } catch { return []; }
}

export async function addCaregiver(body: { mobile: string; relation?: string; consentAccepted: boolean }): Promise<{ ok: boolean; error?: string }> {
  try { await serverApi.post('/api/clinical/caregivers', body, await auth()); return { ok: true }; }
  catch (e) { return { ok: false, error: errorOf(e, 'Could not share') }; }
}

export async function revokeCaregiver(id: number): Promise<boolean> {
  try { await serverApi.delete(`/api/clinical/caregivers/${id}`, await auth()); return true; } catch { return false; }
}

export type { DueMeasure };

// ---- follow-up sessions, reminders and calendar (P17) ----
export interface FollowUpRow {
  id: number; therapistId: number; appointmentId: number; seriesId: number | null; status: string; apptStatus: string; paymentStatus: string;
  date: string; time: string; therapistName?: string; patientName?: string; holdExpiresAt?: string | null; amount?: number;
}

export async function listMyFollowUps(): Promise<FollowUpRow[]> {
  try { const { data } = await serverApi.get('/api/clinical/followups/mine', await auth()); return data?.data ?? []; } catch { return []; }
}
export async function confirmFollowUp(id: number, all = false): Promise<{ ok: boolean; error?: string; appointmentId?: number }> {
  try { const { data } = await serverApi.post(`/api/clinical/followups/${id}/confirm`, { all }, await auth()); return { ok: true, appointmentId: data?.data?.appointmentId }; }
  catch (e) { return { ok: false, error: errorOf(e, 'Could not confirm') }; }
}
export async function changeFollowUpTime(id: number, date: string, time: string): Promise<{ ok: boolean; error?: string }> {
  try { await serverApi.post(`/api/clinical/followups/${id}/change`, { date, time }, await auth()); return { ok: true }; }
  catch (e) { return { ok: false, error: errorOf(e, 'Could not change the time') }; }
}
export async function declineFollowUp(id: number): Promise<{ ok: boolean; error?: string }> {
  try { await serverApi.post(`/api/clinical/followups/${id}/decline`, {}, await auth()); return { ok: true }; }
  catch (e) { return { ok: false, error: errorOf(e, 'Could not decline') }; }
}
export async function listOverdue(): Promise<{ planId: number; patientId: number; patientName: string }[]> {
  try { const { data } = await serverApi.get('/api/clinical/followups/overdue', await auth()); return data?.data ?? []; } catch { return []; }
}
export type ReminderPrefs = { r24h: boolean; r2h: boolean; hep_daily: boolean };
export async function getReminderPrefs(): Promise<ReminderPrefs> {
  try { const { data } = await serverApi.get('/api/clinical/reminder-prefs', await auth()); return data?.data; } catch { return { r24h: true, r2h: true, hep_daily: false }; }
}
export async function saveReminderPrefs(p: ReminderPrefs): Promise<boolean> {
  try { await serverApi.put('/api/clinical/reminder-prefs', p, await auth()); return true; } catch { return false; }
}
export async function getCalendarFeedUrl(regenerate = false): Promise<string | null> {
  try {
    const { data } = regenerate ? await serverApi.post('/api/calendar/token/regenerate', {}, await auth()) : await serverApi.get('/api/calendar/token', await auth());
    return data?.data?.url ?? null;
  } catch { return null; }
}
export async function downloadAppointmentIcs(appointmentId: number): Promise<Blob | null> {
  try { const res = await serverApi.get(`/api/calendar/appointments/${appointmentId}.ics`, { ...(await auth()), responseType: 'blob' }); return res.data as Blob; } catch { return null; }
}
