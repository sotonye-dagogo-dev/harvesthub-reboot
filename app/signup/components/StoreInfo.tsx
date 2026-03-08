"use client";

import { Form, Input, Select } from "antd";
import { useState, useEffect } from "react";
import { FormComponentProps } from "@/app/types";
import { VENDOR_CATEGORIES, CAMPUS_LOCATIONS, POSITION_OPTIONS } from "@/lib/constants";

interface VendorInfoFields {
  storeName: string;
  storeCategory: string;
  campus: string;
  position?: string;
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
        position: formData.position || undefined,
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
        <h3 className="text-2xl font-bold text-ds-text-primary mb-2">
          Vendor Information
        </h3>
        <p className="text-sm text-ds-text-secondary">Tell us about your store</p>
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
          label={<span className="text-ds-text-primary font-medium">Store Name</span>}
          rules={[
            { required: true, message: "Please enter your store name" },
            { min: 3, message: "Store name must be at least 3 characters" },
          ]}
        >
          <Input size="large" placeholder="e.g., Fresh Harvest Farms" className="rounded-ds-md" />
        </Form.Item>

        <Form.Item
          name="storeCategory"
          label={<span className="text-ds-text-primary font-medium">Store Category</span>}
          rules={[{ required: true, message: "Please select a store category" }]}
        >
          <Select
            size="large"
            placeholder="Select your store category"
            className="rounded-ds-md"
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
            <span className="text-ds-text-primary font-medium">
              Pick up Location (Campus)
            </span>
          }
          rules={[{ required: true, message: "Please select your campus location" }]}
        >
          <Select
            size="large"
            placeholder="Select campus for product pickup"
            className="rounded-ds-md"
            options={CAMPUS_LOCATIONS.map((campus) => ({
              value: campus.value,
              label: campus.label,
            }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="position"
          label={
            <span className="text-ds-text-primary font-medium">
              Position in Church (Optional)
            </span>
          }
        >
          <Select
            size="large"
            placeholder="Select your position"
            className="rounded-ds-md"
            allowClear
            options={POSITION_OPTIONS.map((pos) => ({
              value: pos.value,
              label: pos.label,
            }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="storeDescription"
          label={
            <span className="text-ds-text-primary font-medium">
              Store Description (Optional)
            </span>
          }
        >
          <Input.TextArea
            rows={3}
            placeholder="Brief description of your store and products..."
            className="rounded-ds-md"
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-ds-md bg-ds-brand-primary py-3 text-white font-semibold hover:bg-ds-brand-primary-hover disabled:bg-ds-surface-disabled transition-colors"
          >
            {submitting ? "Processing..." : "Continue"}
          </button>
        </Form.Item>
      </Form>
    </div>
  );
}
