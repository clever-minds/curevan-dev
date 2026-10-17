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

export interface Features { maskedCall: boolean; carePacks: boolean }

/** Switches for features that arrive in later releases (both off). */
export async function getFeatures(): Promise<Features> {
  try {
    const { data } = await clientApi.get('/api/config/public');
    return { maskedCall: data?.data?.features?.maskedCall === true, carePacks: data?.data?.features?.carePacks === true };
  } catch {
    return { maskedCall: false, carePacks: false };
  }
}

export interface CallConfig { enabled: boolean; windowHoursBefore: number; windowHoursAfter: number; slotMinutes: number }

/** Is masked calling live, and when does the calling window open and close? (the server decides the same again when the call is made) */
export async function getCallConfig(): Promise<CallConfig> {
  const off: CallConfig = { enabled: false, windowHoursBefore: 2, windowHoursAfter: 1, slotMinutes: 60 };
  try {
    const { data } = await clientApi.get('/api/config/public');
    const d = data?.data ?? {};
    return {
      enabled: d.features?.maskedCall === true,
      windowHoursBefore: Number(d.maskedCall?.windowHoursBefore ?? off.windowHoursBefore),
      windowHoursAfter: Number(d.maskedCall?.windowHoursAfter ?? off.windowHoursAfter),
      slotMinutes: Number(d.session?.slotMinutes ?? off.slotMinutes),
    };
  } catch {
    return off;
  }
}
