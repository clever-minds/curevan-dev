'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import type { Product, Coupon, CartItem } from '@/lib/types';
import { useAuth } from './auth-context';
import { getCart, saveCart, clearCart as clearFirestoreCart,removeCartItem, validateCartStock } from '@/lib/repos/cart';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => { subtotal: number; discount: number; total: number };
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  appliedCoupon: Coupon | null;
  applyCoupon: (coupon: Coupon) => Promise<void>;
  removeCoupon: () => Promise<void>;
  commissionInfo: {
    commissionAmount: number;
    referredTherapistId: number | undefined;
    commissionBase: number;
  } | null;
  validateStock: () => Promise<any>;
  isCartLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // -------------------------------
  // Load cart from API
  // -------------------------------
  const loadCart = useCallback(async () => {
    if (isLoading) return;
    setIsCartLoaded(false);

    try {
      if (!user) {
        setCart([]);
        setAppliedCoupon(null);
        setIsCartLoaded(true);
        return;
      }

      const data = await getCart(); // returns array like [{id, userId, productId, quantity}]
      console.log('Cart API response:', data);

      if (!data || data.length === 0) {
        setCart([]);
        setAppliedCoupon(null);
        setIsCartLoaded(true);
        return;
      }

      // Map API data to CartItem with placeholders
      const normalizedCart: CartItem[] = data.map((item: any) => ({
        productId: Number(item.productId),
        id: Number(item.id),
        name: item.name, // placeholder, replace with real data later
        price: item.price, // placeholder price
        description: '',
        categoryId: item.categoryId,
        featuredImage: item.featuredImage || '',
        isActive: true,
        isCouponExcluded: false,
        rating: 0,
        sku: '',
        stock: 10,
        reorderPoint: 0,
        categoryname: item.categoryname || '',
        hsnCode: item.hsnCode || '',
        quantity: Number(item.quantity),
      }));

      setCart(normalizedCart);
      setAppliedCoupon(null); // your API does not return coupon info for now
    } catch (err) {
      console.error('Failed to load cart:', err);
      setCart([]);
      setAppliedCoupon(null);
    } finally {
      setIsCartLoaded(true);
    }
  }, [user, isLoading]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // -------------------------------
  // Add item to cart
  // -------------------------------
  // const addToCart = async (product: Product) => {
  //   if (!user) return;
  //   try {
  //     const existing = cart.find(item => item.productId === product.id);
  //     const quantity = existing ? existing.quantity + 1 : 1;

  //     await saveCart({ userId: user.id, product_id: product.id, quantity });
  //     await loadCart();
  //   } catch (err) {
  //     console.error('Failed to add to cart:', err);
  //   }
  // };

 const addToCart = async (product: Product) => {
  if (!user) return;

  const existingItem = cart.find(
    (item) => item.productId === product.id
  );

  try {
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;

      // 1️⃣ Update backend first
      await saveCart({
        userId: user.id,
        product_id: product.id,
        quantity: newQuantity,
      });

      // 2️⃣ Then update state
      setCart((prevCart: CartItem[]) =>
  prevCart.map((item): CartItem =>
    Number(item.productId) === Number(product.id)
      ? { ...item, quantity: newQuantity }
      : item
  )
);
    } else {
      // 1️⃣ Save to backend
      await saveCart({
        userId: user.id,
        product_id: product.id,
        quantity: 1,
      });

      // 2️⃣ Add properly structured CartItem
      const newItem: CartItem = {
        ...product,
        productId: product.id, // ✅ MUST
        quantity: 1,
      };

      setCart((prevCart: CartItem[]) => [...prevCart, newItem]);
    }
  } catch (error) {
    console.error("Add to cart error:", error);
  }
};


  // -------------------------------
  // Remove item from cart
  // -------------------------------
  const removeFromCart = async (id: number) => {
    alert(`Removing item with ID: ${id}`);
    if (!user) return;
    try {
      await removeCartItem(id);
      await loadCart();
    } catch (err) {
      console.error('Failed to remove from cart:', err);
    }
  };

  // -------------------------------
  // Update quantity
  // -------------------------------
const updateQuantity = async (
  productId: number,
  quantity: number
) => {
  if (!user) return;

  // 🔥 Always compare as Number
  const cartItem = cart.find(
    (item) => Number(item.productId) === Number(productId)
  );

  if (!cartItem) return;

  if (quantity <= 0) {
    return removeFromCart(cartItem.id);
  }

  try {
    // 1️⃣ Update backend
    await saveCart({
      userId: user.id,
      product_id: Number(productId),
      quantity,
    });

    // 2️⃣ Update UI locally (NO loadCart)
    console.log('Updated quantity:', quantity, 'for product ID:', productId);
    setCart((prevCart: CartItem[]) =>
      prevCart.map((item): CartItem =>
        Number(item.productId) === Number(productId)
          ? { ...item, quantity }
          : item
      )
    );

  } catch (err) {
    console.error('Failed to update quantity:', err);
  }
};



  // -------------------------------
  // Clear cart
  // -------------------------------
  const clearCart = async () => {
    if (!user) return;
    try {
      await clearFirestoreCart();
      setCart([]);
      setAppliedCoupon(null);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const validateStock = async () => {
    if (cart.length === 0) return { success: true };
    try {
      const items = cart.map(item => ({ 
        productId: Number(item.productId), 
        quantity: Number(item.quantity) 
      }));
      return await validateCartStock(items);
    } catch (err) {
      console.error('Failed to validate stock:', err);
      return { success: false, message: 'Stock validation failed' };
    }
  };

  // -------------------------------
  // Coupon
  // -------------------------------
  const applyCoupon = async (coupon: Coupon) => {
    setAppliedCoupon(coupon);
  };

  const removeCoupon = async () => {
    setAppliedCoupon(null);
  };

  // -------------------------------
  // Cart totals
  // -------------------------------
  const getCartTotal = useCallback(() => {
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percent') {
        const eligibleSubtotal = cart.reduce(
          (total, item) => (item.isCouponExcluded ? total : total + item.price * item.quantity),
          0
        );
        discount = eligibleSubtotal * appliedCoupon.value;
      } else if (appliedCoupon.discountType === 'flat') {
        discount = appliedCoupon.value;
      }
    }

    const isTherapist = user?.role === 'therapist';
    const postCouponSubtotal = subtotal - discount;
    const therapistDiscount = isTherapist ? postCouponSubtotal * 0.1 : 0;

    const total = postCouponSubtotal - therapistDiscount;
    return { subtotal, discount: discount + therapistDiscount, total };
  }, [cart, appliedCoupon, user]);

  // -------------------------------
  // Commission
  // -------------------------------
  const commissionInfo = useCallback(() => {
    const { subtotal, discount } = getCartTotal();
    if (!appliedCoupon || !appliedCoupon.therapistId) return null;

    if (user?.id === appliedCoupon.therapistId) {
      return { commissionAmount: 0, referredTherapistId: appliedCoupon.therapistId, commissionBase: 0 };
    }

    const commissionBase = subtotal - discount;
    const commissionAmount = commissionBase * 0.1;

    return { commissionAmount, referredTherapistId: appliedCoupon.therapistId, commissionBase };
  }, [getCartTotal, appliedCoupon, user])();

  return (
   
          <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, 
            isCartOpen, setIsCartOpen, appliedCoupon, applyCoupon, removeCoupon, commissionInfo ,isCartLoaded, validateStock}}>

      {children}
    </CartContext.Provider>
  );
};

// -------------------------------
// Hook
// -------------------------------
export const useCart = () => {
  const context = useContext(CartContext);
  console.log('useCart context:', context);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
