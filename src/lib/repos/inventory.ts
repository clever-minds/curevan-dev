import serverApi from "@/lib/repos/axios.server";
import type { Inventory } from '../types';
import { getSafeDate } from '../utils';
import { getToken } from "@/lib/auth";

export async function listInventory(filters?: any): Promise<Inventory[]> {
    try {
        const token = await getToken(); // ✅ client only
        console.log("Token:", token);

        const { data } = await serverApi.get("/api/products/inventory/list", {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: filters // optional query filters
        });

        console.log("Inventory Data:", data);

        if (!data || data.empty) return [];

        // If your API returns raw inventory array, just return it
        return data;

        // If you want to map it to Inventory type:
        /*
        return data.map((item: any) => ({
            ...item,
            updatedAt: getSafeDate(item.updatedAt)?.toISOString() || ''
        })) as Inventory[];
        */

    } catch (error: any) {
        console.error("Failed to fetch inventory:", error.message || error);
        return []; // fallback empty array
    }
}
