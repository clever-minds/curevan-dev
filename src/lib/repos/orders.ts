// src/lib/repos/orders.ts
import serverApi from "@/lib/repos/axios.server";
import type { Order } from "@/lib/types";
import { getToken } from '@/lib/auth';

interface ListOrdersResponse {
  data: Order[];
}

export async function listOrders(filters?: { userId?: number }): Promise<Order[] | null> {

  try {
    const params: any = {};
    if (filters?.userId) params.userId = filters.userId;
     const token =await getToken();
     if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data } = await serverApi.get<ListOrdersResponse>("/api/orders/my-orders", {
      params,
      withCredentials: true,
       headers: {
            Authorization: `Bearer ${token}`, 
      },
    });

    return (data.data || []).map((order: any) => ({
      ...order,
      // Handle mapping from backend fields (pincode/full_address) to frontend Address type (pin/line1)
      shippingAddress: order.shippingAddress ? {
        ...order.shippingAddress,
        pin: order.shippingAddress.pin || order.shippingAddress.pincode || '',
        line1: order.shippingAddress.line1 || order.shippingAddress.full_address || '',
      } : null,
      billingAddress: order.billingAddress ? {
        ...order.billingAddress,
        pin: order.billingAddress.pin || order.billingAddress.pincode || '',
        line1: order.billingAddress.line1 || order.billingAddress.full_address || '',
      } : null,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
      deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : null,
    }));
  } catch (error: any) {
    console.error("ORDER LIST ERROR:", error?.message);
    return null;
  }
}

export async function getOrderById(id: number): Promise<Order | null> {

  try {
     const token =await getToken();
     if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data } = await serverApi.get<{ data: any }>(`/api/orders/${id}`, {
      withCredentials: true,
       headers: {
            Authorization: `Bearer ${token}`, 
          },
    });

    if (!data?.data) return null;

    const order = data.data;
    return {
      ...order,
      shippingAddress: order.shippingAddress ? {
        ...order.shippingAddress,
        pin: order.shippingAddress.pin || order.shippingAddress.pincode || '',
        line1: order.shippingAddress.line1 || order.shippingAddress.full_address || '',
      } : null,
      billingAddress: order.billingAddress ? {
        ...order.billingAddress,
        pin: order.billingAddress.pin || order.billingAddress.pincode || '',
        line1: order.billingAddress.line1 || order.billingAddress.full_address || '',
      } : null,
      createdAt: order.createdAt ?? null,
      deliveredAt: order.deliveredAt ?? null,
    };
  } catch (error: any) {
    console.error("ORDER FETCH ERROR:", error?.message);
    return null;
  }
}

/**
 * Cancel an order by ID
 */
export async function cancelOrder(id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Token missing, please login again');
    }
    const { data } = await serverApi.post(`/api/orders/${id}/cancel`, {}, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: data.success ?? true,
      message: data.message
    };
  } catch (error: any) {
    console.error("ORDER CANCEL ERROR:", error?.message);
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to cancel order"
    };
  }
}
