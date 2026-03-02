'use server';

import serverApi from "@/lib/repos/axios.server";
import type { PayoutItem, PayoutBatch } from '../types';
import { getSafeDate } from '../utils';

/**
 * Adds a new payout item via backend API
 */
export async function addPayoutItem(item: Omit<PayoutItem, 'id'>): Promise<PayoutItem> {
  try {
    const { data } = await serverApi.post('/api/payout-items/add', item, {
      headers: { withCredentials: true },
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
export async function getPayoutItemBySourceId(sourceId: string): Promise<PayoutItem | null> {
  try {
    const { data } = await serverApi.get(`/api/payout-items/source/${sourceId}`, {
      headers: { withCredentials: true },
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
    const { data } = await serverApi.get('/api/payout-items/list', {
      params: filters,
      headers: { withCredentials: true },
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
    const { data } = await serverApi.get('/api/payout-batches/list', {
      params: filters,
      headers: { withCredentials: true },
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