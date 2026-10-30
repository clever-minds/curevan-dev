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
    const { data: res } = await serverApi.get('/api/shipment/list', {
      params: filters,
      headers: { 
        Authorization: `Bearer ${token}`,
       },
    });

    // the backend answers { success, data: [...] } with database column names (snake_case)
    const rows = Array.isArray(res) ? res : res?.data;
    if (!Array.isArray(rows)) return [];

    return rows.map((s: any) => ({
      ...s,
      orderId: s.order_id ?? s.orderId,
      awb: s.awb ?? s.awb_code,
      carrier: s.carrier,
      customerName: s.customer_name ?? s.customerName ?? '',
      cityState: s.cityState ?? '',
      status: s.status,
      slaBreached: s.slaBreached ?? false,
      provider: s.provider,
      shiprocketShipmentId: s.shiprocket_shipment_id ?? s.shiprocketShipmentId,
      trackingUrl: s.tracking_url ?? s.trackingUrl,
      labelUrl: s.label_url ?? s.labelUrl,
      createdAt: (s.created_at ?? s.createdAt) ? new Date(s.created_at ?? s.createdAt).toISOString() : undefined,
      eta: s.eta ? new Date(s.eta).toISOString() : undefined,
      deliveredAt: (s.delivered_at ?? s.deliveredAt) ? new Date(s.delivered_at ?? s.deliveredAt).toISOString() : undefined,
    })) as unknown as Shipment[];
  } catch (error: any) {
    console.error('Failed to fetch shipments via API:', error?.response || error?.message);
    return [];
  }
}