"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormData } from "@/app/providers";
import UserInfo from "../components/UserInfo";

export default function UserInfoPage(): React.ReactElement {
  const router = useRouter();
  const { formData, updateFormData } = useFormData();

  useEffect(() => {
    // If user hasn't completed the selection stage, redirect back
    if (!formData.userType) {
      router.push("/signup");
    }
  }, [formData, router]);

  const handleNext = (): void => {
    if (formData.userType === "vendor") {
      router.push("/signup/store-info");
    } else {
      router.push("/signup/account-info");
    }
  };

  return <UserInfo onNext={handleNext} updateFormData={updateFormData} formData={formData} />;
}
