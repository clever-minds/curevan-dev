
import serverApi from "@/lib/repos/axios.server";
import type { PayoutItem, PayoutBatch } from '../types';
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

/**
 * List payout batches with optional filters via API
 */
export async function listPayoutBatches(filters?: any): Promise<PayoutBatch[]> {
  try {
    const token =await getToken();
      if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data } = await serverApi.get('/api/payout-batches/list', {
      params: filters,
      headers: {
        Authorization: `Bearer ${token}`, // <-- pass your token here
        withCredentials: true,            // optional if server needs cookies
      },
    });
    return (data || []).map((item: any) => ({
      ...item,
      payoutDate: item.payoutDate ? new Date(item.payoutDate).toISOString() : '',
      weekStart: item.weekStart ? new Date(item.weekStart).toISOString() : '',
      weekEnd: item.weekEnd ? new Date(item.weekEnd).toISOString() : '',
    })) as PayoutBatch[];
  } catch (error: any) {
    console.error('Failed to list payout batches via API:', error?.response || error?.message);
    return [];
  }
}