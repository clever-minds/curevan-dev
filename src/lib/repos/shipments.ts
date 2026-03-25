'use server';

import type { Shipment } from '@/lib/types';
import serverApi from "@/lib/repos/axios.server";
import { getToken } from "@/lib/auth";
/**
 * Fetches shipment records via backend API.
 * Optional filters can be passed as query parameters.
 */
export async function listShipments(filters?: any): Promise<Shipment[]> {
  try {
    const token =await getToken();
     if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data } = await serverApi.get('/api/shipments/list', {
      params: filters,
      headers: { 
        Authorization: `Bearer ${token}`,
       },
    });

    if (!data || !Array.isArray(data)) return [];

    return data.map((item: any) => ({
      ...item,
      // Convert possible date fields to ISO strings
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
      eta: item.eta ? new Date(item.eta).toISOString() : undefined,
      deliveredAt: item.deliveredAt ? new Date(item.deliveredAt).toISOString() : undefined,
    })) as Shipment[];
  } catch (error: any) {
    console.error('Failed to fetch shipments via API:', error?.response || error?.message);
    return [];
  }
}