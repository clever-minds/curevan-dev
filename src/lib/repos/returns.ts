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
    const { data: res } = await serverApi.get('/api/orders/returns', {
      params: filters,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // the backend answers { success, data: [...] } with database column names (snake_case)
    const rows = Array.isArray(res) ? res : res?.data;
    if (!Array.isArray(rows)) return [];

    return rows.map((r: any) => ({
      ...r,
      id: String(r.id),
      orderId: r.order_id ?? r.orderId,
      orderNumber: r.order_number ?? r.orderNumber,
      customerName: r.user_name ?? r.customerName ?? '',
      cityState: r.cityState ?? '',
      items: r.items ?? [],
      reason: r.reason,
      method: r.method ?? 'pickup',
      status: r.status,
      refundStatus: r.refund_status ?? r.refundStatus ?? (r.status === 'Refunded' ? 'Refunded' : 'Pending'),
      totalRefundAmount: Number(r.refund_amount ?? r.total_refund_amount ?? r.totalRefundAmount ?? 0),
      createdAt: (r.created_at ?? r.createdAt) ? new Date(r.created_at ?? r.createdAt).toISOString() : undefined,
      updatedAt: (r.updated_at ?? r.updatedAt) ? new Date(r.updated_at ?? r.updatedAt).toISOString() : undefined,
    })) as unknown as Return[];
  } catch (error: any) {
    console.error('Failed to fetch returns via API:', error?.response || error?.message);
    return [];
  }
}

/**
 * Request a return for a specific order.
 * POST /api/orders/:id/return
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
 * PUT /api/orders/returns/:id/approve
 */
export async function approveReturn(returnId: string | number): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');

    const response = await serverApi.put(`/api/orders/returns/${returnId}/approve`, {}, {
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