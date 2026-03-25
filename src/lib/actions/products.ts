import serverApi from "@/lib/repos/axios.server";
import type { ProductCategory } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { getToken } from "../auth";

/**
 * Adds a new product category via backend API.
 * Keeps the same function name and return type.
 */
export async function addProductCategory(
  categoryData: Omit<ProductCategory, "id" | "isActive">
): Promise<ProductCategory> {
  try {
    // Call backend API to create the category
    const token = await getToken();
    const { data: newCategory } = await serverApi.post(
      "/api/product-categories/add",
      categoryData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("New product category added via API:", newCategory);

    // Revalidate paths where categories are displayed
    revalidatePath("/dashboard/admin/products/categories");
    revalidatePath("/dashboard/admin/products/new");

    return newCategory;
  } catch (error: any) {
    console.error("Error adding product category via API:", error?.response || error?.message);
    throw new Error("Failed to create product category.");
  }
}