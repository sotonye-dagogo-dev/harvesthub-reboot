"use client";

import { useState } from "react";
import { Button, Tag, message } from "antd";
import { DeleteOutlined, FilePdfOutlined, VideoCameraOutlined } from "@ant-design/icons";
import ImageUpload from "@/components/ui/ImageUpload";
import {
  MAX_UPLOAD_SIZE_MB,
  type FolderType,
} from "@/lib/utils/uploadConfig";
import { SERVICE_LIMITS } from "@/lib/config/serviceFulfillment";
import { validateServiceVideoFile } from "../videoValidation";
import { galleryImages } from "../wizardModel";
import { errorFor, Field, StepForm, StepSection, type StepComponentProps } from "./stepShared";

const BYTES_PER_MB = 1024 * 1024;

/** Posts one file to the shared upload route and returns its stored URL. */
async function uploadFile(file: File, folderType: FolderType, vendorId?: string): Promise<string> {
  if (!vendorId) {
    throw new Error("A vendor profile is required before uploading files");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folderType", folderType);
  formData.append("vendorId", vendorId);

  const response = await fetch("/api/upload", { method: "POST", body: formData });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error || "Upload failed");
  }
  return data.url;
}

function PickFileButton({
  accept,
  label,
  busy,
  disabled,
  onPick,
}: {
  accept: string;
  label: string;
  busy: boolean;
  disabled?: boolean;
  onPick: (file: File) => void;
}) {
  return (
    <label
      className={`inline-flex items-center rounded-ds-md border border-ds-border-base px-3 py-2 text-sm font-medium ${
        busy || disabled
          ? "cursor-not-allowed text-ds-text-placeholder opacity-60"
          : "cursor-pointer text-ds-text-primary hover:bg-ds-surface-sunken"
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="sr-only"
        disabled={busy || disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onPick(file);
        }}
      />
      {busy ? "Uploading…" : label}
    </label>
  );
}

/**
 * Step 4 — media.
 *
 * Slot counts come from `SERVICE_LIMITS` (5 images incl. the cover, 2 PDFs,
 * 1 MP4) and every upload goes through the shared `/api/upload` pipeline with
 * the matching folder type. The video duration guard runs before any network
 * call because the server has no way to measure a clip.
 */
export default function MediaStep({
  values,
  errors,
  onChange,
  vendorId,
  disabled,
}: StepComponentProps) {
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const gallery = galleryImages(values);
  const imagesError = errorFor(errors, "media.images");
  const documentsError = errorFor(errors, "media.documents");
  const videoError = errorFor(errors, "media.video");

  const addImages = (urls: string[]) => {
    const next = [...values.media.images];
    for (const raw of urls) {
      const url = raw.trim();
      if (!url || next.includes(url) || galleryImages({ ...values, media: { ...values.media, images: [...next, url] } }).length > SERVICE_LIMITS.maxImages) {
        continue;
      }
      next.push(url);
    }
    onChange({ media: { ...values.media, images: next } });
  };

  const handleDocument = async (file: File) => {
    const extension = (file.name.split(".").pop() ?? "").toLowerCase();
    if (extension !== "pdf") {
      message.error("Supporting documents must be PDF files");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_MB["service-doc"] * BYTES_PER_MB) {
      message.error(`Documents must be at most ${MAX_UPLOAD_SIZE_MB["service-doc"]}MB`);
      return;
    }
    if (values.media.documents.length >= SERVICE_LIMITS.maxPdfs) {
      message.warning(`You can attach up to ${SERVICE_LIMITS.maxPdfs} documents`);
      return;
    }

    setUploadingDoc(true);
    try {
      const url = await uploadFile(file, "service-doc", vendorId);
      onChange({ media: { ...values.media, documents: [...values.media.documents, url] } });
      message.success("Document uploaded");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleVideo = async (file: File) => {
    const issue = await validateServiceVideoFile(file);
    if (issue) {
      message.error(issue);
      return;
    }

    setUploadingVideo(true);
    try {
      const url = await uploadFile(file, "service-video", vendorId);
      onChange({ media: { ...values.media, video: url } });
      message.success("Promo video uploaded");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <StepForm>
      <StepSection
        title="Media"
        description={`${SERVICE_LIMITS.maxImages} images (the cover from step 1 counts), ${SERVICE_LIMITS.maxPdfs} PDFs and one ${SERVICE_LIMITS.maxVideoSeconds}-second promo video.`}
      />

      <div className="space-y-6">
        <Field
          label="Gallery images"
          error={imagesError}
          help="Extra angles, samples or past work. Uploaded to your product folder."
        >
          <div className="space-y-3">
            <ImageUpload
              folderType="product"
              vendorId={vendorId}
              multiple
              disabled={disabled || gallery.length >= SERVICE_LIMITS.maxImages}
              maxFiles={Math.max(0, SERVICE_LIMITS.maxImages - gallery.length)}
              helpText={`${gallery.length}/${SERVICE_LIMITS.maxImages} slots used (cover included).`}
              onUploadedMany={(results) => addImages(results.map((result) => result.url))}
            />

            {values.media.images.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {values.media.images.map((url) => (
                  <Tag
                    key={url}
                    closable={!disabled}
                    className="m-0"
                    onClose={() =>
                      onChange({
                        media: { ...values.media, images: values.media.images.filter((entry) => entry !== url) },
                      })
                    }
                  >
                    {url.split("/").pop() || "Image"}
                  </Tag>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ds-text-tertiary">No extra images yet.</p>
            )}
          </div>
        </Field>

        <div className="rounded-ds-lg border border-ds-border-base bg-ds-surface-sunken p-4">
          <Field
            label="Supporting documents"
            error={documentsError}
            help={`PDF only, up to ${MAX_UPLOAD_SIZE_MB["service-doc"]}MB each — a brief, portfolio or price sheet.`}
          >
            <div className="space-y-3">
              <PickFileButton
                accept=".pdf"
                label={uploadingDoc ? "Uploading…" : "Choose PDF"}
                busy={uploadingDoc}
                disabled={disabled || values.media.documents.length >= SERVICE_LIMITS.maxPdfs}
                onPick={(file) => void handleDocument(file)}
              />

              {values.media.documents.length > 0 ? (
                <ul className="space-y-2">
                  {values.media.documents.map((url) => (
                    <li
                      key={url}
                      className="flex items-center justify-between gap-2 rounded-ds-sm border border-ds-border-base bg-ds-surface-base px-3 py-2"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-xs text-ds-text-primary">
                        <FilePdfOutlined className="shrink-0" aria-hidden />
                        <span className="truncate">{url.split("/").pop() || "Document"}</span>
                      </span>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        aria-label="Remove document"
                        disabled={disabled}
                        onClick={() =>
                          onChange({
                            media: {
                              ...values.media,
                              documents: values.media.documents.filter((entry) => entry !== url),
                            },
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-ds-text-tertiary">
                  {values.media.documents.length}/{SERVICE_LIMITS.maxPdfs} documents attached.
                </p>
              )}
            </div>
          </Field>
        </div>

        <div className="rounded-ds-lg border border-ds-border-base bg-ds-surface-sunken p-4">
          <Field
            label="Promo video"
            error={videoError}
            help={`MP4, at most ${MAX_UPLOAD_SIZE_MB["service-video"]}MB and ${SERVICE_LIMITS.maxVideoSeconds} seconds. The duration is checked in your browser before the upload starts.`}
          >
            <div className="space-y-3">
              <PickFileButton
                accept="video/mp4,.mp4"
                label={uploadingVideo ? "Uploading…" : "Choose MP4"}
                busy={uploadingVideo}
                disabled={disabled || Boolean(values.media.video)}
                onPick={(file) => void handleVideo(file)}
              />

              {values.media.video ? (
                <div className="flex items-center justify-between gap-2 rounded-ds-sm border border-ds-border-base bg-ds-surface-base px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2 text-xs text-ds-text-primary">
                    <VideoCameraOutlined className="shrink-0" aria-hidden />
                    <span className="truncate">{values.media.video.split("/").pop() || "Video"}</span>
                  </span>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    aria-label="Remove promo video"
                    disabled={disabled}
                    onClick={() => onChange({ media: { ...values.media, video: null } })}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-ds-text-tertiary">No promo video yet.</p>
              )}
            </div>
          </Field>
        </div>
      </div>
    </StepForm>
  );
}
