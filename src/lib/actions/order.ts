import axios from "axios";
import { z } from "zod";
import { getToken } from "../auth";

// Only identifiers and choices are sent. Prices, coupon discount, GST, shipping and payment
// status are calculated by the server and are deliberately NOT part of this request.
const createOrderSchema = z.object({
  shippingAddressId: z.number(),
  billingAddressId: z.number(),
  couponCode: z.string().optional(),
  referredTherapistId: z.string().optional(),
});

type CreateOrderInput = z.infer<typeof createOrderSchema>;

export interface CreatedOrder {
  success: boolean;
  orderId?: number;
  orderNumber?: string;
  razorpayOrderId?: string;
  amountPaise?: number;
  keyId?: string;
  total?: number;
  error?: string;
}

/** Step 1: create the unpaid order and the Razorpay order on the server. */
export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  try {
    const validated = createOrderSchema.parse(input);
    const token = await getToken();
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/orders/create-order`,
      {
        billing_address_id: validated.billingAddressId,
        shipping_address_id: validated.shippingAddressId,
        coupon_code: validated.couponCode,
        referred_therapist_id: validated.referredTherapistId || undefined,
      },
      { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
    );
    const d = response.data?.data;
    return {
      success: true,
      orderId: d?.orderId,
      orderNumber: d?.orderNumber,
      razorpayOrderId: d?.razorpayOrderId,
      amountPaise: d?.amountPaise,
      keyId: d?.keyId,
      total: d?.total,
    };
  } catch (error: any) {
    if (error?.response) {
      return {
        success: false,
        error: error.response.data?.error || error.response.data?.message || "Order creation failed",
      };
    }
    return { success: false, error: "Something went wrong" };
  }
}

/** Step 2: after Razorpay Checkout succeeds, the server re-checks the payment signature. */
export async function verifyPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ success: boolean; orderId?: number; orderNumber?: string; error?: string }> {
  try {
    const token = await getToken();
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/payments/verify`,
      payload,
      { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
    );
    const d = response.data?.data;
    return { success: !!response.data?.success, orderId: d?.orderId, orderNumber: d?.orderNumber };
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.message || "Payment could not be verified",
    };
  }
}
