"use client";

import { Form, Input, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { FormComponentProps } from "@/app/types";
import { OptionListSelect } from "@/components/ui";
import { VendorCategory } from "@/lib/constants";

interface VendorInfoFields {
  storeName: string;
  storeCategory: string;
  campus: string;
  position?: string;
  storeDescription: string;
  businessAddress: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  serviceCategory?: string;
  serviceLocation?: string;
}

export default function StoreInfo({ onNext, updateFormData, formData }: FormComponentProps) {
  const [form] = Form.useForm<VendorInfoFields>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isServiceVendor, setIsServiceVendor] = useState(
    formData?.storeCategory === VendorCategory.SERVICES
  );

  useEffect(() => {
    if (formData?.storeName) {
      form.setFieldsValue({
        storeName: formData.storeName,
        storeCategory: formData.storeCategory || undefined,
        campus: formData.campus || undefined,
        position: formData.position || undefined,
        storeDescription: formData.storeDescription || "",
        businessAddress: formData.businessAddress || "",
        bankName: formData.bankName || "",
        accountName: formData.accountName || "",
        accountNumber: formData.accountNumber || "",
        serviceCategory: formData.serviceCategory || undefined,
        serviceLocation: formData.serviceLocation || undefined,
      });
    }
  }, [form, formData]);

  const onFinish = async (values: VendorInfoFields): Promise<void> => {
    setSubmitting(true);

    try {
      // Simulate API validation
      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      updateFormData(values);
      message.success("Store details saved");
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
      <div className="text-center">
        <h3 className="text-2xl font-bold text-ds-text-primary mb-2">Vendor Information</h3>
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
          <OptionListSelect
            listKey="vendorCategories"
            size="large"
            placeholder="Select your store category"
            className="rounded-ds-md"
            onChange={(value) => setIsServiceVendor(value === VendorCategory.SERVICES)}
          />
        </Form.Item>

        {/* Service-Specific Fields */}
        {isServiceVendor && (
          <>
            <Form.Item
              name="serviceCategory"
              label={<span className="text-ds-text-primary font-medium">Service Type</span>}
              rules={[{ required: true, message: "Please select your service type" }]}
            >
              <OptionListSelect
                listKey="serviceCategories"
                size="large"
                placeholder="What type of service do you offer?"
                className="rounded-ds-md"
                showDescription
              />
            </Form.Item>

            <Form.Item
              name="serviceLocation"
              label={<span className="text-ds-text-primary font-medium">Service Location</span>}
              rules={[{ required: true, message: "Please select where you render your service" }]}
            >
              <OptionListSelect
                listKey="serviceLocations"
                size="large"
                placeholder="Where do you render your service?"
                className="rounded-ds-md"
              />
            </Form.Item>
          </>
        )}

        <Form.Item
          name="campus"
          label={
            <span className="text-ds-text-primary font-medium">Pick up Location (Campus)</span>
          }
          rules={[{ required: true, message: "Please select your campus location" }]}
        >
          <OptionListSelect
            listKey="campus"
            size="large"
            placeholder="Select campus for product pickup"
            className="rounded-ds-md"
          />
        </Form.Item>

        <Form.Item
          name="position"
          label={
            <span className="text-ds-text-primary font-medium">Position in Church (Optional)</span>
          }
        >
          <OptionListSelect
            listKey="positions"
            size="large"
            placeholder="Select your position"
            className="rounded-ds-md"
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="storeDescription"
          label={
            <span className="text-ds-text-primary font-medium">Store Description (Optional)</span>
          }
          extra={<span className="text-xs text-ds-text-tertiary">Markdown supported: **bold**, bullet lists (-, *, •)</span>}
        >
          <Input.TextArea
            rows={4}
            placeholder={"Brief description of your store and products...\n- Fresh farm produce\n- **Quality** assured"}
            className="rounded-ds-md"
            maxLength={2000}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="businessAddress"
          label={
            <span className="text-ds-text-primary font-medium">
              Business Address <span className="text-ds-status-error-text">*</span>
            </span>
          }
          rules={[{ required: true, message: "Please enter your business address" }]}
        >
          <Input size="large" placeholder="Street address, city, state" className="rounded-ds-md" />
        </Form.Item>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Item
            name="bankName"
            label={<span className="text-ds-text-primary font-medium">Bank Name</span>}
          >
            <Input size="large" placeholder="Bank Name" className="rounded-ds-md" />
          </Form.Item>

          <Form.Item
            name="accountName"
            label={<span className="text-ds-text-primary font-medium">Account Name</span>}
          >
            <Input size="large" placeholder="Account Name" className="rounded-ds-md" />
          </Form.Item>

          <Form.Item
            name="accountNumber"
            label={<span className="text-ds-text-primary font-medium">Account Number</span>}
            rules={[
              {
                pattern: /^\d{10,}$/,
                message: "Account number should be numeric and at least 10 digits",
              },
            ]}
          >
            <Input size="large" placeholder="0123456789" className="rounded-ds-md" />
          </Form.Item>
        </div>

        <Form.Item className="mb-0">
          <button
            type="submit"
            disabled={submitting}
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
