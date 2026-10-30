export type MediaItem = {
  id: number;
  url: string;
  type?: "image" | "video" | "document";
};

export type MediaFile = File & {
  preview: string;
};
