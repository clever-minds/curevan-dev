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
    const token = await getToken();
    if (!token) {
      throw new Error('Token missing, please login again');
    }
    const { data } = await serverApi.get('/api/returns', {
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

/**
 * Request a return for a specific order.
 * POST /api/returns/:id/return
 */
export async function requestReturn(orderId: number, data?: any): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');

    // Path based on router mounted at /api/orders
    const response = await serverApi.post(`/api/orders/${orderId}/return`, data || {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      success: response.data?.success ?? true,
      message: response.data?.message || 'Return request submitted successfully.'
    };
  } catch (error: any) {
    const errorDetails = error?.response?.data;
    console.error('Failed to request return:', errorDetails || error?.message);
    return {
      success: false,
      message: errorDetails?.message || error?.message || 'Failed to submit return request.'
    };
  }
}

/**
 * Approve a return request (Admin).
 * PUT /api/returns/:id/approve
 */
export async function approveReturn(returnId: string | number): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');

    const response = await serverApi.put(`/api/returns/${returnId}/approve`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      success: response.data?.success ?? true,
      message: response.data?.message || 'Return approved successfully.'
    };
  } catch (error: any) {
    console.error('Failed to approve return:', error?.response?.data || error?.message);
    return {
      success: false,
      message: error?.response?.data?.message || 'Failed to approve return.'
    };
  }
}