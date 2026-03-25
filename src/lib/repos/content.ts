
import serverApi from "@/lib/repos/axios.server";
import type {
  KnowledgeBase, ProfileChangeRequest, AuditLog,
  Session, PcrAmendmentRequest, NewsletterSubscriber, PaymentTransaction,
  Invoice, CreditNote, PatientProfile, AIFeedback
} from "../types";
import { getToken } from "@/lib/auth";

/**
 * Generic API response wrapper
 */
interface ApiResponse<T> {
  data: T;
}

/**
 * --------------------------
 * Journal Entries
 * --------------------------
 */
export async function listJournalEntries(filters?: any): Promise<KnowledgeBase[]> {
  try {
    const token = await getToken();
    const response = await serverApi.get<ApiResponse<KnowledgeBase[]>>(
      "/api/general/knowledge-base/list",
      {
        params: filters,
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const entries = response.data?.data ?? []; // ← fallback to empty array if undefined

    console.log("Journal Entries API response:", entries);

    return entries.map(entry => ({
      ...entry,
      createdAt: entry.createdAt || (entry as any).created_at,
      updatedAt: entry.updatedAt || (entry as any).updated_at,
      publishedAt: entry.publishedAt ? new Date(entry.publishedAt).toISOString() : undefined,
    }));
  } catch (error: any) {
    console.log("JOURNAL LIST ERROR:", error?.message);
    return [];
  }
}

export async function getKnowledgeBaseBySlug(slug: string): Promise<KnowledgeBase | null> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<KnowledgeBase[]>>("/api/general/knowledge-base/get-by-slug", {
      params: { slug },
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!data.data || data.data.length === 0) return null;

    const entry = data.data[0];
    return {
      ...entry,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      publishedAt: entry.publishedAt ? new Date(entry.publishedAt).toISOString() : undefined,
    };
  } catch (error: any) {
    console.error("knowledge-base GET ERROR:", error?.message);
    return null;
  }
}


export async function getKnowledgeBaseById(id: number): Promise<KnowledgeBase | null> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<KnowledgeBase>>(
      `/api/general/knowledge-base/get-by-id/${id}`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!data.data) return null;

    const entry = data.data;

    return {
      ...entry,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      publishedAt: entry.publishedAt
        ? new Date(entry.publishedAt).toISOString()
        : undefined,
    };
  } catch (error: any) {
    console.error("knowledge-base GET ERROR:", error?.message);
    return null;
  }
}



/**
 * --------------------------
 * Trainings
 * --------------------------
 */
export async function listTrainings(): Promise<KnowledgeBase[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<KnowledgeBase[]>>(
      "/api/general/knowledge-base/list",
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          contentType: "training",
        },
      }
    );
    return data.data.map(item => ({
      ...item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : undefined,
    }));
  } catch (error: any) {
    console.error("TRAININGS LIST ERROR:", error?.message);
    return [];
  }
}

/**
 * --------------------------
 * Documentation
 * --------------------------
 */
export async function listDocumentation(): Promise<KnowledgeBase[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<KnowledgeBase[]>>(
      "/api/general/knowledge-base/list",
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          contentType: "documentation",
        },
      }
    );

    return data.data.map(item => ({
      ...item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
    }));
  } catch (error: any) {
    console.error("DOCUMENTATION LIST ERROR:", error?.message);
    return [];
  }
}

/**
 * --------------------------
 * Profile Change Requests
 * --------------------------
 */
/**
 * Fetch a single profile change request by ID
 */
