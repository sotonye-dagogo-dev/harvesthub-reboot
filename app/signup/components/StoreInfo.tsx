"use client";

import { Form, Input, Select } from "antd";
import { useState, useEffect } from "react";
import { FormComponentProps } from "@/app/types";
import { VENDOR_CATEGORIES, CAMPUS_LOCATIONS } from "@/lib/constants";

interface VendorInfoFields {
  storeName: string;
  storeCategory: string;
  campus: string;
  storeDescription: string;
}

export default function StoreInfo({ onNext, updateFormData, formData }: FormComponentProps) {
  const [form] = Form.useForm<VendorInfoFields>();
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (formData?.storeName) {
      form.setFieldsValue({
        storeName: formData.storeName,
        storeCategory: formData.storeCategory || undefined,
        campus: formData.campus || undefined,
        storeDescription: formData.storeDescription || "",
      });
    }
  }, [form, formData]);

  const onFinish = async (values: VendorInfoFields): Promise<void> => {
    setSubmitting(true);

    try {
      // Simulate API validation
      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      updateFormData(values);
      onNext();
    } catch (error) {
      console.error("Error during form submission:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Vendor Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Tell us about your store</p>
      </div>

      <Form
        form={form}
        name="vendor-info"
        layout="vertical"
        autoComplete="off"
        requiredMark={false}
        onFinish={onFinish}
        className="w-full"
      >
        <Form.Item
          name="storeName"
          label={<span className="text-gray-900 dark:text-white font-medium">Store Name</span>}
          rules={[
            { required: true, message: "Please enter your store name" },
            { min: 3, message: "Store name must be at least 3 characters" },
          ]}
        >
          <Input size="large" placeholder="e.g., Fresh Harvest Farms" className="rounded-lg" />
        </Form.Item>

        <Form.Item
          name="storeCategory"
          label={<span className="text-gray-900 dark:text-white font-medium">Store Category</span>}
          rules={[{ required: true, message: "Please select a store category" }]}
        >
          <Select
            size="large"
            placeholder="Select your store category"
            className="rounded-lg"
            options={VENDOR_CATEGORIES.map((cat) => ({
              value: cat.value,
              label: cat.label,
            }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="campus"
          label={
            <span className="text-gray-900 dark:text-white font-medium">
              Pick up Location (Campus)
            </span>
          }
          rules={[{ required: true, message: "Please select your campus location" }]}
        >
          <Select
            size="large"
            placeholder="Select campus for product pickup"
            className="rounded-lg"
            options={CAMPUS_LOCATIONS.map((campus) => ({
              value: campus.value,
              label: campus.label,
              description: campus.description,
            }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            optionRender={(option) => (
              <div>
                <div className="font-medium">{option.label}</div>
                {option.data.description && (
                  <div className="text-xs text-gray-500">{option.data.description}</div>
                )}
              </div>
            )}
          />
        </Form.Item>

        <Form.Item
          name="storeDescription"
          label={
            <span className="text-gray-900 dark:text-white font-medium">
              Store Description (Optional)
            </span>
          }
        >
          <Input.TextArea
            rows={3}
            placeholder="Brief description of your store and products..."
            className="rounded-lg"
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-purple-600 py-3 text-white font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {submitting ? "Processing..." : "Continue"}
          </button>
        </Form.Item>
      </Form>
    </div>
  );
}
