"use client";

import React, { useMemo, useState } from "react";
import { message, Progress, Button } from "antd";
import Image from "next/image";

type FolderType =
  | "product"
  | "vendor-logo"
  | "vendor-banner"
  | "profile"
  | "banner"
  | "ad"
  | "payment-proof";

interface Props {
  folderType: FolderType;
  vendorId?: string;
  userId?: string;
  guestUploadId?: string;
  skipPersistence?: boolean;
  accept?: string;
  helpText?: string;
  onUploaded?: (result: { url: string; publicId: string; cacheBustedUrl?: string }) => void;
}

export default function ImageUpload({
  folderType,
  vendorId,
  userId,
  guestUploadId,
  skipPersistence,
  accept,
  helpText,
  onUploaded,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const inputId = useMemo(
    () => `image-upload-${folderType}-${Math.random().toString(36).slice(2, 8)}`,
    [folderType]
  );

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folderType", folderType);
    if (vendorId) fd.append("vendorId", vendorId);
    if (userId) fd.append("userId", userId);
    if (guestUploadId) fd.append("guestUploadId", guestUploadId);
    if (skipPersistence) fd.append("skipPersistence", "true");

    try {
      setUploading(true);
      setProgress(5);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      setProgress(60);

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setProgress(100);
      setUploadedUrl(data.cacheBustedUrl || data.url);
      message.success("Upload successful");
      onUploaded?.({
        url: data.url,
        publicId: data.publicId,
        cacheBustedUrl: data.cacheBustedUrl,
      });
    } catch (err: any) {
      message.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  return (
    <div className="image-upload space-y-3">
      <input
        id={inputId}
        type="file"
        accept={accept || "image/*"}
        onChange={handleFile}
        disabled={uploading}
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        className="inline-flex cursor-pointer items-center rounded-ds-md border border-ds-border-base px-3 py-2 text-sm font-medium text-ds-text-primary hover:bg-ds-surface-sunken"
      >
        {uploading ? "Uploading..." : "Choose image"}
      </label>
      {uploading && <Progress percent={progress} size="small" />}
      {helpText ? <p className="text-xs text-ds-text-secondary">{helpText}</p> : null}
      {uploadedUrl ? (
        <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-sunken p-2">
          <div className="relative h-36 w-full overflow-hidden rounded-ds-sm">
            <Image
              src={uploadedUrl}
              alt="Uploaded preview"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}
      {uploadedUrl ? (
        <Button type="link" disabled={uploading} className="px-0">
          Upload another image
        </Button>
      ) : null}
    </div>
  );
}
