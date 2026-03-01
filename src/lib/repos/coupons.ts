import serverApi from "@/lib/repos/axios.server";
import type { Coupon } from "../types";
import type { ApiResponse,ApplyCouponResponse ,ApplyCouponPayload } from "../types";
import { getToken } from "@/lib/auth";

/* =========================
   LIST COUPONS
========================= */
export async function listCoupons(): Promise<Coupon[]> {
  try {
    const token = getToken(); // ✅ client only
    const { data } = await serverApi.get<ApiResponse<Coupon[]>>("/api/coupons/list", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("COUPONS FETCH DATA:", data);
    return data.data || [];
  } catch (error: any) {
    console.error("COUPONS FETCH ERROR:", error?.message);
    return []; // ✅ No throw for server functions
  }
}

/* =========================
   GET COUPON BY ID
========================= */
export async function getCouponById(id: number | string): Promise<Coupon | null> {
  try {
    const token = getToken();
    const { data } = await serverApi.get(`/api/coupons/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error: any) {
    console.error("COUPON FETCH ERROR:", error?.message);
    return null;
  }
}

/* =========================
   GET COUPON BY CODE
========================= */
export async function getCouponByCode(code: string): Promise<Coupon | null> {
  try {
    const token = getToken();
    const { data } = await serverApi.get(`/api/coupons/${code}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data.data || null;
  } catch (error: any) {
    console.error("COUPON FETCH BY CODE ERROR:", error?.message);
    return null;
  }
}

/* =========================
   CREATE COUPON
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
  valid_from?: string;
  valid_to?: string;
  usage_limit?: number;
  usage_per_user?: number;
  min_order_value?: number;
  therapist_id?: number;
  applicable_categories?: number[];
  applicable_products?: number[];
  internal_notes?: string;
}): Promise<ApiResponse<Coupon | null>> {

  try {
    const token = getToken();

    const response = await serverApi.post(
      "/api/coupons/add",
      payload,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return {
      success: true,
      message: response.data.message ?? 'Coupon created successfully',
      data: response.data.data ?? null,
    };

  } catch (error: any) {
    console.error("CREATE COUPON ERROR:", error?.message);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create coupon',
      data: null,
    };
  }
}

/* =========================
   UPDATE COUPON
========================= */
export async function updateCoupon(
  id: string | number,
  payload: Partial<Omit<Coupon, "id">>
): Promise<ApiResponse<Coupon | null>> {
  try {
    const token = getToken();

    const response = await serverApi.put(
      `/api/coupons/edit/${id}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: true,
      message: response.data.message ?? 'Coupon updated successfully',
      data: response.data.data ?? null,
    };
  } catch (error: any) {
    console.error("UPDATE COUPON ERROR:", error?.message);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update coupon',
      data: null,
    };
  }
}


/* =========================
   DELETE COUPON
========================= */
export async function deleteCoupon(id: string | number): Promise<ApiResponse<Coupon | null>> {
  try {
    const token = getToken();
    const response = await serverApi.delete<ApiResponse<Coupon | null>>(
      `/api/coupons/delete/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

  return {
      success: true,
      message: response.data.message ?? 'Coupon deleted successfully',
      data: response.data.data ?? null,
    };  
} catch (error: any) {
    console.error("DELETE COUPON ERROR:", error?.message);
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to delete coupon",
      data: null,
    };
  }
}


  export async function getCoupons(): Promise<Coupon[]> {
    try {
      const { data } = await serverApi.get<ApiResponse<Coupon[]>>("/api/coupons/get-all");
      console.log("COUPONS FETCH DATA:", data);
      return data.data || [];
    } catch (error: any) {
      console.error("COUPONS FETCH ERROR:", error?.message);
      return []; // ✅ No throw for server functions
    }
  }

 /* =========================
   APPLY COUPON
========================= */
export async function applyCoupon(
  payload: ApplyCouponPayload
): Promise<ApplyCouponResponse | null> {
  try {
        const token = getToken();
    const { data } = await serverApi.post<ApiResponse<ApplyCouponResponse>>(
      "/api/coupons/apply",
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("APPLY COUPON RESPONSE:", data);

    return data.data || null;
  } catch (error: any) {
    console.error("APPLY COUPON ERROR:", error?.message);
    return null;
  }
}


