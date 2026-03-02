'use server';

import serverApi from "@/lib/repos/axios.server";

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
  try {
    const { data } = await serverApi.get('/api/stats/public', {
      headers: { withCredentials: true },
    });

    return {
      usersTotal: data.usersTotal ?? 0,
      therapistsTotal: data.therapistsTotal ?? 0,
      productsTotal: data.productsTotal ?? 0,
      patientsServedTotal: data.patientsServedTotal ?? 0,
      productsDeliveredTotal: data.productsDeliveredTotal ?? 0,
    };
  } catch (error: any) {
    console.error("Error fetching public stats via API:", error?.response || error?.message);
    return {
      usersTotal: 0,
      therapistsTotal: 0,
      productsTotal: 0,
      patientsServedTotal: 0,
      productsDeliveredTotal: 0,
    };
  }
}