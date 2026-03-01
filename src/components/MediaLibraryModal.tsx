"use client";

import Image from "next/image";
import MediaUploader from "./MediaUploader";
import type { MediaItem, MediaFile } from "@/types/media";

export default function MediaLibraryModal({
  media,
  loading,
  onSelect,
  onClose,
  upload,
  setUpload,
  reloadMedia,
}: {
  media: MediaItem[];
  loading: boolean;
  onSelect: (item: MediaItem) => void;
  onClose: () => void;
  upload: MediaFile[];
  setUpload: React.Dispatch<React.SetStateAction<MediaFile[]>>;
  reloadMedia: () => void;
}) {
  const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex justify-center items-center">
      <div className="bg-white rounded w-[1000px] max-h-[85vh] flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h2 className="font-bold text-lg">Media Library</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT: MEDIA */}
          <div className="flex-1 p-4 overflow-auto">
            {loading && <p className="text-sm text-gray-500">Loading...</p>}
            {!loading && media.length === 0 && (
              <p className="text-sm text-gray-500">No media found</p>
            )}

            <div className="grid grid-cols-5 gap-3">
              {media.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="border cursor-pointer hover:border-blue-500"
                >
                  <Image
                    src={`${MEDIA_BASE_URL}${item.url}`}
                    width={150}
                    height={150}
                    alt=""
                    className="h-28 w-full object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: UPLOAD */}
          <div className="w-[280px] border-l p-4">
            <h3 className="font-semibold mb-2">Upload New Image</h3>

            <MediaUploader
              files={upload}
              setFiles={setUpload}
              onUploaded={() => {
                setUpload([]);
                reloadMedia(); // ✅ reload after upload
              }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
