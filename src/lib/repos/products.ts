  import serverApi from "@/lib/repos/axios.server";
  import type { ApiResponse,Product, ProductCategory } from "../types";
  import { getToken } from "@/lib/auth";

  export async function listProducts(): Promise<Product[]> {
    try {
      const token = getToken(); // ✅ client only
      const { data } = await serverApi.get("/api/products/list",{
    headers: {
      Authorization: `Bearer ${token}` // typical format for bearer tokens
    }
  });
      console.log("PRODUCT FETCH DATA:", data);
      return data;
    } catch (error: any) {
      console.error("PRODUCT FETCH ERROR:", error?.message);
      return []; // ✅ NO throw in server component
    }
  }

  export async function listProductCategories(): Promise<ProductCategory[]> {
    try {
      const token = getToken(); // ✅ client only
      const { data } = await serverApi.get("/api/category/list",{
        headers: {
          Authorization: `Bearer ${token}` // typical format for bearer tokens
        }
      });
      return data;
    } catch (error: any) {
      return [];
    }
  }

  export async function fetchPublicProducts(): Promise<Product[]> {
    try {
      const { data } = await serverApi.get("/api/products/frontend/list");
      console.log("api/products/frontend/list", data);
      return data.data;
    } catch (error: any) {
      console.error("PRODUCT FETCH ERROR:", error?.message);
      return []; // ✅ NO throw in server component
    }
  }

  export async function fetchPublicProductCategories(): Promise<ProductCategory[]> {
    try {
      const { data } = await serverApi.get("/api/category/get-all");
      console.log("api/category/get-all", data);
      return data.data;
    } catch (error: any) {
      console.error("Product Categories FETCH ERROR:", error?.message);
      return []; // ✅ NO throw in server component
    }
  }
  export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  if (!ids || ids.length === 0) return [];

  try {
    const { data } = await serverApi.post("/api/product/get-by-ids", { ids });
    console.log("api/product/get-by-ids", data);

    // ✅ Assuming API returns { data: Product[] }
    return data.data || [];
  } catch (error: any) {
    console.error("getProductsByIds ERROR:", error?.message);
    return [];
  }
}