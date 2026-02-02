"use client";

import { Form, Input, Select } from "antd";
import { useState, useEffect } from "react";
import { StoreType, FormComponentProps } from "@/app/types";

interface StoreInfoFields {
  storeName: string;
  storeType: StoreType;
  businessAddress: string;
}

export default function StoreInfo({
  onNext,
  updateFormData,
  formData,
}: FormComponentProps) {
  const [form] = Form.useForm<StoreInfoFields>();
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (formData?.storeName) {
      form.setFieldsValue({
        storeName: formData.storeName,
        storeType: (formData.storeType as StoreType) || undefined,
        businessAddress: formData.businessAddress || "",
      });
    }
  }, [form, formData]);

  const onFinish = async (values: StoreInfoFields): Promise<void> => {
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

  const storeTypeOptions: { value: StoreType; label: string }[] = [
    { value: "retail", label: "Retail" },
    { value: "wholesale", label: "Wholesale" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "service", label: "Service" },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <h3 className="text-[24px] leading-[26.4px] text-center">
        Store Information
      </h3>

      <Form
        form={form}
        name="store-info"
        layout="vertical"
        autoComplete="off"
        requiredMark={false}
        onFinish={onFinish}
        className="w-full">
        <Form.Item
          name="storeName"
          label="Store Name"
          rules={[
            { required: true, message: "Please enter your store name" },
            { min: 3, message: "Store name must be at least 3 characters" },
          ]}>
          <Input
            size="large"
            placeholder="Enter your store name"
            className="rounded-lg h-12"
          />
        </Form.Item>

        <Form.Item
          name="storeType"
          label="Store Type"
          rules={[{ required: true, message: "Please select a store type" }]}>
          <Select
            size="large"
            placeholder="Select store type"
            className="rounded-lg h-12"
            options={storeTypeOptions}
          />
        </Form.Item>

        <Form.Item
          name="businessAddress"
          label="Business Address"
          rules={[
            { required: true, message: "Please enter your business address" },
            { min: 5, message: "Address must be at least 5 characters" },
          ]}>
          <Input.TextArea
            placeholder="Enter your business address"
            className="rounded-lg"
            rows={3}
          />
        </Form.Item>

        <Form.Item className="mt-8">
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl text-white bg-primary-100 hover:bg-opacity-90 transition-all duration-150 flex items-center justify-center disabled:opacity-70">
            {submitting ? "Processing..." : "Continue"}
          </button>
        </Form.Item>
      </Form>
    </div>
  );
}
