"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import MediaLibraryModal from "./MediaLibraryModal";
import type { MediaItem, MediaFile } from "@/types/media";
import { listMedia } from "@/lib/api/media";
import { getToken } from "@/lib/auth";

const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function MediaPicker({
  value = [],                 // ✅ DEFAULT VALUE (IMPORTANT)
  onChange,
  multiple = true, // ✅ optional prop
  disabled = false,
}: {
  value?: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [upload, setUpload] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMedia = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      setLoading(true);
      const data = await listMedia(token);

      setLibrary(
        data.map((m: any) => ({
          id: m.id,
          url: m.file_path,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  return (
    <div className="space-y-3">
      {!disabled && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border px-3 py-2 rounded"
        >
          Select / Upload Images
        </button>
      )}

      {/* ✅ SAFE MAP */}
      <div className="flex gap-2 flex-wrap">
        {(value || []).map((img) => (
          <Image
            key={img.id + img.url}
            src={
              img.url.startsWith("http") || img.url.startsWith("blob")
                ? img.url
                : `${MEDIA_BASE_URL}${img.url}`
            }
            width={100}
            height={100}
            alt=""
            className="border rounded object-cover"
            unoptimized
          />
        ))}
      </div>

      {open && (
        <MediaLibraryModal
          media={library}
          loading={loading}
          upload={upload}
          setUpload={setUpload}
          reloadMedia={fetchMedia}
          onClose={() => setOpen(false)}
          multiple={multiple}
          onSelect={(items) => {
            if (multiple) {
              // Merge unique items
              const newValue = [...(value || [])];
              items.forEach((item) => {
                if (!newValue.some((v) => v.id === item.id)) {
                  newValue.push(item);
                }
              });
              onChange(newValue);
            } else {
              // Single select logic: replace previous
              onChange(items);
            }
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
