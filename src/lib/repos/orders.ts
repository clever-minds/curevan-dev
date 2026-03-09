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
    const { data } = await serverApi.get<{ data: Order }>(`/api/orders/${id}`, {
      withCredentials: true,
       headers: {
            Authorization: `Bearer ${token}`, 
          },
    });

    if (!data?.data) return null;

    return {
      ...data.data,
    createdAt: data.data.createdAt ?? null,
    deliveredAt: data.data.deliveredAt ?? null,

    };
  } catch (error: any) {
    console.error("ORDER FETCH ERROR:", error?.message);
    return null;
  }
}
