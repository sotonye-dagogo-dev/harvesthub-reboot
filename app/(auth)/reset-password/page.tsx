"use client";

import { useState, useEffect, Suspense } from "react";
import { Form, Input, Button, Alert, Card, Typography } from "antd";
import { LockOutlined, CheckCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordSchema } from "@/lib/schemas/auth.schemas";
import { z } from "zod";

const { Title, Text } = Typography;

type ResetPasswordFormData = Omit<z.infer<typeof resetPasswordSchema>, "email" | "token"> & {
  confirmPassword: string;
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (!tokenParam || !emailParam) {
      setError("Invalid reset link. Please request a new password reset.");
    } else {
      setToken(tokenParam);
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (values: ResetPasswordFormData) => {
    if (!token || !email) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password: values.password,
          confirmPassword: values.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ds-surface-sunken py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-ds-full bg-ds-status-success-bg dark:bg-ds-status-success-bg flex items-center justify-center mb-4">
              <CheckCircleOutlined className="text-2xl text-ds-status-success-text" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-ds-text-primary">
              Password Reset Successful
            </h2>
            <Text className="text-ds-text-secondary mb-6 block">
              Your password has been reset successfully. You can now log in with your new password.
            </Text>

            <Button
              type="primary"
              size="large"
              onClick={() => router.push("/login")}
              className="bg-ds-brand-primary hover:bg-ds-brand-primary-hover"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (error && (!token || !email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ds-surface-sunken py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <Alert
            message="Invalid Reset Link"
            description={error}
            type="error"
            showIcon
            className="mb-4"
          />
          <Link
            href="/forgot-password"
            className="block text-center text-ds-text-brand hover:text-ds-palette-purple-700 dark:hover:text-ds-brand-muted font-medium"
          >
            Request a new password reset
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ds-surface-sunken py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <Title level={2} className="mb-2">
            Set New Password
          </Title>
          <Text className="text-ds-text-secondary">Enter your new password below.</Text>
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
            name="password"
            label="New Password"
            rules={[
              { required: true, message: "Please enter your new password" },
              { min: 8, message: "Password must be at least 8 characters" },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: "Password must contain uppercase, lowercase, and number",
              },
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
              size="large"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm new password"
              size="large"
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
              Reset Password
            </Button>
          </Form.Item>

          <div className="text-center">
            <Link
              href="/login"
              className="text-ds-text-brand hover:text-ds-palette-purple-700 dark:hover:text-ds-brand-muted font-medium"
            >
              Back to Login
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ds-surface-sunken">
          <Card className="max-w-md w-full">
            <div className="text-center">Loading...</div>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
