'use server';

import serverApi from '@/lib/repos/axios.server';
import { getToken } from '@/lib/auth';

async function authHeaders() {
  const token = await getToken();
  return { Authorization: `Bearer ${token}` };
}

export async function getTherapyAdminOverview() {
  try {
    const headers = await authHeaders();
    const { data } = await serverApi.get('/api/therapy-admin/overview', { headers });
    return data?.data ?? null;
  } catch (err: any) {
    console.error('getTherapyAdminOverview error:', err?.response?.data || err?.message);
    return null;
  }
}

export async function getEmergencyReassignQueue() {
  try {
    const headers = await authHeaders();
    const { data } = await serverApi.get('/api/therapy-admin/reassign-queue', { headers });
    return data?.data ?? [];
  } catch (err: any) {
    console.error('getEmergencyReassignQueue error:', err?.response?.data || err?.message);
    return [];
  }
}

export async function reassignBooking(bookingId: number, newTherapistId: number, reason?: string) {
  try {
    const headers = await authHeaders();
    const { data } = await serverApi.post('/api/therapy-admin/reassign', { bookingId, newTherapistId, reason }, { headers });
    return data;
  } catch (err: any) {
    console.error('reassignBooking error:', err?.response?.data || err?.message);
    throw new Error(err?.response?.data?.error || err?.response?.data?.message || 'Failed to reassign');
  }
}

export async function getQualityQueue() {
  try {
    const headers = await authHeaders();
    const { data } = await serverApi.get('/api/therapy-admin/quality-queue', { headers });
    return data?.data ?? [];
  } catch (err: any) {
    console.error('getQualityQueue error:', err?.response?.data || err?.message);
    return [];
  }
}

export async function recordQualityAction(therapistId: number, action: string, note?: string) {
  try {
    const headers = await authHeaders();
    const { data } = await serverApi.post('/api/therapy-admin/quality-action', { therapistId, action, note }, { headers });
    return data;
  } catch (err: any) {
    console.error('recordQualityAction error:', err?.response?.data || err?.message);
    throw new Error(err?.response?.data?.error || err?.response?.data?.message || 'Failed to record quality action');
  }
}

export async function getCredentialQueue() {
  try {
    const headers = await authHeaders();
    const { data } = await serverApi.get('/api/therapy-admin/credential-queue', { headers });
    return data?.data ?? [];
  } catch (err: any) {
    console.error('getCredentialQueue error:', err?.response?.data || err?.message);
    return [];
  }
}

export async function getOverdueFollowUps() {
  try {
    const headers = await authHeaders();
    const { data } = await serverApi.get('/api/therapy-admin/overdue-followups', { headers });
    return data?.data ?? [];
  } catch (err: any) {
    console.error('getOverdueFollowUps error:', err?.response?.data || err?.message);
    return [];
  }
}

export async function closeTreatmentPlan(planId: number, reason?: string) {
  try {
    const headers = await authHeaders();
    const { data } = await serverApi.post('/api/therapy-admin/close-plan', { planId, reason }, { headers });
    return data;
  } catch (err: any) {
    console.error('closeTreatmentPlan error:', err?.response?.data || err?.message);
    throw new Error(err?.response?.data?.error || err?.response?.data?.message || 'Failed to close plan');
  }
}

export async function getStalledProgressQueue() {
  try {
    const headers = await authHeaders();
    const { data } = await serverApi.get('/api/therapy-admin/stalled-progress', { headers });
    return data?.data ?? [];
  } catch (err: any) {
    console.error('getStalledProgressQueue error:', err?.response?.data || err?.message);
    return [];
  }
}

export async function getOutcomeSummary() {
  try {
    const headers = await authHeaders();
    const { data } = await serverApi.get('/api/therapy-admin/outcome-summary', { headers });
    return data?.data ?? null;
  } catch (err: any) {
    console.error('getOutcomeSummary error:', err?.response?.data || err?.message);
    return null;
  }
}

export async function getMyPatientsProgress() {
  try {
    const headers = await authHeaders();
    const { data } = await serverApi.get('/api/therapists/my-patients', { headers });
    return data?.data ?? [];
  } catch (err: any) {
    console.error('getMyPatientsProgress error:', err?.response?.data || err?.message);
    return [];
  }
}

export async function getTherapistDashboardStats(therapistId: number | string) {
  try {
    const headers = await authHeaders();
    const { data } = await serverApi.get(`/api/therapists/dashboard-stats/${therapistId}`, { headers });
    return data?.data ?? null;
  } catch (err: any) {
    console.error('getTherapistDashboardStats error:', err?.response?.data || err?.message);
    return null;
  }
}
