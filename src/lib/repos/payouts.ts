
import serverApi from "@/lib/repos/axios.server";
import type { PayoutItem, PayoutBatchRow } from '../types';
import { getSafeDate } from '../utils';
import { getToken } from '@/lib/auth';

/**
 * Adds a new payout item via backend API
 */
export async function addPayoutItem(item: Omit<PayoutItem, 'id'>): Promise<PayoutItem> {
  try {
    const token =await getToken();
      if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data } = await serverApi.post('/api/general/payout-items/add', item, {
     headers: {
        Authorization: `Bearer ${token}`, // <-- pass your token here
        withCredentials: true,            // optional if server needs cookies
      },
    });
    return {
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : '',
      weekStart: data.weekStart ? new Date(data.weekStart).toISOString() : '',
    } as PayoutItem;
  } catch (error: any) {
    console.error('Failed to add payout item via API:', error?.response || error?.message);
    throw new Error('Failed to add payout item.');
  }
}

/**
 * Get a payout item by source ID via API
 */
export async function getPayoutItemBySourceId(sourceId: number): Promise<PayoutItem | null> {
  try {
      const token =await getToken();
      if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data } = await serverApi.get(`/api/general/payout-items/source/${sourceId}`, {
      headers: {
        Authorization: `Bearer ${token}`, // <-- pass your token here
        withCredentials: true,            // optional if server needs cookies
      },
    });
    if (!data) return null;
    return {
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : '',
      weekStart: data.weekStart ? new Date(data.weekStart).toISOString() : '',
    } as PayoutItem;
  } catch (error: any) {
    console.error('Failed to fetch payout item by sourceId:', error?.response || error?.message);
    return null;
  }
}

/**
 * List payout items with optional filters via API
 */
export async function listPayoutItems(filters?: any): Promise<PayoutItem[]> {
  try {
    const token =await getToken();
      if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data } = await serverApi.get('/api/general/payout-items/list', {
      params: filters,
       headers: {
        Authorization: `Bearer ${token}`, // <-- pass your token here
        withCredentials: true,            // optional if server needs cookies
      },
    });
    return (data || []).map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : '',
      weekStart: item.weekStart ? new Date(item.weekStart).toISOString() : '',
    })) as PayoutItem[];
  } catch (error: any) {
    console.error('Failed to list payout items via API:', error?.response || error?.message);
    return [];
  }
}

/** Weekly payout batches (admins: everyone's, a therapist: their own). */
export async function listPayoutBatches(filters?: { week?: string; status?: string; therapistId?: number | string }): Promise<PayoutBatchRow[]> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');
    const { data } = await serverApi.get('/api/payout-batches/list', { params: filters, headers: { Authorization: `Bearer ${token}` } });
    return (data?.data ?? []) as PayoutBatchRow[];
  } catch (error: any) {
    console.error('Failed to list payout batches via API:', error?.response?.status || error?.message);
    return [];
  }
}

/** The bank-upload CSV for the approved batches of a week (the Monday, YYYY-MM-DD). */
export async function exportPayoutCsv(week: string): Promise<Blob | null> {
  try {
    const token = await getToken();
    const res = await serverApi.get('/api/payout-batches/export.csv', { params: { week }, headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
    return res.data as Blob;
  } catch { return null; }
}

/** The therapist's (or an admin's) PDF statement for one batch. */
export async function downloadPayoutStatement(batchId: number): Promise<Blob | null> {
  try {
    const token = await getToken();
    const res = await serverApi.get(`/api/payout-batches/${batchId}/statement.pdf`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
    return res.data as Blob;
  } catch { return null; }
}
