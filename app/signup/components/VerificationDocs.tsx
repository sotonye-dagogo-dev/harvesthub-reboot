"use client";

import { Form, Upload, message, Select } from "antd";
import {
  PlusOutlined,
  LoadingOutlined,
  CheckOutlined,
  CloseCircleFilled,
} from "@ant-design/icons";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { FormComponentProps } from "@/app/types";
import {
  deleteUploadedAsset,
  getUploadErrorMessage,
} from "@/lib/utils/uploadHelpers";
import {
  MAX_UPLOAD_SIZE_MB,
  acceptAttributeFor,
} from "@/lib/utils/uploadConfig";

const ID_TYPES = [
  { value: "NIN", label: "National Identification Number (NIN)" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "VOTERS_CARD", label: "Voter's Card" },
  { value: "INTERNATIONAL_PASSPORT", label: "International Passport" },
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ACCEPT_ATTR = acceptAttributeFor("verification-doc");
const MAX_FILE_SIZE_BYTES = MAX_UPLOAD_SIZE_MB["verification-doc"] * 1024 * 1024;

interface VerificationFields {
  idType: string;
  businessRegistrationNumber?: string;
}

type VerificationDocument = {
  documentType: "ID" | "BUSINESS_REGISTRATION" | "UTILITY_BILL";
  filename: string;
  url: string;
  publicId?: string;
};

type VerificationUploadFile = UploadFile & { publicId?: string };

type SlotKey = "id" | "biz" | "utility";

export default function VerificationDocs({ onNext, updateFormData, formData }: FormComponentProps) {
  const [form] = Form.useForm<VerificationFields>();
  const [idFileList, setIdFileList] = useState<VerificationUploadFile[]>([]);
  const [bizFileList, setBizFileList] = useState<VerificationUploadFile[]>([]);
  const [utilityFileList, setUtilityFileList] = useState<VerificationUploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const guestUploadIdRef = useRef<string | null>(null);

  // Tracks the last Cloudinary publicId held by each slot so replacements can
  // destroy the previous asset instead of orphaning it.
  const donePublicIdRef = useRef<Partial<Record<SlotKey, string | undefined>>>({});
  // Snapshot of the docs persisted into the local form draft, used to avoid
  // redundant writes (and write loops) when uploads complete.
  const lastPersistedRef = useRef(
    JSON.stringify({
      idType: formData?.idType ?? "",
      verificationDocuments: (formData?.verificationDocuments as VerificationDocument[] | undefined) ?? [],
    })
  );

  const fileListOf = (slot: SlotKey): VerificationUploadFile[] => {
    if (slot === "id") return idFileList;
    if (slot === "biz") return bizFileList;
    return utilityFileList;
  };

  const setterOf = (slot: SlotKey): React.Dispatch<React.SetStateAction<VerificationUploadFile[]>> => {
    if (slot === "id") return setIdFileList;
    if (slot === "biz") return setBizFileList;
    return setUtilityFileList;
  };

  const docTypeOf = (slot: SlotKey): VerificationDocument["documentType"] => {
    if (slot === "id") return "ID";
    if (slot === "biz") return "BUSINESS_REGISTRATION";
    return "UTILITY_BILL";
  };

  useEffect(() => {
    if (!guestUploadIdRef.current) {
      guestUploadIdRef.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `signup-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    }
  }, []);

  useEffect(() => {
    if (formData?.idType) {
      form.setFieldValue("idType", formData.idType);
    }
    // Restore previous state if going back. Slot-aware so a doc is only ever
    // restored into its own upload slot, and a live upload already in progress
    // is never clobbered by a restore pass.
    const docs = formData?.verificationDocuments as VerificationDocument[] | undefined;
    if (!docs || docs.length === 0) return;

    const restoreSlot = (
      slot: SlotKey,
      doc: VerificationDocument | undefined,
      setter: React.Dispatch<React.SetStateAction<VerificationUploadFile[]>>
    ) => {
      if (!doc) return;
      setter((current) => {
        if (current.some((f) => f.status === "uploading")) return current;
        const existing = current.find((f) => f.status === "done" && f.url);
        if (existing && existing.url === doc.url && existing.publicId === doc.publicId) {
          return current;
        }
        return [
          {
            uid: `restored-${slot}`,
            name: doc.filename,
            status: "done" as const,
            url: doc.url,
            publicId: doc.publicId,
          },
        ];
      });
    };

    const idDoc = docs.find((doc) => doc.documentType === "ID");
    const bizDoc = docs.find((doc) => doc.documentType === "BUSINESS_REGISTRATION");
    const utilityDoc = docs.find((doc) => doc.documentType === "UTILITY_BILL");

    restoreSlot("id", idDoc, setIdFileList);
    restoreSlot("biz", bizDoc, setBizFileList);
    restoreSlot("utility", utilityDoc, setUtilityFileList);

    donePublicIdRef.current.id = idDoc?.publicId;
    donePublicIdRef.current.biz = bizDoc?.publicId;
    donePublicIdRef.current.utility = utilityDoc?.publicId;
  }, [form, formData?.idType, formData?.verificationDocuments]);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      message.error(
        getUploadErrorMessage(new Error("Unsupported file type"), {
          allowedFormats: ["jpeg", "png", "pdf"],
        })
      );
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      message.error(
        getUploadErrorMessage(new Error("File is too large"), {
          maxSizeMB: MAX_UPLOAD_SIZE_MB["verification-doc"],
        })
      );
      return false;
    }
    return true;
  };

  const beforeUpload = (file: File): boolean => {
    return validateFile(file);
  };

  const uploadViaApi: UploadProps["customRequest"] = (options) => {
    const { file, onSuccess, onError } = options;
    const uploadData = new FormData();
    uploadData.append("file", file as Blob);
    uploadData.append("folderType", "verification-doc");
    uploadData.append("skipPersistence", "true");
    if (guestUploadIdRef.current) {
      uploadData.append("guestUploadId", guestUploadIdRef.current);
    }

    fetch("/api/upload", {
      method: "POST",
      body: uploadData,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.url) {
          throw new Error(payload?.error || "Failed to upload verification document");
        }
        return payload;
      })
      .then((payload) => {
        const uploadFile = file as VerificationUploadFile;
        uploadFile.url = payload.url;
        uploadFile.publicId = payload.publicId;
        message.success("Document uploaded");
        onSuccess?.(payload, file);
      })
      .catch((error) => {
        console.error("Verification document upload failed:", error);
        message.error(
          getUploadErrorMessage(error, {
            maxSizeMB: MAX_UPLOAD_SIZE_MB["verification-doc"],
            allowedFormats: ["jpeg", "png", "pdf"],
            fallback: "Upload failed. Please remove the file and try again.",
          })
        );
        onError?.(error instanceof Error ? error : new Error("Upload failed"));
      });
  };

  const syncFromResponse = (f: UploadFile): VerificationUploadFile => {
    if (f.status === "done" && !f.url && (f.response as { url?: string } | null)?.url) {
      return {
        ...f,
        url: (f.response as { url: string }).url,
        publicId: (f.response as { publicId?: string }).publicId,
      } as VerificationUploadFile;
    }
    return f as VerificationUploadFile;
  };

  const handleChange =
    (slot: SlotKey) =>
    ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      const previousDone = donePublicIdRef.current[slot];
      const synced = newFileList.slice(-1).map(syncFromResponse);
      const nextDone = synced.find((f) => f.status === "done" && f.url);
      const nextPublicId = (nextDone as VerificationUploadFile | undefined)?.publicId;

      // A completed replacement: destroy the asset that was previously occupying this slot.
      // (Kept until the replacement succeeds so a failed upload never loses the old copy.)
      if (previousDone && nextPublicId && previousDone !== nextPublicId) {
        void deleteUploadedAsset({
          publicId: previousDone,
          folderType: "verification-doc",
          guestUploadId: guestUploadIdRef.current ?? undefined,
        });
      }

      if (nextPublicId) {
        donePublicIdRef.current[slot] = nextPublicId;
      }
      setterOf(slot)(synced as VerificationUploadFile[]);
    };

  const handleRemove =
    (slot: SlotKey) =>
    (file: UploadFile): boolean => {
      const uploadFile = file as VerificationUploadFile;
      const staleRefId = donePublicIdRef.current[slot];
      const targetId = uploadFile.publicId || staleRefId;
      if (targetId) {
        void deleteUploadedAsset({
          publicId: targetId,
          folderType: "verification-doc",
          guestUploadId: guestUploadIdRef.current ?? undefined,
        });
      }
      donePublicIdRef.current[slot] = undefined;
      // Keep the local form draft in sync so a removed doc does not reappear on revisit.
      const existing = (formData?.verificationDocuments as VerificationDocument[] | undefined) ?? [];
      const remaining = existing.filter((doc) => doc.documentType !== docTypeOf(slot));
      updateFormData({ verificationDocuments: remaining } as Partial<FormComponentProps["formData"]>);
      return true;
    };

  const pickDone = (list: VerificationUploadFile[]): VerificationUploadFile | undefined =>
    list.find((f) => f.status === "done" && f.url);

  const hasUploadingFile = useMemo(
    () =>
      idFileList.some((f) => f.status === "uploading") ||
      bizFileList.some((f) => f.status === "uploading") ||
      utilityFileList.some((f) => f.status === "uploading"),
    [idFileList, bizFileList, utilityFileList]
  );

  const buildDocs = useCallback(
    (
      currentIdType: string,
      idList: VerificationUploadFile[],
      bizList: VerificationUploadFile[],
      utilityList: VerificationUploadFile[]
    ): VerificationDocument[] => {
      const toDoc = (
        file: VerificationUploadFile,
        docType: VerificationDocument["documentType"],
        fallbackPrefix: string
      ): VerificationDocument => ({
        documentType: docType,
        filename: file.originFileObj ? `${fallbackPrefix}_${file.name}` : file.name,
        url: file.url as string,
        publicId: file.publicId,
      });

      const docs: VerificationDocument[] = [];
      const idFile = pickDone(idList);
      const bizFile = pickDone(bizList);
      const utilityFile = pickDone(utilityList);
      if (idFile) docs.push(toDoc(idFile, "ID", currentIdType || "ID"));
      if (bizFile) docs.push(toDoc(bizFile, "BUSINESS_REGISTRATION", "BUSINESS_REGISTRATION"));
      if (utilityFile) docs.push(toDoc(utilityFile, "UTILITY_BILL", "UTILITY_BILL"));
      return docs;
    },
    []
  );

  // Persist uploaded links into the local form draft the moment an upload completes,
  // so the thumbnails re-render on revisit and the user never re-uploads unless they
  // choose to replace a document. Skips while anything is still uploading to avoid
  // churning the draft mid-upload.
  useEffect(() => {
    if (hasUploadingFile) return;
    const currentIdType =
      (form.getFieldValue("idType") as string) || formData?.idType || "";
    const docs = buildDocs(currentIdType, idFileList, bizFileList, utilityFileList);
    if (docs.length === 0) return;
    const serialized = JSON.stringify({ idType: currentIdType, verificationDocuments: docs });
    if (serialized === lastPersistedRef.current) return;
    lastPersistedRef.current = serialized;
    updateFormData({
      idType: currentIdType,
      verificationDocuments: docs,
    } as Partial<FormComponentProps["formData"]>);
  }, [
    idFileList,
    bizFileList,
    utilityFileList,
    form,
    formData?.idType,
    hasUploadingFile,
    updateFormData,
    buildDocs,
  ]);

  const renderThumbOverlay = (originNode: React.ReactNode, file: UploadFile): React.ReactNode => {
    const status = file.status;
    return (
      <div className="relative h-full w-full">
        {originNode}
        {status === "uploading" && (
          <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-1 rounded-ds-md bg-ds-surface-overlay/80 text-ds-text-inverse">
            <LoadingOutlined className="text-base" />
            <span className="text-[11px] font-medium">Uploading...</span>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-1 rounded-ds-md bg-ds-status-error-bg/90 px-2 text-center text-ds-status-error-text">
            <CloseCircleFilled className="text-base" />
            <span className="text-[11px] font-medium leading-tight">Upload failed</span>
          </div>
        )}
        {status === "done" && file.url && (
          <span
            className="absolute right-1 top-1 z-[2] flex h-4 w-4 items-center justify-center rounded-full bg-ds-status-success text-white"
            aria-label="Uploaded successfully"
          >
            <CheckOutlined className="text-[10px]" />
          </span>
        )}
      </div>
    );
  };

  const renderUpload = (
    slot: SlotKey,
    label: React.ReactNode,
    help: string
  ): React.ReactElement => {
    const fileList = fileListOf(slot);
    return (
      <Form.Item label={label} required>
        <Upload
          listType="picture-card"
          fileList={fileList}
          onChange={handleChange(slot)}
          onRemove={handleRemove(slot)}
          itemRender={renderThumbOverlay}
          beforeUpload={beforeUpload}
          customRequest={uploadViaApi}
          maxCount={1}
          accept={ACCEPT_ATTR}
        >
          {fileList.length === 0 && (
            <div>
              <PlusOutlined />
              <div className="mt-2 text-xs">Upload</div>
            </div>
          )}
        </Upload>
        <p className="text-xs text-ds-text-placeholder mt-1">{help}</p>
      </Form.Item>
    );
  };

  const onFinish = async (values: VerificationFields) => {
    const idFile = pickDone(idFileList);
    const bizFile = pickDone(bizFileList);
    const utilityFile = pickDone(utilityFileList);

    if (!idFile || !bizFile || !utilityFile) {
      if (hasUploadingFile) {
        message.warning("Please wait for your documents to finish uploading.");
      } else {
        message.error(
          "Please upload all required documents: valid ID, business registration certificate, and utility bill"
        );
      }
      return;
    }

    setSubmitting(true);
    try {
      const docs: VerificationDocument[] = buildDocs(
        values.idType,
        idFileList,
        bizFileList,
        utilityFileList
      );

      updateFormData({
        idType: values.idType,
        verificationDocuments: docs,
      } as Partial<FormComponentProps["formData"]>);
      message.success("Verification documents uploaded successfully");
      onNext();
    } catch (error) {
      console.error("Error saving verification documents:", error);
      message.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-ds-text-primary mb-2">Verification Documents</h3>
        <p className="text-sm text-ds-text-secondary">
          Upload documents to verify your identity. This helps build trust with buyers.
        </p>
      </div>

      <Form
        form={form}
        name="verification-docs"
        layout="vertical"
        autoComplete="off"
        requiredMark={false}
        onFinish={onFinish}
        className="w-full"
      >
        {/* ID Type */}
        <Form.Item
          name="idType"
          label={<span className="text-ds-text-primary font-medium">ID Type</span>}
          rules={[{ required: true, message: "Please select an ID type" }]}
        >
          <Select size="large" placeholder="Select ID type" options={ID_TYPES} className="w-full" />
        </Form.Item>

        {renderUpload(
          "id",
          <span className="text-ds-text-primary font-medium">
            Valid ID Document <span className="text-ds-status-error-text">*</span>
          </span>,
          "NIN slip, Driver's License, Voter's Card, or Passport. JPG, PNG, or PDF. Max 5MB."
        )}

        {renderUpload(
          "biz",
          <span className="text-ds-text-primary font-medium">
            Business Registration Certificate <span className="text-ds-status-error-text">*</span>
          </span>,
          "CAC certificate or similar. JPG, PNG, or PDF. Max 5MB."
        )}

        {renderUpload(
          "utility",
          <span className="text-ds-text-primary font-medium">
            Utility Bill <span className="text-ds-status-error-text">*</span>
          </span>,
          "Utility bill (electricity, water, etc.). JPG, PNG, or PDF. Max 5MB."
        )}

        <Form.Item className="mb-0">
          <button
            type="submit"
            disabled={submitting || hasUploadingFile}
            aria-busy={submitting}
            className="w-full rounded-ds-md bg-ds-brand-primary py-3 text-white font-semibold hover:bg-ds-brand-primary-hover disabled:bg-ds-surface-disabled transition-colors"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <LoadingOutlined /> Processing...
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </Form.Item>
      </Form>
    </div>
  );
}
