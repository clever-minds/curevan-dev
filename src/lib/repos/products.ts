import serverApi from "@/lib/repos/axios.server";
import type { ApiResponse, Product, ProductCategory } from "../types";
import { getToken } from "@/lib/auth";

const mapProduct = (p: any): Product => ({
  ...p,
  id: Number(p.id),
  name: p.title || p.name,
  description: p.short_description || p.description,
  longDescription: p.long_description || p.longDescription,
  price: Number(p.sellingPrice || p.selling_price || p.price || 0),
  mrp: Number(p.mrp),
  isTaxInclusive: p.is_tax_inclusive !== undefined ? Boolean(Number(p.is_tax_inclusive)) : (p.isTaxInclusive !== undefined ? Boolean(Number(p.isTaxInclusive)) : false),
  gstPercent: Number(p.gst_slab || p.gst_percent || p.gstSlab || p.gstPercent || 0),
  gstAmount: (() => {
    const percent = Number(p.gst_slab || p.gst_percent || p.gstSlab || p.gstPercent || 0);
    const price = Number(p.selling_price || p.price);
    const isInclusive = p.is_tax_inclusive !== undefined ? Boolean(p.is_tax_inclusive) : (p.isTaxInclusive !== undefined ? Boolean(p.isTaxInclusive) : false);
    if (p.gst_amount || p.gstAmount) return Number(p.gst_amount || p.gstAmount);
    if (percent > 0) {
      return isInclusive ? (price * (percent / (100 + percent))) : (price * (percent / 100));
    }
    return 0;
  })(),
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
  additionalFeatures: (p.additional_features || p.additionalFeatures || []).map((f: any) => ({
    title: f.title,
    value: f.value,
    isHighlighted: f.is_highlighted || f.isHighlighted || false
  })),
});

export async function listProducts(): Promise<Product[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get("/api/products/list", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return (data.data || data || []).map(mapProduct);
  } catch (error: any) {
    console.error("PRODUCT FETCH ERROR:", error?.message);
    return [];
  }
}

export async function listProductCategories(): Promise<ProductCategory[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get("/api/category/list", {
      headers: {
        Authorization: `Bearer ${token}`
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
    return (data.data || []).map(mapProduct);
  } catch (error: any) {
    console.error("PRODUCT FETCH ERROR:", error?.message);
    return [];
  }
}

export async function fetchPublicProductCategories(): Promise<ProductCategory[]> {
  try {
    const { data } = await serverApi.get("/api/category/get-all");
    console.log("api/category/get-all", data);
    return data.data;
  } catch (error: any) {
    console.error("Product Categories FETCH ERROR:", error?.message);
    return [];
  }
}

export async function fetchProductById(id: number | string): Promise<Product | null> {
  try {
    const { data } = await serverApi.get(`/api/products/frontend/${id}`);
    console.log(`api/product/frontend/${id}`, data);
    const p = data.data || data;
    if (!p) return null;
    return mapProduct(p);
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
    return (data.data || []).map(mapProduct);
  } catch (error: any) {
    console.error("getProductsByIds ERROR:", error?.message);
    return [];
  }
}