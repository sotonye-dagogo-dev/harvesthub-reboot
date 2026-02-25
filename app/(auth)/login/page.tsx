"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Form, Input, Button, Alert, Divider } from "antd";
import { MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { useAuth } from "@/lib/contexts/AuthContext";

interface LoginFormData {
  email: string;
  password: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("from") || "/";

  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      await login({ email: values.email, password: values.password });
      router.push(redirectTo);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to login. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-ds-md bg-ds-surface-base p-8 shadow-ds-lg">
      {/* Logo/Brand */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-ds-text-brand">HarvestHub</h1>
        <p className="mt-2 text-ds-text-secondary dark:text-ds-text-placeholder">Sign in to your account</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      {/* Login Form */}
      <Form form={form} layout="vertical" onFinish={handleLogin} size="large" requiredMark={false}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-ds-text-placeholder" />}
            placeholder="your@email.com"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please enter your password" }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-ds-text-placeholder" />}
            placeholder="Enter your password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            autoComplete="current-password"
          />
        </Form.Item>

        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/forgot-password"
            className="text-sm text-ds-text-brand hover:text-ds-palette-purple-700"
          >
            Forgot password?
          </Link>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            className="h-11 bg-ds-brand-primary hover:bg-ds-brand-primary-hover"
          >
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <Divider plain className="my-6 text-ds-text-placeholder">
        Or
      </Divider>

      {/* Sign Up Link */}
      <div className="text-center">
        <span className="text-ds-text-secondary dark:text-ds-text-placeholder">Don&apos;t have an account? </span>
        <Link
          href="/signup"
          className="font-medium text-ds-text-brand hover:text-ds-palette-purple-700"
        >
          Sign up
        </Link>
      </div>

      {/* Demo Credentials */}
      <div className="mt-8 rounded-ds-md bg-ds-brand-surface p-4 dark:bg-ds-brand-subtle">
        <p className="mb-2 text-sm font-medium text-ds-palette-purple-900">
          Demo Credentials:
        </p>
        <div className="space-y-1 text-xs text-ds-palette-purple-700 dark:text-ds-brand-muted">
          <p>
            <strong>Admin:</strong> admin@harvesthub.com / admin123
          </p>
          <p>
            <strong>Vendor:</strong> vendor@harvesthub.com / vendor123
          </p>
          <p>
            <strong>Buyer:</strong> buyer@harvesthub.com / buyer123
          </p>
        </div>
      </div>
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-ds-md bg-ds-surface-base p-8 shadow-ds-lg">Loading...</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
