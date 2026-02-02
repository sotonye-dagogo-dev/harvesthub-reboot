"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormData } from "@/app/providers";
import StoreInfo from "../components/StoreInfo";

export default function StoreInfoPage() {
  const router = useRouter();
  const { formData, updateFormData } = useFormData();

  useEffect(() => {
    // If user hasn't completed previous stages or is not a store owner, redirect
    if (
      !formData.userType ||
      !formData.firstName ||
      formData.userType !== "store"
    ) {
      router.push("/signup");
    }
  }, [formData, router]);

  const handleNext = () => {
    router.push("/signup/account-info");
  };

  return (
    <StoreInfo
      onNext={handleNext}
      updateFormData={updateFormData}
      formData={formData}
    />
  );
}
