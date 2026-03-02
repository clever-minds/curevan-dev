import serverApi from "@/lib/repos/axios.server";
import type { Shipment } from "../types";
import { getCurrentUser } from "../auth";

/**
 * Creates a shipment for an order via backend API.
 * Function name unchanged: createShipment
 */
export async function createShipment(
  orderId: number
): Promise<{ success: boolean; shipment?: Shipment; error?: string }> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "User not authenticated." };
  }

  try {
    // Call backend API to create shipment
    const { data: response } = await serverApi.post(
      "/api/shipments/create",
      {
        orderId,
        actorId: user.uid, // for audit logging
      },
      {
        headers: { withCredentials: true }, // maintain session/cookies
      }
    );

    if (response?.success) {
      console.log(`Shipment created successfully for order ${orderId}:`, response.shipment);
      return { success: true, shipment: response.shipment };
    } else {
      return { success: false, error: response?.error || "Failed to create shipment." };
    }
  } catch (error: any) {
    console.error(`Error creating shipment for order ${orderId} via API:`, error?.response || error?.message);
    return { success: false, error: "An unexpected error occurred while creating the shipment." };
  }
}