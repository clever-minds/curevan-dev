import serverApi from "@/lib/repos/axios.server";
import type { JournalEntry } from "../types";
import { getToken } from '@/lib/auth';



export async function submitEditorForm(
  data: Partial<JournalEntry>, // ✅ partial allows only form fields
  contentType: string,
  setImagePreview?: (preview: string | null) => void
): Promise<JournalEntry | null> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Token missing, please login again");
    }

    // generate slug if missing
    const slug = data.slug || data.title?.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") || "";

    const payload: Partial<JournalEntry> = {
      ...data,
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { data: response } = await serverApi.post(
      `/api/general/journal/add`,
      payload,
      {
        headers: {
          withCredentials: true,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (setImagePreview) setImagePreview(null);

    // Construct a full Journal object for TypeScript
  const newJournal: JournalEntry = {
      ...(payload as any),
      id: response.id?.toString() || "",
      featuredImage: data.featuredImage,
      authorId: data.authorId || "",
      authorName: data.authorName || "",
      stats: {
        totalViews: 0,
        uniqueViews: 0,
      },
    };

    return newJournal;
  } catch (error: any) {
    console.error(`${contentType.toUpperCase()} SUBMIT ERROR:`, error?.message);
    return null;
  }
}
/**
 * Fetch list of journals/editor content
 */
export async function getEditorList(
  contentType: string,
): Promise<JournalEntry[] | null> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Token missing, please login again');
    }

    const { data } = await serverApi.get(`/api/general/journal/list`, {
      headers: {
        withCredentials: true,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return data.data || data || [];
  } catch (error: any) {
    console.error(`Error fetching ${contentType} list:`, error?.message);
    return null;
  }
}
export async function updateJournal(
  id: number | string,
  payload: Partial<JournalEntry>
): Promise<JournalEntry | null> {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error("Token missing, please login again");
    }

    const { data } = await serverApi.put(
      `/api/general/journal/update/${id}`,
      payload,
      {
        headers: {
          withCredentials: true,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data.data || data || null;
  } catch (error: any) {
    console.error("Error updating journal:", error?.message);
    return null;
  }
}