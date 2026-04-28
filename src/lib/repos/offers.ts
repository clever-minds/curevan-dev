
import serverApi from "@/lib/repos/axios.server";
import type { ApiResponse, Offer } from "../types";
import { getToken } from "@/lib/auth";

export async function listOffers(): Promise<Offer[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<Offer[]>>("/api/offers/list", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return data.data || [];
  } catch (error: any) {
    console.error("OFFERS FETCH ERROR:", error?.message);
    return [];
  }
}

export async function getActiveOffers(): Promise<Offer[]> {
    const all = await listOffers();
    const now = new Date();
    return all.filter(o => {
        if (!o.isActive) return false;
        if (o.validFrom && new Date(o.validFrom) > now) return false;
        if (o.validTo && new Date(o.validTo) < now) return false;
        return true;
    });
}

export async function createOffer(payload: Partial<Offer>): Promise<ApiResponse<Offer>> {
  try {
    const token = await getToken();
    const { data } = await serverApi.post<ApiResponse<Offer>>("/api/offers/create", payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error: any) {
    console.error("CREATE OFFER ERROR:", error?.message);
    return { success: false, message: error?.message };
  }
}

export async function updateOffer(id: number, payload: Partial<Offer>): Promise<ApiResponse<Offer>> {
  try {
    const token = await getToken();
    const { data } = await serverApi.put<ApiResponse<Offer>>(`/api/offers/update/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error: any) {
    console.error("UPDATE OFFER ERROR:", error?.message);
    return { success: false, message: error?.message };
  }
}

export async function deleteOffer(id: number): Promise<ApiResponse<void>> {
  try {
    const token = await getToken();
    const { data } = await serverApi.delete<ApiResponse<void>>(`/api/offers/delete/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error: any) {
    console.error("DELETE OFFER ERROR:", error?.message);
    return { success: false, message: error?.message };
  }
}
