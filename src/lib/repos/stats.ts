'use server';

import serverApi from "@/lib/repos/axios.server";
import { getToken } from "@/lib/auth";
/**
 * Fetches public-facing statistics via backend API.
 * This replaces direct Firestore queries with an API call.
 */
export async function getPublicStats(): Promise<{
  usersTotal: number;
  therapistsTotal: number;
  productsTotal: number;
  patientsServedTotal: number;
  productsDeliveredTotal: number;
}> {
    console.log("🔥 SERVER: Entering getPublicStats...");
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Token missing, please login again');
    }

    const response = await serverApi.get('/api/stats/public', {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("RAW STATS RESPONSE:", response.data);

    // Some APIs wrap results in a 'data' property
    const data = response.data.data || response.data;

    return {
      usersTotal: data.usersTotal ?? 0,
      therapistsTotal: data.therapistsTotal ?? 0,
      productsTotal: data.productsTotal ?? 0,
      patientsServedTotal: data.patientsServedTotal ?? 0,
      productsDeliveredTotal: data.productsDeliveredTotal ?? 0,
    };
  } catch (error: any) {
    console.error("❌ Error fetching public stats via API:", error?.response?.data || error?.message);
    return {
      usersTotal: 0,
      therapistsTotal: 0,
      productsTotal: 0,
      patientsServedTotal: 0,
      productsDeliveredTotal: 0,
    };
  }
}