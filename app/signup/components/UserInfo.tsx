"use client";

import { Form, Input, Select, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useState, useEffect, useRef, useCallback } from "react";
import { FormComponentProps } from "@/app/types";
import { PhoneInput } from "@/components/ui";
import { CrossPlatformAccountPrompt } from "@/components/ui/CrossPlatformAccountPrompt";
import type { CrossPlatformAccountInfo } from "@/components/ui/CrossPlatformAccountPrompt";
import { checkEmailCrossPlatform, type CrossPlatformCheckResult } from "@/lib/services/cisCheck";
import { CAMPUS_LOCATIONS } from "@/lib/constants";

interface UserInfoFields {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  campus: string;
}

const CHECK_DEBOUNCE_MS = 800;

export default function UserInfo({ onNext, updateFormData, formData }: FormComponentProps) {
  const [form] = Form.useForm<UserInfoFields>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [crossPlatformAccount, setCrossPlatformAccount] = useState<CrossPlatformAccountInfo | null>(null);
  const [emailCheckDone, setEmailCheckDone] = useState(false);
  const emailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckedEmailRef = useRef<string>("");

  useEffect(() => {
    if (formData?.firstName) {
      form.setFieldsValue({
        firstName: formData.firstName,
        lastName: formData.lastName || "",
        email: formData.email || "",
        phoneNumber: formData.phoneNumber || "",
        campus: formData.campus || undefined,
      });
    }
  }, [form, formData]);

  const doEmailCheck = useCallback(async (email: string) => {
    if (!email || !email.includes("@")) {
      setCrossPlatformAccount(null);
      return;
    }

    if (lastCheckedEmailRef.current === email) return;
    lastCheckedEmailRef.current = email;

    setCheckingEmail(true);
    try {
      const result: CrossPlatformCheckResult | null = await checkEmailCrossPlatform(email);
      if (result?.exists && result.platforms.length > 0) {
        setCrossPlatformAccount({
          platforms: result.platforms,
          firstName: result.canonicalUser?.firstName ?? null,
          lastName: result.canonicalUser?.lastName ?? null,
          email: result.canonicalUser?.email ?? email,
        });
      } else {
        setCrossPlatformAccount(null);
      }
    } finally {
      setCheckingEmail(false);
      setEmailCheckDone(true);
    }
  }, []);

  const handleEmailBlur = useCallback(() => {
    if (emailTimerRef.current) {
      clearTimeout(emailTimerRef.current);
    }
    const email = form.getFieldValue("email");
    if (email && typeof email === "string" && email.includes("@")) {
      emailTimerRef.current = setTimeout(() => doEmailCheck(email), CHECK_DEBOUNCE_MS);
    }
  }, [form, doEmailCheck]);

  const handleEmailChange = useCallback(() => {
    setCrossPlatformAccount(null);
    setEmailCheckDone(false);
    if (emailTimerRef.current) {
      clearTimeout(emailTimerRef.current);
    }
  }, []);

  const onFinish = async (values: UserInfoFields): Promise<void> => {
    if (crossPlatformAccount) {
      return;
    }

    setSubmitting(true);
    try {
      if (!emailCheckDone) {
        await doEmailCheck(values.email);
      }
      if (crossPlatformAccount) {
        setSubmitting(false);
        return;
      }
      updateFormData(values);
      message.success("Personal information saved");
      onNext();
    } catch (error) {
      console.error("Form submission error:", error);
      message.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignInInstead = () => {
    window.location.href = "/login";
  };

  const handleContinueSignup = () => {
    setCrossPlatformAccount(null);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-ds-text-primary mb-2">Personal Information</h3>
        <p className="text-sm text-ds-text-secondary">Tell us about yourself</p>
      </div>

      {crossPlatformAccount && (
        <CrossPlatformAccountPrompt
          account={crossPlatformAccount}
          onSignIn={handleSignInInstead}
          onContinue={handleContinueSignup}
        />
      )}

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
          label={
            <span className="text-ds-text-primary font-medium">
              Email Address
              {checkingEmail && (
                <span className="ml-2 text-xs text-ds-text-secondary">Checking...</span>
              )}
            </span>
          }
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
            onBlur={handleEmailBlur}
            onChange={handleEmailChange}
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
                  /^\+234[789]\d{9}$/,
                  /^\+1\d{10}$/,
                  /^\+44\d{10}$/,
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

        <Form.Item
          name="campus"
          label={
            <span className="text-ds-text-primary font-medium">
              Campus / Pickup Location
            </span>
          }
          rules={[{ required: true, message: "Please select your campus location" }]}
        >
          <Select
            size="large"
            placeholder="Select your campus"
            className="rounded-ds-md"
            options={CAMPUS_LOCATIONS.map((campus) => ({
              value: campus.value,
              label: campus.label,
            }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <button
            type="submit"
            disabled={submitting || !!crossPlatformAccount}
            aria-busy={submitting}
            className="w-full rounded-ds-md bg-ds-brand-primary py-3 text-white font-semibold hover:bg-ds-brand-primary-hover disabled:bg-ds-surface-disabled transition-colors"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <LoadingOutlined /> Processing...
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </Form.Item>
      </Form>
    </div>
  );
}
