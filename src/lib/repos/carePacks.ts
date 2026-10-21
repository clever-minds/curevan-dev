import clientApi from '@/lib/repos/axios';

export interface CarePackPlan {
  id: number;
  name: string;
  service_type_id: number | null;
  service_type_name?: string | null;
  sessions: number;
  price: string | number;
  validity_days: number;
  active: boolean;
}

export interface CarePack {
  id: number;
  plan_id: number;
  patient_id: number;
  therapist_id: number | null;
  sessions_total: number;
  sessions_used: number;
  sessions_remaining: number;
  price_paid: string | number;
  purchased_at: string;
  expires_at: string;
  status: 'active' | 'exhausted' | 'expired' | 'refunded' | 'cancelled';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  refunded_amount?: number;
  plan_name?: string;
  service_type_name?: string;
  therapist_name?: string;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
}

export interface CreateOrderResult {
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  plan: {
    id: number;
    name: string;
    sessions: number;
    price: number;
    validityDays: number;
  };
  keyId: string;
}

export async function getCarePackPlans(): Promise<CarePackPlan[]> {
  try {
    const res = await clientApi.get('/api/care-packs/plans');
    return res.data?.data || [];
  } catch (err) {
    console.error('getCarePackPlans error:', err);
    return [];
  }
}

export async function getMyCarePacks(): Promise<CarePack[]> {
  try {
    const res = await clientApi.get('/api/care-packs/my-packs');
    return res.data?.data || [];
  } catch (err) {
    console.error('getMyCarePacks error:', err);
    return [];
  }
}

export async function createCarePackOrder(planId: number, therapistId?: number | null): Promise<CreateOrderResult> {
  const res = await clientApi.post('/api/care-packs/purchase/order', {
    planId,
    therapistId: therapistId || undefined,
  });
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to initialize payment');
  }
  return res.data.data;
}

export async function verifyCarePackPurchase(params: {
  planId: number;
  therapistId?: number | null;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<CarePack> {
  const res = await clientApi.post('/api/care-packs/purchase/verify', params);
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Payment verification failed');
  }
  return res.data.data;
}

export async function adminGetAllPacks(): Promise<CarePack[]> {
  const res = await clientApi.get('/api/care-packs/admin/all');
  return res.data?.data || [];
}

export async function adminRefundCarePack(packId: number, reason?: string) {
  const res = await clientApi.post(`/api/care-packs/admin/${packId}/refund`, { reason });
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to refund pack');
  }
  return res.data;
}
