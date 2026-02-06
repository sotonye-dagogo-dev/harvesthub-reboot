"use client";

import { Form, Input, Checkbox, Progress, Alert } from "antd";
import Link from "next/link";
import { useState, useEffect, ChangeEvent } from "react";

interface FormValues {
  password: string;
  confirmPassword?: string;
  agreement: boolean;
}

interface SecurityInfoProps {
  onNext: () => Promise<void>;
  updateFormData: (data: FormValues) => void;
  formData: FormValues;
}

export default function SecurityInfo({ onNext, updateFormData, formData }: SecurityInfoProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string>("");
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  useEffect(() => {
    // Initialize form with existing data
    if (formData) {
      form.setFieldsValue(formData as Partial<FormValues>);
    }
  }, [form, formData]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 20;

    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 20;

    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 20;

    // Contains number
    if (/[0-9]/.test(password)) strength += 20;

    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;

    setPasswordStrength(strength);
  }, [password]);

  const getPasswordStrengthLabel = (): string => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 20) return "Very Weak";
    if (passwordStrength <= 40) return "Weak";
    if (passwordStrength <= 60) return "Medium";
    if (passwordStrength <= 80) return "Strong";
    return "Very Strong";
  };

  const getPasswordStrengthColor = (): string => {
    if (passwordStrength <= 20) return "text-state-error"; // red
    if (passwordStrength <= 40) return "text-state-warning"; // orange/purple
    if (passwordStrength <= 60) return "text-state-info"; // yellow
    if (passwordStrength <= 80) return "text-state-success"; // green
    return "text-secondary-100"; // blue
  };

  const getProgressStrokeColor = (): string => {
    if (passwordStrength <= 20) return "#DC3545"; // state-error
    if (passwordStrength <= 40) return "#7700ED"; // state-warning
    if (passwordStrength <= 60) return "#FFB02E"; // state-info
    if (passwordStrength <= 80) return "#28A745"; // state-success
    return "#2A6BB3"; // secondary-100
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
  };

  const onFinish = async (values: FormValues): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Remove confirmPassword from submission data
      const submissionData = { ...values };
      delete submissionData.confirmPassword;

      // Update the form data
      updateFormData(submissionData);

      // Call the registration API
      await onNext();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Security Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create a strong password for your account
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-4 w-full"
        />
      )}

      <Form
        form={form}
        name="security-info"
        layout="vertical"
        autoComplete="off"
        requiredMark={false}
        onFinish={onFinish}
        className="w-full"
      >
        <Form.Item
          name="password"
          label={<span className="text-gray-900 dark:text-white font-medium">Password</span>}
          rules={[
            { required: true, message: "Please enter your password" },
            { min: 8, message: "Password must be at least 8 characters" },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
              message: "Password must contain uppercase, lowercase, number and special character",
            },
          ]}
        >
          <Input.Password
            size="large"
            placeholder="Create a password"
            onChange={handlePasswordChange}
            className="rounded-lg"
          />
        </Form.Item>

        {password && (
          <div className="mb-6">
            <Progress
              percent={passwordStrength}
              showInfo={false}
              strokeColor={getProgressStrokeColor()}
              className="mb-1"
            />
            <div className="flex justify-between text-xs">
              <span>Password Strength</span>
              <span className={getPasswordStrengthColor()}>{getPasswordStrengthLabel()}</span>
            </div>
          </div>
        )}

        <Form.Item
          name="confirmPassword"
          label={
            <span className="text-gray-900 dark:text-white font-medium">Confirm Password</span>
          }
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("The two passwords do not match"));
              },
            }),
          ]}
        >
          <Input.Password size="large" placeholder="Confirm your password" className="rounded-lg" />
        </Form.Item>

        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error("Please accept the Terms & Conditions")),
            },
          ]}
        >
          <Checkbox>
            I agree to the{" "}
            <Link href="/terms" className="text-purple-600 hover:text-purple-700 font-medium">
              Terms & Conditions
            </Link>
          </Checkbox>
        </Form.Item>

        <Form.Item className="mb-0">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-purple-600 py-3 text-white font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </Form.Item>
      </Form>
    </div>
  );
}
