import serverApi from "@/lib/repos/axios.server";
import { getToken } from "@/lib/auth";
import type {
  ReconciliationData,
  PaymentExceptionsData,
  InventoryForecastItem
} from "@/lib/types";

/**
 * Fetch reconciliation report between Curevan paid orders/bookings and Razorpay captured payments.
 * @param date YYYY-MM-DD string (defaults to yesterday if omitted)
 */
export async function getReconciliation(date?: string): Promise<ReconciliationData | null> {
  try {
    const token = await getToken();
    const res = await serverApi.get("/api/admin/reconciliation", {
      params: date ? { date } : {},
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data?.data || null;
  } catch (error: any) {
    console.error("Failed to fetch reconciliation report:", error?.response?.data || error?.message);
    return null;
  }
}

/**
 * Fetch payment exceptions: orders pending payment > 30m and failed webhooks.
 */
export async function getPaymentExceptions(): Promise<PaymentExceptionsData | null> {
  try {
    const token = await getToken();
    const res = await serverApi.get("/api/admin/payment-exceptions", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data?.data || null;
  } catch (error: any) {
    console.error("Failed to fetch payment exceptions:", error?.response?.data || error?.message);
    return null;
  }
}

/**
 * Fetch real 30-day inventory sales forecast, stock levels, and days of cover.
 */
export async function getInventoryForecast(): Promise<InventoryForecastItem[]> {
  try {
    const token = await getToken();
    const res = await serverApi.get("/api/products/inventory/forecast", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data?.data || [];
  } catch (error: any) {
    console.error("Failed to fetch inventory forecast:", error?.response?.data || error?.message);
    return [];
  }
}
