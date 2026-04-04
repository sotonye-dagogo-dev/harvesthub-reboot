"use client";

import { Form, Upload, message, Select } from "antd";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import type { UploadFile, UploadChangeParam } from "antd/es/upload/interface";
import { FormComponentProps } from "@/app/types";

const ID_TYPES = [
  { value: "NIN", label: "National Identification Number (NIN)" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "VOTERS_CARD", label: "Voter's Card" },
  { value: "INTERNATIONAL_PASSPORT", label: "International Passport" },
];

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

export default function VerificationDocs({ onNext, updateFormData, formData }: FormComponentProps) {
  const [form] = Form.useForm<VerificationFields>();
  const [idFileList, setIdFileList] = useState<UploadFile[]>([]);
  const [bizFileList, setBizFileList] = useState<UploadFile[]>([]);
  const [utilityFileList, setUtilityFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
          },
        ]);
      } else if (restored.length > 2) {
        setUtilityFileList(restored.slice(2, 3));
      }
    }
  }, [form, formData?.idType, formData?.verificationDocuments]);

  const validateFile = (file: File): boolean => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      message.error("Only JPG, PNG, or PDF files are accepted");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error("File must be smaller than 5MB");
      return false;
    }
    return true;
  };

  const handleIdFileChange = ({ fileList: newFileList }: UploadChangeParam) => {
    const limited = newFileList.slice(-1);
    if (limited.length > 0 && limited[0]?.originFileObj) {
      if (!validateFile(limited[0].originFileObj)) return;
    }
    setIdFileList(limited);
  };

  const handleBizFileChange = ({ fileList: newFileList }: UploadChangeParam) => {
    const limited = newFileList.slice(-1);
    if (limited.length > 0 && limited[0]?.originFileObj) {
      if (!validateFile(limited[0].originFileObj)) return;
    }
    setBizFileList(limited);
  };

  const handleUtilityFileChange = ({ fileList: newFileList }: UploadChangeParam) => {
    const limited = newFileList.slice(-1);
    if (limited.length > 0 && limited[0]?.originFileObj) {
      if (!validateFile(limited[0].originFileObj)) return;
    }
    setUtilityFileList(limited);
  };

  const onFinish = async (values: VerificationFields) => {
    if (idFileList.length === 0 || bizFileList.length === 0 || utilityFileList.length === 0) {
      message.error(
        "Please upload all required documents: valid ID, business registration certificate, and utility bill"
      );
      return;
    }

    setSubmitting(true);
    try {
      setUploading(true);
      const uploadDocument = async (
        docType: VerificationDocument["documentType"],
        file: UploadFile,
        fallbackPrefix: string
      ): Promise<VerificationDocument> => {
        if (file.originFileObj) {
          const uploadData = new FormData();
          uploadData.append("file", file.originFileObj);
          uploadData.append("folderType", "verification-doc");
          uploadData.append("skipPersistence", "true");

          const response = await fetch("/api/upload", {
            method: "POST",
            body: uploadData,
          });

          const payload = await response.json().catch(() => ({}));
          if (!response.ok || !payload?.url) {
            throw new Error(payload?.error || "Failed to upload verification document");
          }

          return {
            documentType: docType,
            filename: `${fallbackPrefix}_${file.name}`,
            url: payload.url,
            publicId: payload.publicId,
          };
        }

        if (file.url) {
          return {
            documentType: docType,
            filename: file.name,
            url: file.url,
          };
        }

        throw new Error("Missing file data for required document");
      };

      const docs: VerificationDocument[] = [];
      const idFile = idFileList[0];
      const bizFile = bizFileList[0];
      const utilityFile = utilityFileList[0];
      if (!idFile || !bizFile || !utilityFile) {
        throw new Error("Missing required verification files");
      }

      docs.push(await uploadDocument("ID", idFile, values.idType));
      docs.push(await uploadDocument("BUSINESS_REGISTRATION", bizFile, "BUSINESS_REGISTRATION"));
      docs.push(await uploadDocument("UTILITY_BILL", utilityFile, "UTILITY_BILL"));

      setUploading(false);
      updateFormData({
        idType: values.idType,
        verificationDocuments: docs,
      } as Partial<FormComponentProps["formData"]>);
      onNext();
    } catch (error) {
      console.error("Error uploading documents:", error);
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
            onChange={handleIdFileChange}
            beforeUpload={() => false}
            maxCount={1}
            accept=".jpg,.jpeg,.png,.pdf"
          >
            {idFileList.length === 0 && (
              <div>
                {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                <div className="mt-2 text-xs">{uploading ? "Uploading" : "Upload ID"}</div>
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
            onChange={handleBizFileChange}
            beforeUpload={() => false}
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
            onChange={handleUtilityFileChange}
            beforeUpload={() => false}
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
            disabled={submitting || uploading}
            className="w-full rounded-ds-md bg-ds-brand-primary py-3 text-white font-semibold hover:bg-ds-brand-primary-hover disabled:bg-ds-surface-disabled transition-colors"
          >
            {submitting ? "Processing..." : "Continue"}
          </button>
        </Form.Item>
      </Form>
    </div>
  );
}
