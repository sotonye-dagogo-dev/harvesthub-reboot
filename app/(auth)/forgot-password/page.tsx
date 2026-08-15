"use client";

import { useState } from "react";
import { Form, Input, Button, Alert, Card, Typography, App } from "antd";
import {
  MailOutlined,
  ArrowLeftOutlined,
  UserAddOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schemas";
import { z } from "zod";
import { getFriendlyPasswordError } from "@/lib/utils/authMessages";

const { Title, Text } = Typography;

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

type FeedbackState =
  | { kind: "none" }
  | { kind: "success"; token?: string }
  | { kind: "notFound" }
  | { kind: "deliveryFailed" };

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: "none" });
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      setFeedback({ kind: "none" });

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // No account with this email — tell the user truthfully instead of showing
        // the misleading "we sent a link" screen.
        if (data.code === "USER_NOT_FOUND") {
          setFeedback({ kind: "notFound" });
          return;
        }
        // Email delivery itself failed — say so rather than claiming success.
        if (data.code === "EMAIL_DELIVERY_FAILED") {
          setFeedback({ kind: "deliveryFailed" });
          return;
        }
        throw new Error(data.error || "Failed to send reset email");
      }

      // In development, show the token
      if (data.token) {
        setResetToken(data.token);
      }
      setFeedback({ kind: "success", token: data.token });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "An error occurred";
      message.error(getFriendlyPasswordError(raw));
    } finally {
      setLoading(false);
    }
  };

  if (feedback.kind === "success") {
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
                onClick={() => setFeedback({ kind: "none" })}
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
          {feedback.kind === "notFound" && (
            <Alert
              type="warning"
              showIcon
              icon={<UserAddOutlined />}
              className="mb-4"
              message="No account found with that email address"
              description={
                <div>
                  <p className="mb-2">
                    Please double-check the email you entered, or create a new account to get
                    started.
                  </p>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1 font-medium text-ds-text-brand hover:text-ds-palette-purple-700"
                  >
                    <UserAddOutlined />
                    Create an account
                  </Link>
                </div>
              }
            />
          )}

          {feedback.kind === "deliveryFailed" && (
            <Alert
              type="error"
              showIcon
              icon={<WarningOutlined />}
              className="mb-4"
              message="We couldn't send the reset email"
              description="Please try again in a few minutes. If the problem persists, contact support."
            />
          )}

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
