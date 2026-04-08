import api from "./axios";

/* =========================
    LIST MEDIA (IMAGE + VIDEO)
   ========================= */
export async function listMedia(token: string) {
  try {
    const { data } = await api.get("/api/media/list", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (data && data.success === false) {
       throw new Error(data.message || data.error || "Failed to fetch media");
    }
    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || "Failed to fetch media";
    throw new Error(errorMsg);
  }
}

/* =========================
    UPLOAD MEDIA (MULTIPLE)
   ========================= */
export async function uploadMedia(
  token: string,
  files: File[]
) {
  try {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files[]", file);
    });

    const { data } = await api.post(
      "/api/media/upload",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (data && data.success === false) {
       throw new Error(data.message || data.error || "Failed to upload media");
    }

    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || "Failed to upload media";
    throw new Error(errorMsg);
  }
}


/* =========================
    DELETE MEDIA
   ========================= */
export async function deleteMedia(id: number | string, token: string) {
  try {
    const { data } = await api.delete(`/api/media/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (data && data.success === false) {
       throw new Error(data.message || data.error || "Failed to delete media");
    }
    return data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || "Failed to delete media";
    throw new Error(errorMsg);
  }
}

