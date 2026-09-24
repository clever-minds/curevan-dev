"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import MediaLibraryModal from "./MediaLibraryModal";
import type { MediaItem, MediaFile } from "@/types/media";
import { listMedia } from "@/lib/api/media";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

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

  const { toast } = useToast();
  const fetchMedia = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await listMedia(token);

      const isVideo = (url: string) => {
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
        return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
      };

      setLibrary(
        data.map((m: any) => ({
          id: m.id,
          url: m.file_path,
          type: isVideo(m.file_path) ? "video" : "image",
        }))
      );
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fetch Failed",
        description: error.message || "Could not load media library",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  return (
    <div className="space-y-3">
      {/* ✅ SAFE MAP */}
      <div className="flex gap-4 flex-wrap">
        {(value || []).map((img, index) => (
          <div key={img.id + img.url + index} className="relative group">
            {img.type === "video" || [".mp4", ".webm", ".ogg", ".mov", ".m4v"].some(ext => img.url.toLowerCase().endsWith(ext)) ? (
              <video
                src={
                  img.url.startsWith("http") || img.url.startsWith("blob")
                    ? img.url
                    : `${MEDIA_BASE_URL}${img.url}`
                }
                className="w-[120px] h-[120px] border-2 border-gray-100 rounded-xl object-cover shadow-sm transition-transform group-hover:scale-105"
              />
            ) : img.type === "document" || !img.url ? (
              <div className="w-[120px] h-[120px] border-2 border-gray-100 rounded-xl flex items-center justify-center bg-gray-50 shadow-sm text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span className="sr-only">Document Selected</span>
              </div>
            ) : (
              <Image
                src={
                  img.url.startsWith("http") || img.url.startsWith("blob")
                    ? img.url
                    : `${MEDIA_BASE_URL}${img.url}`
                }
                width={120}
                height={120}
                alt=""
                className="border-2 border-gray-100 rounded-xl object-cover shadow-sm transition-transform group-hover:scale-105"
                unoptimized
              />
            )}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const newValue = (value || []).filter((_, i) => i !== index);
                  onChange(newValue);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700 z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            )}
          </div>
        ))}
        
        {!disabled && (multiple || (value || []).length === 0) && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-[120px] h-[120px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-gray-500 hover:text-blue-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span className="text-xs font-medium">Add Media</span>
          </button>
        )}
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
