import serverApi from "@/lib/repos/axios.server";
import type { ApiResponse } from "../types";
import type { Address } from "../types";
import { getToken } from "@/lib/auth";

/* =========================
   LIST ADDRESSES
========================= */
export async function listAddresses(): Promise<Address[]> {
  try {
    const token = getToken();
    const { data } = await serverApi.get<ApiResponse<Address[]>>("/api/addresses/list", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("ADDRESSES FETCH DATA:", data);
    return data.data || [];
  } catch (error: any) {
    console.error("ADDRESSES FETCH ERROR:", error?.message);
    return [];
  }
}

/* =========================
   GET ADDRESS BY ID
========================= */
export async function getAddressById(id: string | number): Promise<Address | null> {
  try {
    const token = getToken();
    const { data } = await serverApi.get<ApiResponse<Address>>(`/api/addresses/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data.data || null;
  } catch (error: any) {
    console.error("ADDRESS FETCH ERROR:", error?.message);
    return null;
  }
}
export const testFunc = () => console.log("Test Works");
/* =========================
   CREATE ADDRESS
========================= */
export async function createAddress(payload: {
  user_id: number;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default?: boolean;
  full_name: string;
  phone:string;
  email:string;
}): Promise<ApiResponse<Address | null>> {
  try {
    const token = getToken();
    const response = await serverApi.post("/api/addresses/add", payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      success: true,
      message: response.data.message ?? "Address created successfully",
      data: response.data.data ?? null,
    };
  } catch (error: any) {
    console.error("CREATE ADDRESS ERROR:", error?.message);
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to create address",
      data: null,
    };
  }
}

/* =========================
   UPDATE ADDRESS
========================= */
export async function updateAddress(
  id: string | number,
  payload: Partial<Omit<Address, "id" | "user_id">>
): Promise<ApiResponse<Address | null>> {
  try {
    const token = getToken();
    const response = await serverApi.put(`/api/addresses/edit/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      success: true,
      message: response.data.message ?? "Address updated successfully",
      data: response.data.data ?? null,
    };
  } catch (error: any) {
    console.error("UPDATE ADDRESS ERROR:", error?.message);
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to update address",
      data: null,
    };
  }
}

/* =========================
   DELETE ADDRESS
========================= */
export async function deleteAddress(id: string | number): Promise<ApiResponse<Address | null>> {
  try {
    const token = getToken();
    const response = await serverApi.delete<ApiResponse<Address | null>>(`/api/addresses/delete/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      success: true,
      message: response.data.message ?? "Address deleted successfully",
      data: response.data.data ?? null,
    };
  } catch (error: any) {
    console.error("DELETE ADDRESS ERROR:", error?.message);
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to delete address",
      data: null,
    };
  }
}
