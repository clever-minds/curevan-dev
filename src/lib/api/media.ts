import api from "./axios";

/* =========================
    LIST MEDIA (IMAGE + VIDEO)
   ========================= */
export async function listMedia( token: string,
) {
  try {
    const { data } = await api.get("/api/media/list");
    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch media"
    );
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

    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to upload media"
    );
  }
}


/* =========================
    DELETE MEDIA
   ========================= */
export async function deleteMedia(id: number | string) {
  try {
    const { data } = await api.delete(`/api/media/delete/${id}`);
    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to delete media"
    );
  }
}
