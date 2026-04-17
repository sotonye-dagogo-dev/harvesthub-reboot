"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Form, Input, Button, Divider, Checkbox, App } from "antd";
import { MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { useAuth } from "@/lib/contexts/AuthContext";
import { PageLoader } from "@/components/ui";
import {
  clearPendingAuthRedirect,
  consumePendingAuthRedirect,
  sanitizeInternalRedirectPath,
} from "@/lib/utils/authRedirect";
import { getFriendlyLoginError } from "@/lib/utils/authMessages";

const REMEMBER_ME_KEY = "myharvesthub_remember_me";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  const redirectFromQuery = sanitizeInternalRedirectPath(searchParams.get("from"), "");
  const verified = searchParams.get("verified");
  const emailChanged = searchParams.get("emailChanged");

  // Auto-toggle "Remember Me" from previous preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_ME_KEY);
      if (saved === "true") {
        form.setFieldsValue({ rememberMe: true });
      }
    } catch {
      // ignore
    }
  }, [form]);

  useEffect(() => {
    if (emailChanged === "1") {
      message.info("Email changed successfully. Please sign in with your new email address.");
      return;
    }
    if (verified === "1") {
      message.success("Email verified successfully. You can now sign in.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailChanged, verified]);

  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);

    try {
      await login({
        email: values.email.toLowerCase().trim(),
        password: values.password,
        rememberMe: values.rememberMe,
      });
      const redirectTo = redirectFromQuery || consumePendingAuthRedirect() || "/";
      if (redirectFromQuery) {
        clearPendingAuthRedirect();
      }
      router.push(redirectTo);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Failed to login. Please check your credentials.";
      message.error(getFriendlyLoginError(raw));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-ds-md bg-ds-surface-base p-8 shadow-ds-lg">
      {/* Logo/Brand */}
      <div className="mb-8 text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-ds-text-brand">
          MyHarvestHub
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-ds-text-secondary dark:text-ds-text-placeholder">
          Sign in to your account
        </p>
      </div>

      {/* Login Form */}
      <Form form={form} layout="vertical" onFinish={handleLogin} size="large" requiredMark={false}>
        <Form.Item
          label="Email"
          name="email"
          normalize={(value) => (typeof value === "string" ? value.toLowerCase() : value)}
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input
            type="email"
            prefix={<MailOutlined className="text-ds-text-placeholder" />}
            placeholder="your@email.com"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
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
          <Form.Item name="rememberMe" valuePropName="checked" noStyle>
            <Checkbox className="text-ds-text-secondary">Remember me</Checkbox>
          </Form.Item>
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
        <span className="text-ds-text-secondary dark:text-ds-text-placeholder">
          Don&apos;t have an account?{" "}
        </span>
        <Link
          href={
            redirectFromQuery
              ? `/signup?from=${encodeURIComponent(redirectFromQuery)}`
              : "/signup"
          }
          className="font-medium text-ds-text-brand hover:text-ds-palette-purple-700"
        >
          Sign up
        </Link>
      </div>

      {/*
        Demo credentials are intentionally hidden in the UI.
        Keep this section commented for local-only debugging if needed.
      */}
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader minHeight="min-h-[320px]" message="Loading sign in..." />}>
      <LoginForm />
    </Suspense>
  );
}
