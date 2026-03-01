import api from './axios';
import { getToken } from "@/lib/auth";

/* =========================
    LIST COUPONS
   ========================= */
export async function listCoupons() {
  try {
    const { data } = await api.get('/api/coupons/list');
    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch coupons'
    );
  }
}

/* =========================
    GET SINGLE COUPON
   ========================= */
export async function getCouponById(id: number | string) {
  try {
    const token = getToken(); // client-side only

    const { data } = await api.get(`/api/coupons/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return data;
  } catch (error: any) {
    console.log("Error fetching coupon by ID:", error);
  }
}

/* =========================
    ADD COUPON
   ========================= */
export async function createCoupon(payload: {
  status: 'Active' | 'Paused' | 'Scheduled';
  value: number;
  code: string;
  type: 'flat' | 'percent';
  scope: 'Global' | 'Category' | 'Product';
  owner_type: 'Platform' | 'Therapist';
  is_stackable: boolean;
  max_discount?: number;
  valid_from?: string; // ISO string
  valid_to?: string;   // ISO string
  usage_limit?: number;
  usage_per_user?: number;
  min_order_value?: number;
  therapist_id?: number;
  applicable_categories?: number[];
  applicable_products?: number[];
  internal_notes?: string;
}) {
  try {
        console.log("createCoupon payload",payload);
    const { data } = await api.post('/api/coupons/add', payload);
    return data;
  } catch (error: any) {
    console.log(error.response?.data?.message);
  }
}

/* =========================
    UPDATE COUPON
   ========================= */
export async function updateCoupon(
  id: number | string,
  payload: {
    status: 'Active' | 'Paused' | 'Scheduled';
    value: number;
    code: string;
    type: 'flat' | 'percent';
    scope: 'Global' | 'Category' | 'Product';
    owner_type: 'Platform' | 'Therapist';
    is_stackable: boolean;
    max_discount?: number;
    valid_from?: string; // ISO string
    valid_to?: string;   // ISO string
    usage_limit?: number;
    usage_per_user?: number;
    min_order_value?: number;
    therapist_id?: number;
    applicable_categories?: number[];
    applicable_products?: number[];
    internal_notes?: string;
  }
) {
  try {
    const { data } = await api.put(`/api/coupons/edit/${id}`, payload);
    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to update coupon'
    );
  }
}

/* =========================
    DELETE COUPON
   ========================= */
export async function deleteCoupon(id: number | string) {
  try {
    const { data } = await api.delete(`/api/coupons/delete/${id}`);
    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to delete coupon'
    );
  }
}
