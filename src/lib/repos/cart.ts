import serverApi from "@/lib/repos/axios.server";
import type { CartItem, Coupon } from "../types";
import { getToken } from "@/lib/auth";

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
    const token =await getToken();
    const { data } = await serverApi.get("/api/cart/list", {
      headers: {
       withCredentials: true,
        Authorization: `Bearer ${token}`
      },
    });


    // API returns array of items
    const cartArray: CartItem[] = (data.data || []).map((item: any) => {
      const price = Number(item.sellingPrice || item.selling_price || item.price || 0);
      const percent = Number(item.gstPercent || item.gst_percent || item.gst_slab || item.gstSlab || 0);
      const isTaxInclusive = item.isTaxInclusive !== undefined ? Boolean(Number(item.isTaxInclusive)) : (item.is_tax_inclusive !== undefined ? Boolean(Number(item.is_tax_inclusive)) : false);

      return {
        productId: Number(item.productId || item.product_id),
        id: Number(item.productId || item.product_id),
        name: item.name || item.title || `Product ${item.productId || item.product_id}`,
        price: price,
        description: item.description || '',
        categoryId: item.categoryId || item.category_id || 0,
        featuredImage: item.featuredImage || item.featured_image || '',
        isActive: item.isActive ?? true,
        isCouponExcluded: item.isCouponExcluded ?? item.is_coupon_excluded ?? false,
        rating: item.rating || 0,
        sku: item.sku || '',
        stock: item.stock || item.onHand || 0,
        reorderPoint: item.reorderPoint || item.reorder_point || 0,
        hsnCode: item.hsnCode || item.hsn_code || '',
        quantity: Number(item.quantity || 0),
        gstPercent: percent,
        gstAmount: (() => {
           if (item.gstAmount || item.gst_amount) return Number(item.gstAmount || item.gst_amount);
           if (percent > 0) {
             return isTaxInclusive ? (price * (percent / (100 + percent))) : (price * (percent / 100));
           }
           return 0;
        })(),
        isTaxInclusive: isTaxInclusive,
      };
    });
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
   
    const token =await getToken();

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
         Authorization: `Bearer ${token}`
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
   
    const token =await getToken();
    await serverApi.delete("/api/cart/clear", {
      headers: {
        withCredentials: true,
        Authorization: `Bearer ${token}`
      },
    });

    return true;
  } catch (error: any) {
    console.error("CART CLEAR ERROR:", error?.message);
    return false;
  }
}

export async function removeCartItemByProductId(productId: number): Promise<boolean> {
  try {
    const token = await getToken();
    await serverApi.delete(`/api/cart/remove/${productId}`, {
       headers: {
        withCredentials: true,
        Authorization: `Bearer ${token}`
      },
    });

    return true;
  } catch (error: any) {
    console.error("REMOVE CART ITEM ERROR:", error?.message);
    return false;
  }
}

export async function validateCartStock(items: { productId: number, quantity: number }[]): Promise<any> {
  try {
    const token = await getToken();
    const { data } = await serverApi.post("/api/orders/validate-cart-stock", { items }, {
      headers: {
        withCredentials: true,
        Authorization: `Bearer ${token}`
      },
    });
    return data;
  } catch (error: any) {
    console.error("CART STOCK VALIDATION ERROR:", error?.message);
    return { 
        success: false, 
        message: error?.response?.data?.message || "Stock validation failed",
        error: error?.response?.data
    };
  }
}
