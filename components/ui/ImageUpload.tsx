"use client";

import React, { useMemo, useState } from "react";
import { message, Progress, Button } from "antd";
import Image from "next/image";
import {
  type BannerPlacement,
  type BannerPlacementWarning,
  validateBannerPlacementRatio,
} from "@/lib/utils/bannerPlacementValidation";

export type FolderType =
  | "product"
  | "vendor-logo"
  | "vendor-banner"
  | "profile"
  | "banner"
  | "ad"
  | "payment-proof"
  | "verification-doc"
  | "bug-report";

export type UploadedImageResult = {
  url: string;
  publicId: string;
  cacheBustedUrl?: string;
  width?: number;
  height?: number;
  format?: string;
};

type PlacementValidationOptions = {
  placement?: BannerPlacement;
  getPlacement?: () => BannerPlacement | undefined;
  tolerancePercent?: number;
  onWarning?: (warning: BannerPlacementWarning | null) => void;
};

interface Props {
  folderType: FolderType;
  vendorId?: string;
  userId?: string;
  guestUploadId?: string;
  skipPersistence?: boolean;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  valueUrl?: string;
  disabled?: boolean;
  helpText?: string;
  onUploaded?: (result: UploadedImageResult) => void;
  onUploadedMany?: (results: UploadedImageResult[]) => void;
  placementValidation?: PlacementValidationOptions;
}

export default function ImageUpload({
  folderType,
  vendorId,
  userId,
  guestUploadId,
  skipPersistence,
  accept,
  multiple = false,
  maxFiles = 1,
  valueUrl,
  disabled = false,
  helpText,
  onUploaded,
  onUploadedMany,
  placementValidation,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const inputId = useMemo(
    () => `image-upload-${folderType}-${Math.random().toString(36).slice(2, 8)}`,
    [folderType]
  );

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = e.currentTarget;
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const allowedCount = Number.isFinite(maxFiles) ? Math.max(0, Math.floor(maxFiles)) : 1;
    if (allowedCount === 0) {
      message.warning("Uploading is disabled for this field.");
      return;
    }
    const boundedFiles = (multiple ? selectedFiles : selectedFiles.slice(0, 1)).slice(0, allowedCount);
    if (selectedFiles.length > boundedFiles.length) {
      message.warning(`Only ${allowedCount} image${allowedCount === 1 ? "" : "s"} can be uploaded at once.`);
    }

    const uploadedResults: UploadedImageResult[] = [];

    try {
      setUploading(true);
      setProgress(5);

      for (let index = 0; index < boundedFiles.length; index += 1) {
        const file = boundedFiles[index] as File;

        const fd = new FormData();
        fd.append("file", file);
        fd.append("folderType", folderType);
        if (vendorId) fd.append("vendorId", vendorId);
        if (userId) fd.append("userId", userId);
        if (guestUploadId) fd.append("guestUploadId", guestUploadId);
        if (skipPersistence) fd.append("skipPersistence", "true");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Upload failed");
        }

        const result: UploadedImageResult = {
          url: data.url,
          publicId: data.publicId,
          cacheBustedUrl: data.cacheBustedUrl,
        };
        if (typeof data.width === "number") result.width = data.width;
        if (typeof data.height === "number") result.height = data.height;
        if (typeof data.format === "string") result.format = data.format;

        const activePlacement =
          placementValidation?.getPlacement?.() ?? placementValidation?.placement;
        if (activePlacement) {
          const validation = validateBannerPlacementRatio({
            placement: activePlacement,
            width: result.width,
            height: result.height,
            tolerancePercent: placementValidation?.tolerancePercent,
          });
          if (validation.isMatch) {
            placementValidation?.onWarning?.(null);
          } else {
            placementValidation?.onWarning?.(validation.warning);
            message.warning(validation.warning.message);
          }
        } else {
          placementValidation?.onWarning?.(null);
        }

        uploadedResults.push(result);
        onUploaded?.(result);
        setUploadedUrl(result.cacheBustedUrl || result.url);
        setProgress(Math.round(((index + 1) / boundedFiles.length) * 100));
      }

      if (uploadedResults.length > 0) {
        onUploadedMany?.(uploadedResults);
        message.success(
          uploadedResults.length === 1
            ? "Upload successful"
            : `${uploadedResults.length} images uploaded successfully`
        );
      }
    } catch (err: any) {
      message.error(err?.message || "Upload failed");
    } finally {
      if (inputElement) {
        inputElement.value = "";
      }
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const previewUrl = valueUrl || uploadedUrl;

  return (
    <div className="image-upload space-y-3">
      <input
        id={inputId}
        type="file"
        accept={accept || "image/*"}
        multiple={multiple}
        onChange={handleFile}
        disabled={uploading || disabled}
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        className={`inline-flex items-center rounded-ds-md border border-ds-border-base px-3 py-2 text-sm font-medium ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer text-ds-text-primary hover:bg-ds-surface-sunken"
        }`}
      >
        {uploading ? "Uploading..." : multiple ? "Choose images" : "Choose image"}
      </label>
      {uploading && <Progress percent={progress} size="small" />}
      {helpText ? <p className="text-xs text-ds-text-secondary">{helpText}</p> : null}
      {previewUrl ? (
        <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-sunken p-2">
          <div className="relative h-36 w-full overflow-hidden rounded-ds-sm">
            <Image
              src={previewUrl}
              alt="Uploaded preview"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}
      {previewUrl ? (
        <Button type="link" disabled={uploading} className="px-0">
          {multiple ? "Upload more images" : "Upload another image"}
        </Button>
      ) : null}
    </div>
  );
}
