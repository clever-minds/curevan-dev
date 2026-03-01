
'use server';

import { db } from '@/lib/db';
import type { ProductCategory } from '@/lib/types';
import { revalidatePath } from 'next/cache';

/**
 * Adds a new product category to the Firestore database.
 * @param categoryData - The data for the new product category.
 * @returns The newly created category document with its ID.
 */
export async function addProductCategory(categoryData: Omit<ProductCategory, 'id' | 'isActive'>): Promise<ProductCategory> {
  try {
    const newCategory = {
      ...categoryData,
      isActive: true,
      id: categoryData.name.toLowerCase().replace(/\s+/g, '-') // Generate slug-like ID
    };
    
    const docRef = db.collection('productCategories').doc(newCategory.id);
    await docRef.set(newCategory);
    
    console.log("New product category added to Firestore:", newCategory);
    
    // Revalidate paths where categories are displayed to ensure fresh data
    revalidatePath('/dashboard/admin/products/categories');
    revalidatePath('/dashboard/admin/products/new');
    
    return newCategory;
  } catch (error) {
    console.error("Error adding product category to Firestore:", error);
    throw new Error("Failed to create product category.");
  }
}
