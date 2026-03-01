export type MediaItem = {
  id: number;
  url: string;
  type?: "image" | "video";
};

export type MediaFile = File & {
  preview: string;
};
