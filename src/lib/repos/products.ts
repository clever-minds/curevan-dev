  import serverApi from "@/lib/repos/axios.server";
  import type { ApiResponse,Product, ProductCategory } from "../types";
  import { getToken } from "@/lib/auth";

  export async function listProducts(): Promise<Product[]> {
    try {
      const token = await getToken(); // ✅ client only
      const { data } = await serverApi.get("/api/products/list",{
    headers: {
      Authorization: `Bearer ${token}` // typical format for bearer tokens
    }
  });
      // Map backend fields to frontend Product type
      const products: Product[] = (data.data || data || []).map((p: any) => ({
        ...p,
        reorderPoint: p.reorder_point || p.reorderPoint || 0,
        // If stock is 0 but onHand is > 0, we might want to prefer onHand or keep stock as is.
        // For now, ensuring camelCase consistency:
        categoryId: Number(p.category_id || p.categoryId),
        categoryname: p.category_name || p.categoryname || 'Unknown',
        featuredImage: p.featuredImage || p.featured_image || ''
      }));

      return products;
    } catch (error: any) {
      console.error("PRODUCT FETCH ERROR:", error?.message);
      return []; // ✅ NO throw in server component
    }
  }

  export async function listProductCategories(): Promise<ProductCategory[]> {
    try {
      const token = await getToken(); // ✅ client only
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

  export async function fetchProductById(id: number | string): Promise<Product | null> {
    try {
      const { data } = await serverApi.get(`/api/products/frontend/${id}`);
      console.log(`api/product/frontend/${id}`, data);
      
      const p = data.data || data;
      if (!p) return null;

      // Handle the rich backend response mapping
      return {
        ...p,
        id: Number(p.id),
        name: p.title || p.name,
        description: p.short_description || p.description,
        longDescription: p.long_description || p.longDescription,
        price: Number(p.selling_price || p.price),
        mrp: Number(p.mrp),
        categoryId: Number(p.category_id || p.categoryId),
        categoryname: p.category_name || p.categoryname || 'Unknown',
        featuredImage: p.featuredImage || p.featured_image || '',
        images: Array.isArray(p.images) ? p.images.map((img: any) => typeof img === 'string' ? img : img.url) : [],
        hsnCode: p.hsn_code || p.hsnCode,
        dimensions: {
          lengthCm: Number(p.length_cm || p.dimensions?.lengthCm || 0),
          widthCm: Number(p.width_cm || p.dimensions?.widthCm || 0),
          heightCm: Number(p.height_cm || p.dimensions?.heightCm || 0),
          weightKg: Number(p.weight_kg || p.dimensions?.weightKg || 0),
        },
        manufacturer: p.manufacturer,
        countryOfOrigin: p.country_of_origin || p.countryOfOrigin,
        packer: p.packer,
        importer: p.importer,
        batchNumber: p.batch_number || p.batchNumber,
        mfgDate: p.manufacturing_date || p.mfgDate,
        expiryDate: p.expiry_date || p.expiryDate,
        stock: Number(p.onHand || p.stock || 0),
        reorderPoint: p.reorder_point || p.reorderPoint || 0,
      };
    } catch (error: any) {
      console.error(`PRODUCT BY ID FETCH ERROR (${id}):`, error?.message);
      return null;
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