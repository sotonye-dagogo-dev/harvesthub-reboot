"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, Form, Input, Select, Switch, message } from "antd";
import { Button, PageLoader } from "@/components/ui";
import { useAuth } from "@/lib/contexts/AuthContext";
import { CAMPUS_LOCATIONS, VENDOR_CATEGORIES } from "@/lib/constants";

type BecomeVendorFormValues = {
  storeName: string;
  storeDescription?: string;
  category: string;
  campus: string;
  whatsappNumber: string;
  isChurchAffiliated: boolean;
};

export default function BecomeVendorPage() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [form] = Form.useForm<BecomeVendorFormValues>();

  const handleSubmit = async (values: BecomeVendorFormValues) => {
    setSubmitting(true);

    try {
      const response = await fetch("/api/users/me/convert-to-vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          storeName: values.storeName.trim(),
          storeDescription: values.storeDescription?.trim(),
          whatsappNumber: values.whatsappNumber.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not register your store right now.");
      }

      message.success(data.message || "Store registration submitted successfully.");
      await refreshUser();
      router.push(data.redirectPath || "/operations/dashboard");
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Request failed";
      message.error(errMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading account..." minHeight="min-h-[60vh]" />;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-xl rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-6 shadow-ds-sm">
          <h1 className="text-2xl font-bold text-ds-text-primary">Register Your Store</h1>
          <p className="mt-2 text-ds-text-secondary">You need to be signed in to continue.</p>
          <Link
            href="/login?from=/become-vendor"
            className="mt-6 inline-flex rounded-ds-md bg-ds-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-ds-brand-primary-hover"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === "VENDOR") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-xl rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-6 shadow-ds-sm">
          <h1 className="text-2xl font-bold text-ds-text-primary">
            You already have a vendor account
          </h1>
          <p className="mt-2 text-ds-text-secondary">
            Manage your products, orders, and store details from your vendor workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/operations/dashboard"
              className="inline-flex rounded-ds-md bg-ds-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-ds-brand-primary-hover"
            >
              Go to Vendor Dashboard
            </Link>
            <Link
              href="/store-settings"
              className="inline-flex rounded-ds-md border border-ds-border-brand px-4 py-2 text-sm font-medium text-ds-text-brand hover:bg-ds-brand-surface"
            >
              Open Store Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-xl rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-6 shadow-ds-sm">
          <h1 className="text-2xl font-bold text-ds-text-primary">
            Not available for admin accounts
          </h1>
          <p className="mt-2 text-ds-text-secondary">
            Admin users cannot convert through this flow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-6 shadow-ds-sm">
        <h1 className="text-2xl font-bold text-ds-text-primary">Register Your Store</h1>
        <p className="mt-2 text-ds-text-secondary">
          Already shopping as a buyer? Add your store details below and switch to vendor tools.
        </p>

        <Alert
          type="info"
          showIcon
          className="mt-4"
          message="Your vendor profile is created immediately with pending status and can be updated from Store Settings."
        />

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="mt-6"
          initialValues={{ isChurchAffiliated: false }}
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Store Name"
            name="storeName"
            rules={[{ required: true, message: "Please enter your store name" }]}
          >
            <Input placeholder="e.g. Harvest Fresh Foods" maxLength={100} />
          </Form.Item>

          <Form.Item label="Store Description" name="storeDescription">
            <Input.TextArea
              placeholder="What do you sell and who do you serve?"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <Select
                placeholder="Select category"
                options={VENDOR_CATEGORIES.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Campus"
              name="campus"
              rules={[{ required: true, message: "Please select a campus" }]}
            >
              <Select
                placeholder="Select campus"
                options={CAMPUS_LOCATIONS.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="WhatsApp Number"
            name="whatsappNumber"
            rules={[
              { required: true, message: "Please add a WhatsApp number" },
              { min: 7, message: "Number looks too short" },
            ]}
          >
            <Input placeholder="e.g. +2348012345678" />
          </Form.Item>

          <Form.Item label="Church Affiliation" name="isChurchAffiliated" valuePropName="checked">
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" loading={submitting}>
              Submit and Continue
            </Button>
            <Link
              href="/profile"
              className="inline-flex items-center rounded-ds-md border border-ds-border-brand px-4 py-2 text-sm font-medium text-ds-text-brand hover:bg-ds-brand-surface"
            >
              Back to Profile
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
