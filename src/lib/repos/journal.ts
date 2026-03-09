import serverApi from "@/lib/repos/axios.server";
import type { ApiResponse, KnowledgeBase } from "../types";
import { getToken } from "@/lib/auth";

/**
 * Create Knowledge Base / Journal
 */
export async function submitEditorForm(
  data: Partial<KnowledgeBase>,
  contentType: string,
  setImagePreview?: (preview: string | null) => void
): Promise<ApiResponse<KnowledgeBase | null>> {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error("Token missing, please login again");
    }

    // Generate slug if missing
    const slug =
      data.slug ||
      data.title
        ?.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-") ||
      "";

    const payload: Partial<KnowledgeBase> = {
      ...data,
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const response = await serverApi.post<ApiResponse<KnowledgeBase>>(
      `/api/general/knowledge-base/add`,
      payload,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (setImagePreview) {
      setImagePreview(null);
    }

    return response.data;
  } catch (error: any) {
    console.error(`${contentType.toUpperCase()} SUBMIT ERROR:`, error?.message);

    return {
      success: false,
      message: error?.message || "Submission failed",
      data: null,
    };
  }
}

/**
 * Fetch Knowledge Base List
 */
export async function getEditorList(
  contentType: string
): Promise<ApiResponse<KnowledgeBase[]>> {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error("Token missing, please login again");
    }

    const response = await serverApi.get<ApiResponse<KnowledgeBase[]>>(
      `/api/general/knowledge-base/list`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(`Error fetching ${contentType} list:`, error?.message);

    return {
      success: false,
      message: error?.message || "Failed to fetch list",
      data: [],
    };
  }
}

/**
 * Update Knowledge Base
 */
export async function updateKnowledgeBase(
  id: number | string,
  payload: Partial<KnowledgeBase>
): Promise<ApiResponse<KnowledgeBase | null>> {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error("Token missing, please login again");
    }

    const response = await serverApi.put<ApiResponse<KnowledgeBase>>(
      `/api/general/knowledge-base/update/${id}`,
      payload,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error updating knowledge base:", error?.message);

    return {
      success: false,
      message: error?.message || "Update failed",
      data: null,
    };
  }
}