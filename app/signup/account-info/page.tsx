"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormData } from "@/app/providers";
import AccountInfo from "../components/AccountInfo";

export default function AccountInfoPage() {
  const router = useRouter();
  const { formData, updateFormData } = useFormData();

  useEffect(() => {
    // If user hasn't completed previous stages, redirect
    if (!formData.userType || !formData.firstName) {
      router.push("/signup");
    }

    // If store owner but hasn't filled store info, redirect
    if (formData.userType === "store" && !formData.storeName) {
      router.push("/signup/store-info");
    }
  }, [formData, router]);

  const handleNext = () => {
    router.push("/signup/security-info");
  };

  return (
    <>
      <AccountInfo
        onNext={handleNext}
        updateFormData={updateFormData}
        formData={{
          ...formData,
          username: formData.username || ''  // This ensures username is a string
        }}
      />
    </>
  );
}
