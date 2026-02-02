"use client";

import { useState } from "react";
import { Form, Input, Button, Alert, Card, Typography } from "antd";
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schemas";
import { z } from "zod";

const { Title, Text } = Typography;

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      setError(null);

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
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
              <MailOutlined className="text-2xl text-green-600 dark:text-green-400" />
            </div>
            <Title level={3} className="mb-2">
              Check Your Email
            </Title>
            <Text className="text-gray-600 dark:text-gray-400">
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
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {resetToken}
                  </code>
                  <p className="mt-2">
                    <Link
                      href={`/reset-password?token=${resetToken}&email=${form.getFieldValue("email")}`}
                      className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
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
            <Text className="block text-sm text-gray-600 dark:text-gray-400">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setSuccess(false)}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              >
                try again
              </button>
            </Text>

            <Link
              href="/login"
              className="flex items-center justify-center text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <Title level={2} className="mb-2">
            Reset Your Password
          </Title>
          <Text className="text-gray-600 dark:text-gray-400">
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </Text>
        </div>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            className="mb-4"
          />
        )}

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
              className="bg-purple-600 hover:bg-purple-700"
            >
              Send Reset Link
            </Button>
          </Form.Item>

          <div className="text-center">
            <Link
              href="/login"
              className="flex items-center justify-center text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
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
