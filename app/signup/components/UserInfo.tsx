"use client";

import { Form, Input, Button } from "antd";
import { GoogleOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { FormComponentProps } from "@/app/types";

interface UserInfoFields {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export default function UserInfo({
  onNext,
  updateFormData,
  formData,
}: FormComponentProps) {
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

  const handleGoogleSignup = (): void => {
    // In a real implementation, this would initiate OAuth flow
    console.log("Google signup initiated");
  };

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
      <h3 className="text-[24px] leading-[26.4px] text-center">
        Personal Information
      </h3>

      <Form
        form={form}
        name="user-info"
        layout="vertical"
        autoComplete="off"
        requiredMark={false}
        onFinish={onFinish}
        className="w-full">
        <Form.Item className="mb-6">
          <Button
            type="default"
            icon={<GoogleOutlined />}
            onClick={handleGoogleSignup}
            size="large"
            className="flex w-full h-12 justify-center items-center text-sm">
            Sign Up With Google
          </Button>
        </Form.Item>

        {/* Divider with OR text */}
        <div className="relative flex items-center justify-center my-6">
          <div className="flex-grow border-t border-gray-300 border-dashed"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300 border-dashed"></div>
        </div>

        <Form.Item
          name="firstName"
          label="First Name"
          rules={[
            { required: true, message: "Please enter your first name" },
            { min: 2, message: "Name must be at least 2 characters" },
          ]}>
          <Input
            size="large"
            placeholder="Enter your first name"
            className="rounded-lg h-12"
          />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Last Name"
          rules={[
            { required: true, message: "Please enter your last name" },
            { min: 2, message: "Last name must be at least 2 characters" },
          ]}>
          <Input
            size="large"
            placeholder="Enter your last name"
            className="rounded-lg h-12"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}>
          <Input
            size="large"
            placeholder="Enter your email"
            className="rounded-lg h-12"
          />
        </Form.Item>

        <Form.Item
          name="phoneNumber"
          label="Phone Number"
          rules={[
            { required: true, message: "Please enter your phone number" },
            {
              pattern: /^\+?[0-9]{10,15}$/,
              message: "Please enter a valid phone number",
            },
          ]}>
          <Input
            size="large"
            placeholder="Enter your phone number"
            className="rounded-lg h-12"
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
