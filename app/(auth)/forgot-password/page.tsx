"use client";

import { useState } from "react";
import { Form, Input, Button, Alert, Card, Typography, App } from "antd";
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schemas";
import { z } from "zod";
import { getFriendlyPasswordError } from "@/lib/utils/authMessages";

const { Title, Text } = Typography;

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    try {
      setLoading(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setSuccess(true);

      // In development, show the token
      if (data.token) {
        setResetToken(data.token);
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "An error occurred";
      message.error(getFriendlyPasswordError(raw));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ds-surface-sunken py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 rounded-ds-full bg-ds-status-success-bg dark:bg-ds-status-success-bg flex items-center justify-center mb-4">
              <MailOutlined className="text-2xl text-ds-status-success-text" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-ds-text-primary">
              Check Your Email
            </h2>
            <Text className="text-ds-text-secondary">
              We&apos;ve sent password reset instructions to your email address.
            </Text>
          </div>

          {resetToken && (
            <Alert
              type="info"
              message="Development Mode"
              description={
                <div>
                  <p className="mb-2">Your reset token (use this for testing):</p>
                  <code className="bg-ds-surface-sunken px-2 py-1 rounded-ds-xs">{resetToken}</code>
                  <p className="mt-2">
                    <Link
                      href={`/reset-password?token=${resetToken}&email=${form.getFieldValue("email")}`}
                      className="text-ds-text-brand hover:text-ds-palette-purple-700"
                    >
                      Click here to reset password
                    </Link>
                  </p>
                </div>
              }
              className="mb-4"
            />
          )}

          <div className="space-y-4">
            <Text className="block text-sm text-ds-text-secondary">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setSuccess(false)}
                className="text-ds-text-brand hover:text-ds-palette-purple-700 dark:hover:text-ds-brand-muted font-medium"
              >
                try again
              </button>
            </Text>

            <Link
              href="/login"
              className="flex items-center justify-center text-ds-text-brand hover:text-ds-palette-purple-700 dark:hover:text-ds-brand-muted font-medium"
            >
              <ArrowLeftOutlined className="mr-2" />
              Back to Login
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ds-surface-sunken py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <Title level={2} className="mb-2">
            Reset Your Password
          </Title>
          <Text className="text-ds-text-secondary">
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </Text>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="your.email@example.com"
              size="large"
              autoFocus
            />
          </Form.Item>

          <Form.Item className="mb-4">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              className="bg-ds-brand-primary hover:bg-ds-brand-primary-hover"
            >
              Send Reset Link
            </Button>
          </Form.Item>

          <div className="text-center">
            <Link
              href="/login"
              className="flex items-center justify-center text-ds-text-brand hover:text-ds-palette-purple-700 dark:hover:text-ds-brand-muted font-medium"
            >
              <ArrowLeftOutlined className="mr-2" />
              Back to Login
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
