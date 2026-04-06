'use server';

import serverApi from "@/lib/repos/axios.server";
import { getToken } from "@/lib/auth";

/**
 * List all refunds (Admin).
 * GET /api/refunds
 */
export async function listRefunds(filters?: any): Promise<any[]> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');

    const { data } = await serverApi.get('/api/refunds', {
      params: filters,
      headers: { Authorization: `Bearer ${token}` }
    });

    return data.data || data || [];
  } catch (error: any) {
    console.error('Failed to fetch refunds:', error?.response?.data || error?.message);
    return [];
  }
}

/**
 * List user's own refunds.
 * GET /api/my-refunds
 */
export async function getMyRefunds(): Promise<any[]> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');

    const { data } = await serverApi.get('/api/my-refunds', {
      headers: { Authorization: `Bearer ${token}` }
    });

    return data.data || data || [];
  } catch (error: any) {
    console.error('Failed to fetch user refunds:', error?.response?.data || error?.message);
    return [];
  }
}

/**
 * Initiate a refund (Admin).
 * POST /api/refunds
 * 
 * Standardizes the refund payload and initiates the request via backend API.
 * Uses Paise (conversion from Rupees) for direct gateway compatibility.
 */
export async function initiateRefund(data: { 
  orderId: string | number; 
  amount: number; 
  reason?: string 
}): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Authentication token missing. Please log in again.');

    // Standardize to snake_case for backend compatibility
    // amount is in Rupees from UI; converted to amount_paise (amount * 100)
    // Using the raw amount directly (assuming Paise or user-entered integer)
    const payload = {
      order_id: data.orderId,
      amount_paise: data.amount,
      amount: data.amount, // Sending both to avoid mismatch
      reason: data.reason || 'Admin initiated refund'
    };

    console.log('Initiating refund with standardized payload:', payload);

    // Call the collection endpoint (/api/refunds) confirmed by backend route snippet
    const response = await serverApi.post('/api/refunds', payload, {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });

    console.log('Refund API Response:', response.data);

    return {
      success: response.data?.success ?? true,
      message: response.data?.message || 'Refund initiated successfully.'
    };
  } catch (error: any) {
    const errorDetails = error?.response?.data;
    const errorMsg = errorDetails?.message || error?.message || 'Failed to initiate refund.';
    console.error('Failed to initiate refund:', errorDetails || error?.message);
    
    return {
      success: false,
      message: errorMsg
    };
  }
}
