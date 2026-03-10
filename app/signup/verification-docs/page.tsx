"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormData } from "@/app/providers";
import VerificationDocs from "../components/VerificationDocs";

export default function VerificationDocsPage() {
  const router = useRouter();
  const { formData, updateFormData } = useFormData();

  useEffect(() => {
    // Must be a vendor who has completed store-info
    if (!formData.userType || !formData.storeName || formData.userType !== "vendor") {
      router.push("/signup");
    }
  }, [formData, router]);

  const handleNext = () => {
    router.push("/signup/account-info");
  };

  return (
    <VerificationDocs onNext={handleNext} updateFormData={updateFormData} formData={formData} />
  );
}
