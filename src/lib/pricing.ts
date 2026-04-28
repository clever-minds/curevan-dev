
import { Product, Coupon, Offer } from './types';

export interface PricingResult {
  originalPrice: number;
  offerDiscount: number;
  couponDiscount: number;
  finalPrice: number;
  message: string;
  appliedOffer?: Offer;
}

/**
 * Pricing Engine logic based on strict rules:
 * 1. Offers priority: Product > Category > Global
 * 2. If an offer exists, coupon is NOT applicable.
 * 3. Conflicts: Always prefer Offer over Coupon.
 */
export function calculateProductPrice(
  product: Product,
  offers: Offer[],
  appliedCoupon: Coupon | null = null
): PricingResult {
  const originalPrice = product.price;
  
  // 1. Find the best applicable offer based on priority
  // Priority: Product-specific > Category-specific > Global
  const productOffer = offers.find(o => 
    o.scope === 'product' && 
    (o.productId === product.id || o.applicableProducts?.includes(product.id)) && 
    o.isActive
  );
  
  const categoryOffer = offers.find(o => 
    o.scope === 'category' && 
    (o.categoryId === product.categoryId || o.applicableCategories?.includes(product.categoryId)) && 
    o.isActive
  );
  
  const globalOffer = offers.find(o => o.scope === 'global' && o.isActive);

  const appliedOffer = productOffer || categoryOffer || globalOffer;
  
  let offerDiscount = 0;
  let message = "";

  if (appliedOffer) {
    if (appliedOffer.type === 'percent') {
      offerDiscount = originalPrice * (appliedOffer.value / 100);
    } else {
      offerDiscount = appliedOffer.value;
    }
    
    // Ensure discount doesn't exceed price
    offerDiscount = Math.min(offerDiscount, originalPrice);
    
    message = appliedCoupon 
      ? "Offer already applied. Coupon not applicable." 
      : `Offer applied: ${appliedOffer.name}`;
  }

  let couponDiscount = 0;
  
  // 2. Only apply coupon if NO offer was applied
  if (!appliedOffer && appliedCoupon) {
    // Basic coupon validation (assuming types match)
    const isApplicable = !appliedCoupon.appliesTo || 
      (appliedCoupon.appliesTo.skus?.includes(product.sku) || 
       appliedCoupon.appliesTo.categories?.includes(String(product.categoryId)));

    if (isApplicable) {
      if (appliedCoupon.discountType === 'percent') {
        couponDiscount = originalPrice * (appliedCoupon.value / 100);
      } else {
        couponDiscount = appliedCoupon.value;
      }
      couponDiscount = Math.min(couponDiscount, originalPrice);
      message = "Coupon applied successfully.";
    } else {
      message = "Coupon not applicable to this product.";
    }
  }

  if (!appliedOffer && !appliedCoupon) {
    message = "No discounts applied.";
  }

  const finalPrice = Math.max(0, originalPrice - offerDiscount - couponDiscount);

  return {
    originalPrice,
    offerDiscount,
    couponDiscount: appliedOffer ? 0 : couponDiscount, // Ensure coupon is ignored if offer exists
    finalPrice,
    message,
    appliedOffer
  };
}
