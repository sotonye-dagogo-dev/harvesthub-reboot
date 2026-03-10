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

export default function VerificationDocs({ onNext, updateFormData, formData }: FormComponentProps) {
  const [form] = Form.useForm<VerificationFields>();
  const [idFileList, setIdFileList] = useState<UploadFile[]>([]);
  const [bizFileList, setBizFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Restore previous state if going back
    if (formData?.verificationDocuments && formData.verificationDocuments.length > 0) {
      const restored = formData.verificationDocuments.map((doc, i) => ({
        uid: `restored-${i}`,
        name: doc.filename,
        status: "done" as const,
        url: doc.url,
      }));
      setIdFileList(restored.slice(0, 1));
      if (restored.length > 1) setBizFileList(restored.slice(1));
    }
  }, [formData?.verificationDocuments]);

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

  const onFinish = async (values: VerificationFields) => {
    if (idFileList.length === 0) {
      message.error("Please upload a valid ID document");
      return;
    }

    setSubmitting(true);
    try {
      setUploading(true);
      // Simulate upload delay (in production, this would upload to Cloudinary)
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      setUploading(false);

      const docs: { filename: string; url: string }[] = [];

      // ID document
      if (idFileList[0]?.originFileObj) {
        docs.push({
          filename: `${values.idType}_${idFileList[0].name}`,
          url: URL.createObjectURL(idFileList[0].originFileObj),
        });
      } else if (idFileList[0]?.url) {
        docs.push({ filename: idFileList[0].name, url: idFileList[0].url });
      }

      // Business registration (optional)
      if (bizFileList.length > 0) {
        if (bizFileList[0]?.originFileObj) {
          docs.push({
            filename: `BIZ_REG_${bizFileList[0].name}`,
            url: URL.createObjectURL(bizFileList[0].originFileObj),
          });
        } else if (bizFileList[0]?.url) {
          docs.push({ filename: bizFileList[0].name, url: bizFileList[0].url });
        }
      }

      updateFormData({ verificationDocuments: docs } as Partial<FormComponentProps["formData"]>);
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

        {/* Business Registration (Optional) */}
        <Form.Item
          label={
            <span className="text-ds-text-primary font-medium">
              Business Registration Certificate (Optional)
            </span>
          }
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
