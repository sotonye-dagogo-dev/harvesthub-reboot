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

  const handleNext = async (securityData: { password: string; agreement: boolean }) => {
    try {
      const role = formData.userType === "vendor" ? UserRole.VENDOR : UserRole.BUYER;

      if (!securityData.agreement) {
        throw new Error("You must accept the Terms & Conditions to continue.");
      }

      // Validate essential signup fields before calling API, this is a defensive secondary check.
      if (
        !formData.email ||
        !securityData.password ||
        !formData.firstName ||
        !formData.lastName ||
        !formData.phoneNumber
      ) {
        throw new Error("Missing required fields. Please re-check your information and try again.");
      }

      // Build registration payload with the latest security values.
      const payload = {
        email: formData.email,
        password: securityData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        role,
        agreeToTerms: securityData.agreement,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,

        ...(role === UserRole.VENDOR && {
          storeName: formData.storeName,
          storeDescription: formData.storeDescription || formData.bio,
          category: (formData.storeCategory || VendorCategory.OTHERS) as VendorCategory,
          whatsappNumber: formData.whatsappNumber || formData.phoneNumber,
          campus: (formData.campus || Campus.IKEJA) as Campus,
          position: formData.position ? (formData.position as Position) : undefined,
          isChurchAffiliated: formData.isChurchAffiliated || false,
          verificationDocuments: formData.verificationDocuments,
          businessAddress: formData.businessAddress,
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
        }),
      };

      await register(payload);

      // Redirect to verify email page
      router.push("/verify-email");
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
