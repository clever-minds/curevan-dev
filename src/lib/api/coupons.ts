import api from './axios';
import { getToken } from "@/lib/auth";

/* =========================
    LIST COUPONS
   ========================= */
export async function listCoupons() {
  try {
    const { data } = await api.get('/api/coupons/list');
    if (data.success === false) {
      throw new Error(data.message || 'Failed to fetch coupons');
    }
    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch coupons';
    throw new Error(errorMsg);
  }
}

/* =========================
    GET SINGLE COUPON
   ========================= */
export async function getCouponById(id: number | string) {
  try {
    const token = await getToken(); // client-side only

    const { data } = await api.get(`/api/coupons/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (data.success === false) {
      throw new Error(data.message || 'Failed to fetch coupon');
    }
    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch coupon';
    throw new Error(errorMsg);
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

    if (data.success === false) {
      throw new Error(data.message || 'Failed to add coupon');
    }
    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to add coupon';
    throw new Error(errorMsg);
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
    if (data.success === false) {
      throw new Error(data.message || 'Failed to update coupon');
    }
    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to update coupon';
    throw new Error(errorMsg);
  }
}

/* =========================
    DELETE COUPON
   ========================= */
export async function deleteCoupon(id: number | string) {
  try {
    const { data } = await api.delete(`/api/coupons/delete/${id}`);
    if (data.success === false) {
      throw new Error(data.message || 'Failed to delete coupon');
    }
    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to delete coupon';
    throw new Error(errorMsg);
  }
}
