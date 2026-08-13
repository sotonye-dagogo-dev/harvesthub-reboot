"use client";

import { Form, Upload, message, Select } from "antd";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import { useState, useEffect, useMemo, useRef } from "react";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { FormComponentProps } from "@/app/types";

const ID_TYPES = [
  { value: "NIN", label: "National Identification Number (NIN)" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "VOTERS_CARD", label: "Voter's Card" },
  { value: "INTERNATIONAL_PASSPORT", label: "International Passport" },
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

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

export default function VerificationDocs({ onNext, updateFormData, formData }: FormComponentProps) {
  const [form] = Form.useForm<VerificationFields>();
  const [idFileList, setIdFileList] = useState<VerificationUploadFile[]>([]);
  const [bizFileList, setBizFileList] = useState<VerificationUploadFile[]>([]);
  const [utilityFileList, setUtilityFileList] = useState<VerificationUploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const guestUploadIdRef = useRef<string | null>(null);

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
    // Restore previous state if going back
    if (formData?.verificationDocuments && formData.verificationDocuments.length > 0) {
      const docs = formData.verificationDocuments as VerificationDocument[];
      const restored = docs.map((doc, i) => ({
        uid: `restored-${i}`,
        name: doc.filename,
        status: "done" as const,
        url: doc.url,
        publicId: doc.publicId,
      }));
      const idDoc = docs.find((doc) => doc.documentType === "ID");
      const bizDoc = docs.find((doc) => doc.documentType === "BUSINESS_REGISTRATION");
      const utilityDoc = docs.find((doc) => doc.documentType === "UTILITY_BILL");

      if (idDoc) {
        setIdFileList([
          {
            uid: "restored-id",
            name: idDoc.filename,
            status: "done",
            url: idDoc.url,
            publicId: idDoc.publicId,
          },
        ]);
      } else {
        setIdFileList(restored.slice(0, 1));
      }

      if (bizDoc) {
        setBizFileList([
          {
            uid: "restored-biz",
            name: bizDoc.filename,
            status: "done",
            url: bizDoc.url,
            publicId: bizDoc.publicId,
          },
        ]);
      } else if (restored.length > 1) {
        setBizFileList(restored.slice(1, 2));
      }

      if (utilityDoc) {
        setUtilityFileList([
          {
            uid: "restored-utility",
            name: utilityDoc.filename,
            status: "done",
            url: utilityDoc.url,
            publicId: utilityDoc.publicId,
          },
        ]);
      } else if (restored.length > 2) {
        setUtilityFileList(restored.slice(2, 3));
      }
    }
  }, [form, formData?.idType, formData?.verificationDocuments]);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      message.error("Only JPG, PNG, or PDF files are accepted");
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      message.error("File must be smaller than 5MB");
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
        onSuccess?.(payload, file);
      })
      .catch((error) => {
        console.error("Verification document upload failed:", error);
        onError?.(error instanceof Error ? error : new Error("Upload failed"));
      });
  };

  const handleChange =
    (setter: React.Dispatch<React.SetStateAction<VerificationUploadFile[]>>) =>
    ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      const synced = newFileList.slice(-1).map((f) => {
        if (f.status === "done" && (f.response as { url?: string; publicId?: string } | null)?.url && !f.url) {
          return {
            ...f,
            url: (f.response as { url: string }).url,
            publicId: (f.response as { publicId?: string }).publicId,
          };
        }
        return f;
      });
      setter(synced as VerificationUploadFile[]);
    };

  const hasUploadingFile = useMemo(
    () =>
      idFileList.some((f) => f.status === "uploading") ||
      bizFileList.some((f) => f.status === "uploading") ||
      utilityFileList.some((f) => f.status === "uploading"),
    [idFileList, bizFileList, utilityFileList]
  );

  const onFinish = async (values: VerificationFields) => {
    const pickDone = (list: VerificationUploadFile[]): VerificationUploadFile | undefined =>
      list.find((f) => f.status === "done" && f.url);

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

      const docs: VerificationDocument[] = [
        toDoc(idFile, "ID", values.idType),
        toDoc(bizFile, "BUSINESS_REGISTRATION", "BUSINESS_REGISTRATION"),
        toDoc(utilityFile, "UTILITY_BILL", "UTILITY_BILL"),
      ];

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

        {/* Valid ID Upload (Required) */}
        <Form.Item
          label={
            <span className="text-ds-text-primary font-medium">
              Valid ID Document <span className="text-ds-status-error-text">*</span>
            </span>
          }
          required
        >
          <Upload
            listType="picture-card"
            fileList={idFileList}
            onChange={handleChange(setIdFileList)}
            beforeUpload={beforeUpload}
            customRequest={uploadViaApi}
            maxCount={1}
            accept=".jpg,.jpeg,.png,.pdf"
          >
            {idFileList.length === 0 && (
              <div>
                <PlusOutlined />
                <div className="mt-2 text-xs">Upload ID</div>
              </div>
            )}
          </Upload>
          <p className="text-xs text-ds-text-placeholder mt-1">
            NIN slip, Driver&apos;s License, Voter&apos;s Card, or Passport. JPG, PNG, or PDF. Max
            5MB.
          </p>
        </Form.Item>

        {/* Business Registration (Required) */}
        <Form.Item
          label={
            <span className="text-ds-text-primary font-medium">
              Business Registration Certificate{" "}
              <span className="text-ds-status-error-text">*</span>
            </span>
          }
          required
        >
          <Upload
            listType="picture-card"
            fileList={bizFileList}
            onChange={handleChange(setBizFileList)}
            beforeUpload={beforeUpload}
            customRequest={uploadViaApi}
            maxCount={1}
            accept=".jpg,.jpeg,.png,.pdf"
          >
            {bizFileList.length === 0 && (
              <div>
                <PlusOutlined />
                <div className="mt-2 text-xs">Upload</div>
              </div>
            )}
          </Upload>
          <p className="text-xs text-ds-text-placeholder mt-1">
            CAC certificate or similar. JPG, PNG, or PDF. Max 5MB.
          </p>
        </Form.Item>

        {/* Utility Bill (Required) */}
        <Form.Item
          label={
            <span className="text-ds-text-primary font-medium">
              Utility Bill <span className="text-ds-status-error-text">*</span>
            </span>
          }
          required
        >
          <Upload
            listType="picture-card"
            fileList={utilityFileList}
            onChange={handleChange(setUtilityFileList)}
            beforeUpload={beforeUpload}
            customRequest={uploadViaApi}
            maxCount={1}
            accept=".jpg,.jpeg,.png,.pdf"
          >
            {utilityFileList.length === 0 && (
              <div>
                <PlusOutlined />
                <div className="mt-2 text-xs">Upload</div>
              </div>
            )}
          </Upload>
          <p className="text-xs text-ds-text-placeholder mt-1">
            Utility bill (electricity, water, etc.). JPG, PNG, or PDF. Max 5MB.
          </p>
        </Form.Item>

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
