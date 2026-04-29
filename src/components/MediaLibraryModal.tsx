"use client";

import Image from "next/image";
import MediaUploader from "./MediaUploader";
import type { MediaItem, MediaFile } from "@/types/media";
import { useState, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'library' | 'url'>('library');
  const [externalUrl, setExternalUrl] = useState('');

  const toggleSelect = (item: MediaItem) => {
    if (!multiple) {
      setSelectedItems([item]);
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

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[10000] flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1000px] max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">

        {/* HEADER */}
        <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50/50">
          <div className="flex items-center gap-6">
            <h2 className="font-bold text-lg">Media Picker</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('library')}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                  activeTab === 'library' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Media Library
              </button>
              <button
                onClick={() => setActiveTab('url')}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                  activeTab === 'url' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                )}
              >
                External URL
              </button>
            </div>
            {activeTab === 'library' && multiple && media.length > 0 && (
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
        <div className="flex flex-1 overflow-hidden min-h-[400px]">
          {activeTab === 'library' ? (
            <div className="flex flex-1 overflow-hidden w-full">
              {/* LEFT: MEDIA */}
              <div className="flex-1 p-6 overflow-auto min-w-0">
                {loading && <p className="text-sm text-gray-500">Loading...</p>}
                {!loading && media.length === 0 && (
                  <p className="text-sm text-gray-500">No media found</p>
                )}

                <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
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
                        {item.type === "video" || [".mp4", ".webm", ".ogg", ".mov", ".m4v"].some(ext => item.url.toLowerCase().endsWith(ext)) ? (
                          <video
                            src={item.url.startsWith("http") ? item.url : `${MEDIA_BASE_URL}${item.url}`}
                            className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <Image
                            src={item.url.startsWith("http") ? item.url : `${MEDIA_BASE_URL}${item.url}`}
                            width={150}
                            height={150}
                            alt=""
                            className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                            unoptimized
                          />
                        )}
                        
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
              <div className="w-[280px] border-l p-4 bg-gray-50/30">
                <h3 className="font-semibold mb-2 text-sm">Upload New Media</h3>
                <MediaUploader
                  files={upload}
                  setFiles={setUpload}
                  onUploaded={() => {
                    setUpload([]);
                    reloadMedia();
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 p-12 flex flex-col items-center justify-center space-y-6">
              <div className="max-w-md w-full space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">Insert External URL</h3>
                  <p className="text-sm text-gray-500">Paste a YouTube link or a direct video/image URL.</p>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all font-medium"
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-xl bg-gray-50 text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Support</p>
                      <p className="text-sm font-semibold">YouTube & Vimeo</p>
                    </div>
                    <div className="p-4 border rounded-xl bg-gray-50 text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Format</p>
                      <p className="text-sm font-semibold">MP4, WebM, Images</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-4 py-3 border-t bg-gray-50/50 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {activeTab === 'library' ? `${selectedItems.length} items selected` : 'External media will be inserted'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (activeTab === 'library') {
                  onSelect(selectedItems);
                } else if (externalUrl) {
                  const isVideo = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].some(ext => externalUrl.toLowerCase().endsWith(ext)) || externalUrl.includes('youtube.com') || externalUrl.includes('youtu.be') || externalUrl.includes('vimeo.com');
                  onSelect([{
                    id: Date.now(),
                    url: externalUrl,
                    type: isVideo ? 'video' : 'image'
                  }]);
                }
              }}
              disabled={activeTab === 'library' ? selectedItems.length === 0 : !externalUrl}
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