export async function getProfileChangeRequest(requestId: string): Promise<ProfileChangeRequest | null> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<ProfileChangeRequest>>(`/api/users/change-request/${requestId}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!data.data) return null;

    const item = data.data;
    let changes = item.changes;
    
    // Handle stringified JSON
    if (typeof changes === 'string') {
      try {
        changes = JSON.parse(changes);
      } catch (e) {
        console.error("Failed to parse changes JSON:", e);
        changes = [];
      }
    }

    // Handle object structure { key: { old, new } }
    if (changes && typeof changes === 'object' && !Array.isArray(changes)) {
        changes = Object.entries(changes).map(([key, val]: [string, any]) => ({
            fieldPath: key,
            name: key,
            old: val.old,
            new: val.new
        }));
    }

    return {
      ...item,
      changes: Array.isArray(changes) ? changes : [],
      createdAt: item.createdAt || (item as any).created_at,
      reviewedAt: item.reviewedAt || (item as any).reviewed_at,
    };
  } catch (error: any) {
    console.error(`GET PROFILE CHANGE REQUEST ERROR [${requestId}]:`, error?.message);
    return null;
  }
}

export async function listProfileChangeRequests(): Promise<ProfileChangeRequest[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<ProfileChangeRequest[]>>("/api/users/profile-change-requests", {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.data.map(item => {
      let changes = item.changes;
      
      // Handle stringified JSON
      if (typeof changes === 'string') {
        try {
          changes = JSON.parse(changes);
        } catch (e) {
          console.error("Failed to parse changes JSON:", e);
          changes = [];
        }
      }

      // Handle object structure { key: { old, new } }
      if (changes && typeof changes === 'object' && !Array.isArray(changes)) {
          changes = Object.entries(changes).map(([key, val]: [string, any]) => ({
              fieldPath: key,
              name: key,
              old: val.old,
              new: val.new
          }));
      }

      return {
        ...item,
        changes: Array.isArray(changes) ? changes : [],
        createdAt: item.createdAt || (item as any).created_at,
        reviewedAt: item.reviewedAt || (item as any).reviewed_at,
      };
    });
  } catch (error: any) {
    console.error("PROFILE CHANGE REQUESTS ERROR:", error?.message);
    return [];
  }
}

/**
 * Approve a profile change request
 */
export async function approveProfileChangeRequest(
  requestId: string,
  actorId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getToken();
    const { data } = await serverApi.put(
      `/api/users/change-request/approve/${requestId}`,
      { action: 'approved', role: 'therapist', actorId },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: data.success ?? true,
      message: data.message || "Request approved successfully."
    };
  } catch (error: any) {
    console.error(`PROFILE CHANGE APPROVE ERROR [${requestId}]:`, error?.response?.data || error?.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to approve profile change request."
    };
  }
}

/**
 * Reject a profile change request
 */
export async function rejectProfileChangeRequest(
  requestId: string,
  reason?: string,
  actorId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getToken();
    const { data } = await serverApi.put(
      `/api/users/change-request/reject/${requestId}`,
      { action: 'rejected', reason, role: 'therapist', actorId },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: data.success ?? true,
      message: data.message || "Request rejected successfully."
    };
  } catch (error: any) {
    console.error(`PROFILE CHANGE REJECT ERROR [${requestId}]:`, error?.response?.data || error?.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to reject profile change request."
    };
  }
}

/**
 * --------------------------
 * Audit Logs
 * --------------------------
 */
export async function listAuditLogs(): Promise<AuditLog[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<AuditLog[]>>("/api/audit-logs/list", {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.data.map(item => ({
      ...item,
      timestamp: item.timestamp,
    }));
  } catch (error: any) {
    console.error("AUDIT LOGS ERROR:", error?.message);
    return [];
  }
}

/**
 * --------------------------
 * Sessions
 * --------------------------
 */
export async function listSessionLogs(): Promise<Session[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<Session[]>>("/api/sessions/list", {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.data.map(item => ({
      ...item,
      startedAt: item.startedAt,
      endedAt: item.endedAt,
    }));
  } catch (error: any) {
    console.error("SESSION LOGS ERROR:", error?.message);
    return [];
  }
}

/**
 * --------------------------
 * PCR Amendment Requests
 * --------------------------
 */
export async function listPcrAmendmentRequests(): Promise<PcrAmendmentRequest[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<PcrAmendmentRequest[]>>("/api/pcr-amend-requests/list", {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.data.map(item => ({
      ...item,
      requestedAt: item.requestedAt,
    }));
  } catch (error: any) {
    console.error("PCR AMEND REQUESTS ERROR:", error?.message);
    return [];
  }
}

/**
 * --------------------------
 * Newsletter Subscribers
 * --------------------------
 */
export async function listNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<NewsletterSubscriber[]>>("/api/newsletter-subscribers/list", {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.data.map(item => ({
      ...item,
      createdAt: item.createdAt,
    }));
  } catch (error: any) {
    console.error("NEWSLETTER SUBSCRIBERS ERROR:", error?.message);
    return [];
  }
}

/**
 * --------------------------
 * Payment Transactions
 * --------------------------
 */
export async function listPaymentTransactions(): Promise<PaymentTransaction[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<PaymentTransaction[]>>("/api/payment-transactions/list", {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.data.map(item => ({
      ...item,
      createdAt: item.createdAt,
    }));
  } catch (error: any) {
    console.error("PAYMENT TRANSACTIONS ERROR:", error?.message);
    return [];
  }
}

/**
 * --------------------------
 * Invoices
 * --------------------------
 */
export async function listInvoices(): Promise<Invoice[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<Invoice[]>>("/api/invoices/list", {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.data;
  } catch (error: any) {
    console.error("INVOICES ERROR:", error?.message);
    return [];
  }
}

/**
 * --------------------------
 * Credit Notes
 * --------------------------
 */
export async function listCreditNotes(): Promise<CreditNote[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<CreditNote[]>>("/api/credit-notes/list", {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.data;
  } catch (error: any) {
    console.error("CREDIT NOTES ERROR:", error?.message);
    return [];
  }
}

/**
 * --------------------------
 * Patient Profiles
 * --------------------------
 */
export async function listPatientProfiles(): Promise<PatientProfile[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<PatientProfile[]>>("/api/patient-profiles/list", {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.data.map(item => ({
      ...item,
      dob: item.dob,
    }));
  } catch (error: any) {
    console.error("PATIENT PROFILES ERROR:", error?.message);
    return [];
  }
}

/**
 * --------------------------
 * AI Feedback
 * --------------------------
 */
export async function listAiFeedback(): Promise<AIFeedback[]> {
  try {
    const token = await getToken();
    const { data } = await serverApi.get<ApiResponse<AIFeedback[]>>("/api/ai-feedback/list", {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.data.map(item => ({
      ...item,
      timestamp: item.timestamp,
    }));
  } catch (error: any) {
    console.error("AI FEEDBACK ERROR:", error?.message);
    return [];
  }
}