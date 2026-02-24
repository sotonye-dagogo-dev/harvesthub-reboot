"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormData } from "@/app/providers";
import { CheckCircleFilled } from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";

export default function SignupSuccessPage(): React.ReactElement {
  const router = useRouter();
  const { formData, resetFormData } = useFormData();

  useEffect(() => {
    // If user hasn't completed all steps, redirect back to signup
    if (!formData.password) {
      router.push("/signup");
      return;
    }

    // Reset form data when component unmounts
    return () => {
      resetFormData();
    };
  }, [formData, resetFormData, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-ds-surface-base">
      <div className="max-w-md w-full p-8 flex flex-col items-center">
        <div className="text-7xl text-primary-100 mb-6">
          <CheckCircleFilled />
        </div>

        <h1 className="text-4xl font-bold mb-2 text-center">Account Created!</h1>
        <p className="text-ds-text-placeholder text-center mb-8">
          Congratulations! Your {formData.userType} account has been created successfully.
        </p>

        <Button
          type="primary"
          size="large"
          className="w-full h-12 bg-primary-100 border-primary-100 mb-4"
        >
          <Link href="/login" className="text-white">
            Login to your account
          </Link>
        </Button>

        <Button type="default" size="large" className="w-full h-12">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    </div>
  );
}
