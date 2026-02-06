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
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Personal Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Tell us about yourself</p>
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
            label={<span className="text-gray-900 dark:text-white font-medium">First Name</span>}
            rules={[
              { required: true, message: "Required" },
              { min: 2, message: "Min 2 characters" },
            ]}
          >
            <Input size="large" placeholder="John" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label={<span className="text-gray-900 dark:text-white font-medium">Last Name</span>}
            rules={[
              { required: true, message: "Required" },
              { min: 2, message: "Min 2 characters" },
            ]}
          >
            <Input size="large" placeholder="Doe" className="rounded-lg" />
          </Form.Item>
        </div>

        <Form.Item
          name="email"
          label={<span className="text-gray-900 dark:text-white font-medium">Email Address</span>}
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input
            size="large"
            type="email"
            placeholder="john.doe@example.com"
            className="rounded-lg"
          />
        </Form.Item>

        <Form.Item
          name="phoneNumber"
          label={<span className="text-gray-900 dark:text-white font-medium">Phone Number</span>}
          rules={[
            { required: true, message: "Please enter your phone number" },
            {
              pattern: /^(\+234|0)[789]\d{9}$/,
              message: "Please enter a valid Nigerian phone number",
            },
          ]}
        >
          <PhoneInput placeholder="803 456 7890" className="rounded-lg" />
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
