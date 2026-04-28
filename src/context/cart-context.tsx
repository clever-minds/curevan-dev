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
import { getCart, saveCart, clearCart as clearFirestoreCart, removeCartItemByProductId, validateCartStock } from '@/lib/repos/cart';
import { getActiveOffers } from '@/lib/repos/offers';
import { calculateProductPrice, Offer, PricingResult } from '@/lib/pricing';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => { 
    subtotal: number; 
    discount: number; 
    offerDiscount: number;
    couponDiscount: number;
    totalGst: number; 
    gstToPay: number; 
    shippingCost: number;
    total: number; 
    totalWithTax: number;
    message: string;
  };
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
  shippingCost: number;
  setShippingCost: (cost: number) => void;
  offers: Offer[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [shippingCost, setShippingCost] = useState<number>(0);


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

      const [cartData, offersData] = await Promise.all([
        getCart(),
        getActiveOffers()
      ]);
      
      console.log('Cart API response:', cartData);
      setOffers(offersData);

      if (!cartData || cartData.length === 0) {
        setCart([]);
        setAppliedCoupon(null);
        return;
      }

      setCart(cartData as CartItem[]);
      setAppliedCoupon(null);
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

  const addToCart = async (product: Product, quantity: number = 1) => {
  if (!user) return;

  const existingItem = cart.find(
    (item) => Number(item.productId) === Number(product.id)
  );

  try {
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

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
        quantity: quantity,
      });

      // 2️⃣ Add properly structured CartItem
      const newItem: CartItem = {
        ...product,
        productId: product.id, // ✅ MUST
        quantity: quantity,
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
  const removeFromCart = async (productId: number) => {
    if (!user) return;
    try {
      await removeCartItemByProductId(productId);
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
    return removeFromCart(productId);
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
    let subtotal = 0;
    let totalOfferDiscount = 0;
    let totalCouponDiscount = 0;
    let message = "No discounts applied.";

    const itemResults = cart.map(item => {
      const result = calculateProductPrice(item, offers, appliedCoupon);
      return {
        item,
        result
      };
    });

    subtotal = itemResults.reduce((sum, { item }) => sum + (item.price * item.quantity), 0);
    totalOfferDiscount = itemResults.reduce((sum, { result, item }) => sum + (result.offerDiscount * item.quantity), 0);
    
    // According to rule 1 & 5: If ANY product has an active offer, the coupon for that product is ignored.
    // The engine handles this per-product.
    totalCouponDiscount = itemResults.reduce((sum, { result, item }) => sum + (result.couponDiscount * item.quantity), 0);

    // Conflict message handling
    const hasOffer = itemResults.some(r => r.result.appliedOffer);
    if (hasOffer && appliedCoupon) {
      message = "Offer already applied. Coupon not applicable.";
    } else if (hasOffer) {
      message = "Offers applied successfully.";
    } else if (appliedCoupon) {
      message = "Coupon applied successfully.";
    }

    const isTherapist = user?.role === 'therapist';
    const taxableAmountBeforeTherapist = subtotal - totalOfferDiscount - totalCouponDiscount;
    const therapistDiscount = isTherapist ? taxableAmountBeforeTherapist * 0.1 : 0;
    
    const finalDiscount = totalOfferDiscount + totalCouponDiscount + therapistDiscount;
    const taxableAmount = subtotal - finalDiscount;

    const discountRatio = subtotal > 0 ? taxableAmount / subtotal : 1;

    const totalGst = cart.reduce((total, item) => {
        const itemGst = (item.gstAmount || 0) * item.quantity * discountRatio;
        return total + itemGst;
    }, 0);

    const gstToPay = cart.reduce((total, item) => {
      if (!item.isTaxInclusive) {
        const itemGst = (item.gstAmount || 0) * item.quantity * discountRatio;
        return total + itemGst;
      }
      return total;
    }, 0);

    const totalWithTax = taxableAmount + gstToPay + shippingCost;

    return { 
      subtotal, 
      discount: finalDiscount, 
      offerDiscount: totalOfferDiscount,
      couponDiscount: totalCouponDiscount,
      totalGst, 
      gstToPay,
      shippingCost,
      total: totalWithTax, 
      totalWithTax,
      message
    };
  }, [cart, offers, appliedCoupon, user, shippingCost]);

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
            isCartOpen, setIsCartOpen, appliedCoupon, applyCoupon, removeCoupon, commissionInfo ,isCartLoaded, validateStock, offers, shippingCost, setShippingCost}}>

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
