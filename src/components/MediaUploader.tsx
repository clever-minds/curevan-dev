"use client";

import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { useEffect } from "react";
import type { MediaFile } from "@/types/media";
import { uploadMedia } from "@/lib/api/media";
import { getToken } from "@/lib/auth";

export default function MediaUploader({
  files,
  setFiles,
  onUploaded,
}: {
  files: MediaFile[];
  setFiles: React.Dispatch<React.SetStateAction<MediaFile[]>>;
  onUploaded: () => void;
}) {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [],
      "video/*": [],
    },
    multiple: true,

    onDrop: async (acceptedFiles) => {
      if (!acceptedFiles.length) return;

      const previews: MediaFile[] = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setFiles((prev) => [...prev, ...previews]);

      try {
        const token =await getToken();
        await uploadMedia(token as string, acceptedFiles);
        onUploaded();
      } catch (e) {
        console.error("Upload failed", e);
      }
    },
  });

  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  return (
    <div {...getRootProps()} className="border p-3 rounded cursor-pointer">
      <input {...getInputProps()} />

      {files.length === 0 && (
        <p className="text-sm text-gray-500">
          Upload images or videos
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 mt-3">
        {files.map((file, i) =>
          file.type.startsWith("image") ? (
            <Image
              key={i}
              src={file.preview}
              width={120}
              height={120}
              alt=""
              className="h-24 w-full object-cover rounded"
              unoptimized
            />
          ) : (
            <video
              key={i}
              src={file.preview}
              className="h-24 w-full object-cover rounded"
              controls
            />
          )
        )}
      </div>
    </div>
  );
}
