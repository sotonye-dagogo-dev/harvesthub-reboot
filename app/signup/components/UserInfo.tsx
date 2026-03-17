"use client";

import { Form, Input } from "antd";
import { useState, useEffect } from "react";
import { FormComponentProps } from "@/app/types";
import { PhoneInput } from "@/components/ui";

interface UserInfoFields {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export default function UserInfo({ onNext, updateFormData, formData }: FormComponentProps) {
  const [form] = Form.useForm<UserInfoFields>();
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (formData?.firstName) {
      form.setFieldsValue({
        firstName: formData.firstName,
        lastName: formData.lastName || "",
        email: formData.email || "",
        phoneNumber: formData.phoneNumber || "",
      });
    }
  }, [form, formData]);

  const onFinish = async (values: UserInfoFields): Promise<void> => {
    setSubmitting(true);

    try {
      // Simulate API validation check
      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      // Update form data in parent component/context
      updateFormData(values);
      onNext();
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-ds-text-primary mb-2">Personal Information</h3>
        <p className="text-sm text-ds-text-secondary">Tell us about yourself</p>
      </div>

      <Form
        form={form}
        name="user-info"
        layout="vertical"
        autoComplete="off"
        requiredMark={false}
        onFinish={onFinish}
        className="w-full"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="firstName"
            label={<span className="text-ds-text-primary font-medium">First Name</span>}
            rules={[
              { required: true, message: "Required" },
              { min: 2, message: "Min 2 characters" },
            ]}
          >
            <Input size="large" placeholder="John" className="rounded-ds-md" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label={<span className="text-ds-text-primary font-medium">Last Name</span>}
            rules={[
              { required: true, message: "Required" },
              { min: 2, message: "Min 2 characters" },
            ]}
          >
            <Input size="large" placeholder="Doe" className="rounded-ds-md" />
          </Form.Item>
        </div>

        <Form.Item
          name="email"
          label={<span className="text-ds-text-primary font-medium">Email Address</span>}
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input
            size="large"
            type="email"
            placeholder="john.doe@example.com"
            className="rounded-ds-md"
          />
        </Form.Item>

        <Form.Item
          name="phoneNumber"
          label={<span className="text-ds-text-primary font-medium">Phone Number</span>}
          rules={[
            { required: true, message: "Please enter your phone number" },
            {
              validator: (_, value) => {
                if (!value) return Promise.reject("Please enter your phone number");

                const cleaned = String(value).replace(/\s+/g, "");
                const patterns = [
                  /^\+234[789]\d{8}$/, // Nigeria
                  /^\+1\d{10}$/, // US
                  /^\+44\d{10}$/, // UK
                ];

                if (!patterns.some((p) => p.test(cleaned))) {
                  return Promise.reject(
                    "Please enter a valid phone number (e.g., +2348012345678)."
                  );
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <PhoneInput placeholder="8012345678" className="rounded-ds-md" />
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
