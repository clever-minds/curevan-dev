import serverApi from "@/lib/repos/axios.server";
import type { ProductCategory } from "../types";

/**
 * Fetches product categories via backend API
 * Function name unchanged: listProductCategories1
 */
export async function listProductCategories1(): Promise<ProductCategory[]> {
  try {
    const { data: response } = await serverApi.get("/api/products/categories", {
      headers: { withCredentials: true },
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

/**
 * Returns a static list of therapy categories
 * Function name unchanged: getTherapyCategories
 */
export async function getTherapyCategories(): Promise<string[]> {
  // This could later be replaced with an API call if needed
  return [
    "Physiotherapy",
    "Nursing Care",
    "Geri care Therapy",
    "Speech Therapy",
    "Mental Health Counseling",
    "Dietitian/Nutritionist",
    "Respiratory Therapy",
    "Acupuncture",
    "Operations",
    "Earnings",
    "Clinical",
  ];
}