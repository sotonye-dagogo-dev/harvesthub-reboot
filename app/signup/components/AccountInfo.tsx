"use client";

import { Form, Input, Upload, message } from "antd";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import type { UploadFile, UploadChangeParam } from "antd/es/upload/interface";

interface FormValues {
  username: string;
  bio?: string;
  profilePicture?: {
    filename: string;
    url: string;
  } | null;
}

interface AccountInfoProps {
  onNext: () => void;
  updateFormData: (data: FormValues) => void;
  formData: FormValues;
}

export default function AccountInfo({ onNext, updateFormData, formData }: AccountInfoProps) {
  const [form] = Form.useForm<FormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (formData?.username) {
      form.setFieldsValue(formData as FormValues);
    }
  }, [form, formData]);

  const handleFileChange = ({ fileList: newFileList }: UploadChangeParam): void => {
    // Limit to one file
    const limitedFileList = newFileList.slice(-1);

    // Validate file type
    if (limitedFileList.length > 0) {
      const file = limitedFileList[0]?.originFileObj;
      if (file && !["image/jpeg", "image/png"].includes(file.type)) {
        message.error("You can only upload JPG/PNG files!");
        return;
      }

      // Validate file size (2MB)
      if (file && file.size > 2 * 1024 * 1024) {
        message.error("Image must be smaller than 2MB!");
        return;
      }
    }

    setFileList(limitedFileList);
  };

  const beforeUpload = (): boolean => {
    return false; // Prevent auto upload
  };

  const onFinish = async (values: FormValues): Promise<void> => {
    setSubmitting(true);

    try {
      // Simulate upload for profile picture
      if (fileList.length > 0 && fileList[0]?.originFileObj) {
        setUploading(true);
        // In a real app, this would be an actual upload
        await new Promise<void>((resolve) => setTimeout(resolve, 800));
        setUploading(false);

        // Add file info to form data
        values.profilePicture = {
          filename: fileList[0]?.name || "profile",
          url: URL.createObjectURL(fileList[0].originFileObj),
        };
      }

      // Validate username uniqueness (mock)
      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      // Update form data in parent component
      updateFormData(values);
      onNext();
    } catch (error) {
      console.error("Error during form submission:", error);
      message.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <h3 className="text-[24px] leading-[26.4px] text-center">Account Information</h3>

      <Form
        form={form}
        name="account-info"
        layout="vertical"
        autoComplete="off"
        requiredMark={false}
        onFinish={onFinish}
        className="w-full"
      >
        <Form.Item
          name="username"
          label="Username"
          rules={[
            { required: true, message: "Please enter a username" },
            { min: 3, message: "Username must be at least 3 characters" },
            {
              pattern: /^[a-z0-9_\.]+$/,
              message: "Username can only contain lowercase letters, numbers, dots and underscores",
            },
          ]}
        >
          <Input size="large" placeholder="Choose a username" className="rounded-lg h-12" />
        </Form.Item>

        <Form.Item
          name="bio"
          label="Bio"
          rules={[{ required: false }, { max: 160, message: "Bio cannot exceed 160 characters" }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Tell us about yourself (optional)"
            className="rounded-lg"
            showCount
            maxLength={160}
          />
        </Form.Item>

        <Form.Item name="profilePicture" label="Profile Picture" rules={[{ required: false }]}>
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={beforeUpload}
            maxCount={1}
          >
            {fileList.length === 0 && (
              <div>
                {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                <div className="mt-2">{uploading ? "Uploading" : "Upload"}</div>
              </div>
            )}
          </Upload>
          <div className="text-xs text-gray-400 mt-1">JPG or PNG. Max size 2MB.</div>
        </Form.Item>

        <Form.Item className="mt-8">
          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full h-12 rounded-xl text-white bg-primary-100 hover:bg-opacity-90 transition-all duration-150 flex items-center justify-center disabled:opacity-70"
          >
            {submitting ? "Processing..." : "Continue"}
          </button>
        </Form.Item>
      </Form>
    </div>
  );
}
