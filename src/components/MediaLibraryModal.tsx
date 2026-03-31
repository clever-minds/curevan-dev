"use client";

import Image from "next/image";
import MediaUploader from "./MediaUploader";
import type { MediaItem, MediaFile } from "@/types/media";
import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MediaLibraryModal({
  media,
  loading,
  onSelect,
  onClose,
  upload,
  setUpload,
  reloadMedia,
  multiple = false,
}: {
  media: MediaItem[];
  loading: boolean;
  onSelect: (items: MediaItem[]) => void;
  onClose: () => void;
  upload: MediaFile[];
  setUpload: React.Dispatch<React.SetStateAction<MediaFile[]>>;
  reloadMedia: () => void;
  multiple?: boolean;
}) {
  const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);

  const toggleSelect = (item: MediaItem) => {
    if (!multiple) {
      onSelect([item]);
      return;
    }

    const isSelected = selectedItems.some((si) => si.id === item.id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter((si) => si.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleSelectAll = () => {
    setSelectedItems(media);
  };

  const handleDeselectAll = () => {
    setSelectedItems([]);
  };

  const handleConfirm = () => {
    onSelect(selectedItems);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex justify-center items-center">
      <div className="bg-white rounded w-[1000px] max-h-[85vh] flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50/50">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg">Media Library</h2>
            {multiple && media.length > 0 && (
              <div className="flex gap-2 ml-4">
                <button
                  onClick={handleSelectAll}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  Deselect All
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT: MEDIA */}
          <div className="flex-1 p-4 overflow-auto">
            {loading && <p className="text-sm text-gray-500">Loading...</p>}
            {!loading && media.length === 0 && (
              <p className="text-sm text-gray-500">No media found</p>
            )}

            <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
              {media.map((item) => {
                const isSelected = selectedItems.some((si) => si.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item)}
                    className={cn(
                      "relative border-2 rounded-lg cursor-pointer transition-all overflow-hidden group",
                      isSelected 
                        ? "border-blue-500 ring-2 ring-blue-500/20" 
                        : "border-gray-200 hover:border-blue-300"
                    )}
                  >
                    <Image
                      src={`${MEDIA_BASE_URL}${item.url}`}
                      width={150}
                      height={150}
                      alt=""
                      className="h-28 w-full object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                    
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5 shadow-md">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    {multiple && !isSelected && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Circle className="w-4 h-4 text-white/50" />
                      </div>
                    )}
                  </div>
                );
              })}
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

        {/* FOOTER */}
        {multiple && (
          <div className="px-4 py-3 border-t bg-gray-50/50 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {selectedItems.length} items selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedItems.length === 0}
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
