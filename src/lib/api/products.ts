import { headers } from 'next/headers';
import api from './axios';
import { getToken } from "@/lib/auth";

/* =========================
    LIST PRODUCTS
   ========================= */
export async function listProducts() {
  try {
    const { data } = await api.get('/api/products/list');
    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch products'
    );
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
}) {
  try {
    const token = await getToken();
    const { data } = await api.post('/api/products/add', payload,{
      headers: {
        Authorization: `Bearer ${token}` // typical format for bearer tokens
      }
    });
    return data;
  } catch (error: any) {
    console.log( error.response?.data?.message);
    // throw new Error(
    //   error.response?.data?.message || 'Failed to add product'
    // );
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
      console.log("FETCHING PRODUCT BY ID:",id);
    return data;
  } catch (error: any) {
        console.log("Error fetching product by ID:", error);

    // throw new Error(
    //   error.response?.data?.message || 'Failed to fetch product'
    // );
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
  }
) {
  try {
    const { data } = await api.put(`/api/products/edit/${id}`, payload);
    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to update product'
    );
  }
}

/* =========================
    DELETE PRODUCT
   ========================= */
export async function deleteProduct(id: number | string) {
  try {
    const { data } = await api.delete(`/api/products/delete/${id}`);
    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to delete product'
    );
  }
}
