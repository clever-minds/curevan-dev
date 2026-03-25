'use server';

import type { Return } from '@/lib/types';
import serverApi from "@/lib/repos/axios.server";
import { getToken } from "@/lib/auth";
/**
 * Fetches return records via backend API.
 * Optional filters can be passed as query parameters.
 */
export async function listReturns(filters?: any): Promise<Return[]> {
  try {
    const token =await getToken();
     if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data } = await serverApi.get('/api/returns/list', {
      params: filters,
      headers: { 
        Authorization: `Bearer ${token}`,
       },
    });

    if (!data || !Array.isArray(data)) return [];

    return data.map((item: any) => ({
      ...item,
      // Convert any date fields to ISO strings if necessary
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
    })) as Return[];
  } catch (error: any) {
    console.error('Failed to fetch returns via API:', error?.response || error?.message);
    return [];
  }
}