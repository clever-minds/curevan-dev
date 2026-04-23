import { headers } from 'next/headers';
import api from './axios';
import { getToken } from "@/lib/auth";

/* =========================
    LIST PRODUCTS
   ========================= */
export async function listProducts() {
  try {
    const { data } = await api.get('/api/products/list');
    if (data.success === false) {
      throw new Error(data.message || 'Failed to fetch products');
    }
    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch products';
    throw new Error(errorMsg);
  }
}

/* =========================
    ADD PRODUCT
   ========================= */
export async function createProducts(payload: {
  productType: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  shortDescription: string;
  longDescription?: string;
  brand?: string;
  sku: string;
  category: number;
  mrp: number;
  sellingPrice: number;
  isTaxInclusive?: boolean;
  isCouponExcluded?: boolean;
  hsnCode?: string;
  sacCode?: string;
  gstSlab?: number;
  status: 'Draft' | 'Active' | 'Archived';
  stock?: number;
  reorderPoint?: number;
  image_ids: number[];

  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  weight_kg?: number;

  // ✅ Manufacturing & Compliance
  manufacturer?: string;
  country_of_origin?: string;
  packer?: string;
  importer?: string;
  batch_number?: string;
  manufacturing_date?: string; // ISO string "YYYY-MM-DD"
  expiry_date?: string;        // ISO string "YYYY-MM-DD"
  additional_features?: string[];
}) {
  try {
    const token = await getToken();
    const { data } = await api.post('/api/products/add', payload,{
      headers: {
        Authorization: `Bearer ${token}` // typical format for bearer tokens
      }
    });

    if (data.success === false) {
      throw new Error(data.message || 'Failed to add product');
    }
    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to add product';
    throw new Error(errorMsg);
  }
}

/* =========================
    GET SINGLE PRODUCT
   ========================= */
export async function getProductById(id: number | string) {
  try {
    const token = await getToken(); // ✅ client only

    const { data } = await api.get(`/api/products/${id}`,{
      headers: {
        Authorization: `Bearer ${token}` // typical format for bearer tokens
      }
    });
    if (data.success === false) {
      throw new Error(data.message || 'Failed to fetch product');
    }
    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch product';
    throw new Error(errorMsg);
  }
}

/* =========================
    UPDATE PRODUCT
   ========================= */
export async function updateProduct(
  id: number | string,
  payload: {
   productType: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  shortDescription: string;
  longDescription?: string;
  brand?: string;
  sku: string;
  category: number;
  mrp: number;
  sellingPrice: number;
  isTaxInclusive?: boolean;
  isCouponExcluded?: boolean;
  hsnCode?: string;
  sacCode?: string;
  gstSlab?: number;
  status: 'Draft' | 'Active' | 'Archived';
  stock?: number;
  reorderPoint?: number;
  image_ids: number[];

  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  weight_kg?: number;

  // ✅ Manufacturing & Compliance
  manufacturer?: string;
  country_of_origin?: string;
  packer?: string;
  importer?: string;
  batch_number?: string;
  manufacturing_date?: string; // ISO string "YYYY-MM-DD"
  expiry_date?: string;        // ISO string "YYYY-MM-DD"
  additional_features?: string[];
  }
) {
  try {
    const { data } = await api.put(`/api/products/edit/${id}`, payload);
    if (data.success === false) {
      throw new Error(data.message || 'Failed to update product');
    }
    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to update product';
    throw new Error(errorMsg);
  }
}

/* =========================
    DELETE PRODUCT
   ========================= */
export async function deleteProduct(id: number | string) {
  try {
    const { data } = await api.delete(`/api/products/delete/${id}`);
    if (data.success === false) {
      throw new Error(data.message || 'Failed to delete product');
    }
    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to delete product';
    throw new Error(errorMsg);
  }
}
