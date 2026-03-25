import serverApi from "@/lib/repos/axios.server";

export interface LogConsentPayload {
  userId: number;
  consentType: 'terms' | 'privacy' | 'medical' | 'marketing';
  version: string;
}

/**
 * Log user consent via backend API
 */
export async function logConsent(payload: LogConsentPayload): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  try {
    const { data } = await serverApi.post(
      '/api/consent/log',
      {
        userId: payload.userId,
        consentType: payload.consentType,
        version: payload.version,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Assuming API returns { success: true/false }
    return data;
  } catch (error: any) {
    console.error("CONSENT LOG ERROR:", error?.message);
    return { success: false, error: 'A server error occurred while saving consent.' };
  }
}