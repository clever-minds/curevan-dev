import serverApi from "@/lib/repos/axios.server";
import type { CartItem, Coupon } from "../types";

interface CartDocument {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  updatedAt: string; // ISO string
}

export interface SaveCartPayload {
  userId: number;
  product_id: number;
  quantity: number;
}

/**
 * Fetch user's cart from API
 */
export async function getCart(): Promise<CartItem[] | null> {
  try {
   
    const { data } = await serverApi.get("/api/cart/list", {
      headers: {
       withCredentials: true,
      },
    });


    // API returns array of items
    const cartArray: CartItem[] = (data.data || []).map((item: any) => ({
      productId: item.productId,
      id: item.productId,
      name: item.name || `Product ${item.productId}`,
      price: item.price || 0,
      description: item.description || '',
      categoryId: item.categoryId || 0,
      featuredImage: item.featuredImage || '',
      isActive: item.isActive ?? true,
      isCouponExcluded: item.isCouponExcluded ?? false,
      rating: item.rating || 0,
      sku: item.sku || '',
      stock: item.stock || 0,
      reorderPoint: item.reorderPoint || 0,
      hsnCode: item.hsnCode || '',
      quantity: item.quantity || 1,
    }));
    console.log("Cart API response123:", cartArray);

    return cartArray;
  } catch (error: any) {
    console.error("CART FETCH ERROR:", error?.message);
    return null;
  }
}

/**
 * Save or update user's cart
 */
// export async function saveCart(
//   items: CartItem[],
//   appliedCoupon: Coupon | null = null
// ): Promise<CartDocument | null> {
//   try {
//     const token = getToken();
//     if (!token) return null;

//     const { data } = await serverApi.post(
//       "/api/cart/add-or-update",
//       { items, appliedCoupon },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     return data;
//   } catch (error: any) {
//     console.error("CART SAVE ERROR:", error?.message);
//     return null;
//   }
// }
export async function saveCart(
  payload: SaveCartPayload
): Promise<any | null> {
  try {
   

    const { data } = await serverApi.post(
      '/api/cart/add-or-update',
      {
        userId: payload.userId,
        product_id: payload.product_id,
        quantity: payload.quantity,
      },
      {
        headers: {
         withCredentials: true,
        },
      }
    );

    return data;
  } catch (error: any) {
    console.error('CART SAVE ERROR:', error?.message);
    return null;
  }
}

/**
 * Clear user's cart
 */

export async function clearCart(): Promise<boolean> {
  try {
   

    await serverApi.delete("/api/cart/clear", {
      headers: {
        withCredentials: true,
      },
    });

    return true;
  } catch (error: any) {
    console.error("CART CLEAR ERROR:", error?.message);
    return false;
  }
}

export async function removeCartItem(cartItemId: number): Promise<boolean> {
  try {
 

    await serverApi.delete(`/api/cart/remove/${cartItemId}`, {
      headers: {
        withCredentials: true,
      },
    });

    return true;
  } catch (error: any) {
    console.error("REMOVE CART ITEM ERROR:", error?.message);
    return false;
  }
}
