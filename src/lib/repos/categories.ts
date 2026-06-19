import serverApi from "@/lib/repos/axios.server";
import type { ProductCategory } from "../types";
import { getToken } from "@/lib/auth";
/**
 * Fetches product categories via backend API
 * Function name unchanged: listProductCategories1
 */
export async function listProductCategories1(): Promise<ProductCategory[]> {
  try {
    const token =await getToken();
     if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data: response } = await serverApi.get("/api/products/categories", {
      headers: { 
        Authorization: `Bearer ${token}`,
       },
    });

    if (!response?.data || !Array.isArray(response.data)) return [];

    return response.data.map((cat: any) => ({
      id: cat.id,
      ...cat,
    })) as ProductCategory[];
  } catch (error: any) {
    console.error("Failed to fetch product categories via API:", error?.response || error?.message);
    return [];
  }
}

export async function addJournalTag(name: string): Promise<any> {
  try {
    const token = await getToken();
    const { data: response } = await serverApi.post("/api/journal-tags/add", { name, status: true }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response?.success) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    console.error("Failed to add journal tag via API:", error?.response || error?.message);
    throw error;
  }
}

export async function deleteJournalTag(id: number): Promise<boolean> {
  try {
    const token = await getToken();
    const { data: response } = await serverApi.delete(`/api/journal-tags/delete/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return !!response?.success;
  } catch (error: any) {
    console.error("Failed to delete journal tag via API:", error?.response || error?.message);
    throw error;
  }
}

export async function getTherapyCategories(): Promise<string[]> {
  try {
    const token = await getToken();
    const { data: response } = await serverApi.get("/api/service-types/list", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response?.success && Array.isArray(response.data)) {
      return response.data.map((cat: any) => cat.name);
    }
  } catch (error) {
    console.error("Failed to fetch service types:", error);
  }
  
  // Fallback
  return [
    "Physiotherapy",
    "Nursing Care",
    "Geri care Therapy",
    "Speech Therapy",
    "Mental Health Counseling",
    "Dietitian/Nutritionist",
    "Respiratory Therapy",
    "Acupuncture"
  ];
}

export async function getTherapyCategoriesWithIds(): Promise<{id: number, name: string}[]> {
  try {
    const token = await getToken();
    const { data: response } = await serverApi.get("/api/service-types/list", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response?.success && Array.isArray(response.data)) {
      return response.data.map((cat: any) => ({ id: cat.id, name: cat.name }));
    }
  } catch (error) {
    console.error("Failed to fetch service types:", error);
  }
  
  // Fallback
  return [
    { id: 1, name: "Physiotherapy" },
    { id: 2, name: "Nursing Care" },
    { id: 3, name: "Geri care Therapy" },
    { id: 4, name: "Speech Therapy" },
    { id: 5, name: "Mental Health Counseling" },
    { id: 6, name: "Dietitian/Nutritionist" },
    { id: 7, name: "Respiratory Therapy" },
    { id: 8, name: "Acupuncture" }
  ];
}

export async function getJournalCategoriesFull(): Promise<{id: number, slug: string, name: string, isActive: boolean}[]> {
  try {
    const token = await getToken();
    const { data: response } = await serverApi.get("/api/journal-categories/list", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response?.success && Array.isArray(response.data)) {
      return response.data;
    }
  } catch (error) {
    console.error("Failed to fetch full journal categories:", error);
  }
  return [];
}

export async function getJournalTagsFull(): Promise<{id: number, slug: string, name: string, isActive: boolean}[]> {
  try {
    const token = await getToken();
    const { data: response } = await serverApi.get("/api/journal-tags/list", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response?.success && Array.isArray(response.data)) {
      return response.data;
    }
  } catch (error) {
    console.error("Failed to fetch full journal tags:", error);
  }
  return [];
}