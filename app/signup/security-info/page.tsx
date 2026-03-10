"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormData } from "@/app/providers";
import { useAuth } from "@/lib/contexts/AuthContext";
import { UserRole, VendorCategory, Campus, Position } from "@/lib/constants";
import SecurityInfo from "../components/SecurityInfo";

export default function SecurityInfoPage() {
  const router = useRouter();
  const { formData, updateFormData } = useFormData();
  const { register } = useAuth();

  useEffect(() => {
    // Validate that necessary previous steps have been completed
    if (!formData.userType || !formData.firstName || !formData.username) {
      router.push("/signup");
    }
  }, [formData, router]);

  const handleNext = async () => {
    try {
      // Submit registration to API
      await register({
        email: formData.email!,
        password: formData.password!,
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        phoneNumber: formData.phoneNumber!,
        role: formData.userType === "vendor" ? UserRole.VENDOR : UserRole.BUYER,
        // Vendor-specific fields (using available form data)
        ...(formData.userType === "vendor" && {
          storeName: formData.storeName,
          storeDescription: formData.storeDescription || formData.bio,
          category: (formData.storeCategory || "OTHERS") as VendorCategory,
          whatsappNumber: formData.phoneNumber!,
          campus: (formData.campus || "IKEJA") as Campus,
          position: formData.position ? (formData.position as Position) : undefined,
          isChurchAffiliated: false,
          verificationDocuments: formData.verificationDocuments,
        }),
        // Buyer-specific fields (minimal for now)
        ...(formData.userType === "buyer" && {
          dateOfBirth: undefined,
          gender: undefined,
        }),
      });

      // Redirect to success page
      router.push("/signup-success");
    } catch (error) {
      console.error("Registration failed:", error);
      // Error will be handled by SecurityInfo component
      throw error;
    }
  };

  return (
    <SecurityInfo
      onNext={handleNext}
      updateFormData={updateFormData}
      formData={{
        ...formData,
        password: formData.password || "",
        agreement: formData.agreement ?? false,
      }}
    />
  );
}
