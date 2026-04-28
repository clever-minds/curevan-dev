import serverApi from "@/lib/repos/axios.server";

export interface ShippingEstimate {
  rate: number;
  courier: string;
  estimated_delivery: string;
  all_options: Array<{
    name: string;
    rate: number;
    etd: string;
  }>;
}

export async function estimateShipping(pincode: string, weight: number = 0.5): Promise<ShippingEstimate | null> {
  try {
    const { data } = await serverApi.get(`/api/shipment/estimate`, {
      params: { pincode, weight }
    });
    if (data.success && data.data) {
      return {
        ...data.data,
        rate: Number(data.data.rate),
        estimated_delivery: data.data.estimated_delivery || '3-5 Days'
      };
    }
    return null;
  } catch (error: any) {
    console.error("SHIPPING ESTIMATE ERROR:", error?.response?.data || error.message);
    return null;
  }
}
