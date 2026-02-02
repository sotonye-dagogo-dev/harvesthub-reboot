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
    <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
      {/* Logo/Brand */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400">HarvestHub</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Sign in to your account</p>
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
            prefix={<MailOutlined className="text-gray-400" />}
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
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Enter your password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            autoComplete="current-password"
          />
        </Form.Item>

        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/forgot-password"
            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
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
            className="h-11 bg-purple-600 hover:bg-purple-700"
          >
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <Divider plain className="my-6 text-gray-400">
        Or
      </Divider>

      {/* Sign Up Link */}
      <div className="text-center">
        <span className="text-gray-600 dark:text-gray-300">Don&apos;t have an account? </span>
        <Link
          href="/signup"
          className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
        >
          Sign up
        </Link>
      </div>

      {/* Demo Credentials */}
      <div className="mt-8 rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
        <p className="mb-2 text-sm font-medium text-purple-900 dark:text-purple-200">
          Demo Credentials:
        </p>
        <div className="space-y-1 text-xs text-purple-700 dark:text-purple-300">
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
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">Loading...</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
