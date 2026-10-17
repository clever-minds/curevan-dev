import clientApi from '@/lib/repos/axios.server';

export interface ShopRules { freeShippingThresholdInr: number; flatShippingFeeInr: number; returnWindowDays: number }

/** Numbers the server decides (free-shipping threshold, flat fee, return window). The fallback equals the server's defaults. */
export const DEFAULT_SHOP_RULES: ShopRules = { freeShippingThresholdInr: 499, flatShippingFeeInr: 50, returnWindowDays: 7 };

export async function getShopRules(): Promise<ShopRules> {
  try {
    const { data } = await clientApi.get('/api/config/public');
    return { ...DEFAULT_SHOP_RULES, ...(data?.data?.shop ?? {}) };
  } catch {
    return DEFAULT_SHOP_RULES;
  }
}

export interface AffiliateRules { patientDiscountPct: number; therapistCommissionPct: number; eligibleAfterDeliveryDays: number }
export const DEFAULT_AFFILIATE_RULES: AffiliateRules = { patientDiscountPct: 10, therapistCommissionPct: 5, eligibleAfterDeliveryDays: 7 };

export async function getAffiliateRules(): Promise<AffiliateRules> {
  try {
    const { data } = await clientApi.get('/api/config/public');
    return { ...DEFAULT_AFFILIATE_RULES, ...(data?.data?.affiliate ?? {}) };
  } catch {
    return DEFAULT_AFFILIATE_RULES;
  }
}
