"use client";

import React, { useState } from "react";
import { message, Progress, Button } from "antd";

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
  onUploaded?: (result: { url: string; publicId: string }) => void;
}

export default function ImageUpload({ folderType, vendorId, userId, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folderType", folderType);
    if (vendorId) fd.append("vendorId", vendorId);
    if (userId) fd.append("userId", userId);

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
      message.success("Upload successful");
      onUploaded?.({ url: data.url, publicId: data.publicId });
    } catch (err: any) {
      message.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  return (
    <div className="image-upload">
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
      {uploading && <Progress percent={progress} size="small" />}
      <div style={{ marginTop: 8 }}>
        <Button type="link" disabled={uploading} />
      </div>
    </div>
  );
}
