import axios from "axios";
import { z } from "zod";
import { getToken } from "../auth";

const createOrderSchema = z.object({
  userId: z.number(),
  customerName: z.string(),
  customerPhone: z.string(),
  items: z.array(z.any()),
  shippingAddressId: z.number(),
  billingAddressId: z.number(),
  couponCode: z.string().optional(),
  couponDiscount: z.number().optional(),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  referredTherapistId: z.string().optional(),
 paymentStatus: z.string(),
 paymentRef:z.string(),
 paymentGateway:z.string(),
});

type CreateOrderInput = z.infer<typeof createOrderSchema>;

export async function createOrder(
  input: CreateOrderInput
): Promise<{ success: boolean; orderId?: string; razorpayOrderId?: string; error?: string }> {

  try {
    const validatedData = createOrderSchema.parse(input);
    console.log("call order data validatedData",validatedData)

    // 🔥 Call Backend API
    const token = await getToken();
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/orders/create-order`,
      {
        user_id: validatedData.userId,
        customer_name: validatedData.customerName,
        customer_phone: validatedData.customerPhone,
        items: validatedData.items,
        billing_address_id: validatedData.billingAddressId,
        shipping_address_id: validatedData.shippingAddressId,
        coupon_code: validatedData.couponCode,
        coupon_discount: validatedData.couponDiscount,
        subtotal: validatedData.subtotal,
        total: validatedData.total,
        referred_therapist_id: validatedData.referredTherapistId,
        payment_status: validatedData.paymentStatus,
        payment_ref: validatedData.paymentRef,
        payment_gateway: validatedData.paymentGateway,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

      }
    );
    console.log("call order data response",response)

    return {
      success: true,
      orderId: response.data?.data?.orderId,
      razorpayOrderId: response.data?.data?.razorpayOrderId,
    };

  } catch (error: any) {
    console.log("call order data error data",error.response)

    if (error?.response) {
      return {
        success: false,
        error: error.response.data?.message || "Order creation failed"
      };
    }

    return {
      success: false,
      error: "Something went wrong"
    };
  }
}
