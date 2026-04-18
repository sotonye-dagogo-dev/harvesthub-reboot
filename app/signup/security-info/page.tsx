"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormData } from "@/app/providers";
import { useAuth } from "@/lib/contexts/AuthContext";
import { UserRole, VendorCategory, Campus, Position } from "@/lib/constants";
import SecurityInfo from "../components/SecurityInfo";
import { getPendingAuthRedirect, sanitizeInternalRedirectPath } from "@/lib/utils/authRedirect";

export default function SecurityInfoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formData, updateFormData } = useFormData();
  const { register } = useAuth();

  useEffect(() => {
    // Validate that necessary previous steps have been completed
    if (!formData.userType || !formData.firstName || !formData.username) {
      router.push("/signup");
    }
  }, [formData, router]);

  const handleNext = async (securityData: {
    password: string;
    confirmPassword?: string;
    agreement: boolean;
  }) => {
    try {
      const role =
        formData.userType === "vendor"
          ? UserRole.VENDOR
          : UserRole.BUYER;

      if (!securityData.agreement) {
        throw new Error("You must accept the Terms & Conditions to continue.");
      }

      if (!securityData.confirmPassword || securityData.password !== securityData.confirmPassword) {
        throw new Error("Passwords do not match.");
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

      if (role === UserRole.VENDOR) {
        const docs = formData.verificationDocuments || [];
        const requiredDocTypes = ["ID", "BUSINESS_REGISTRATION", "UTILITY_BILL"];
        const hasAllRequiredDocs = requiredDocTypes.every((requiredType) =>
          docs.some((doc: any) => doc?.documentType === requiredType)
        );

        if (!formData.businessAddress?.trim()) {
          throw new Error("Business address is required for vendor signup.");
        }

        if (!formData.idType) {
          throw new Error("Please select your ID type before continuing.");
        }

        if (!hasAllRequiredDocs) {
          throw new Error(
            "Please upload all required verification documents: valid ID, business registration certificate, and utility bill."
          );
        }
      }

      // Build registration payload with the latest security values.
      const payload = {
        email: formData.email,
        password: securityData.password,
        confirmPassword: securityData.confirmPassword,
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
          idType: formData.idType,
          businessAddress: formData.businessAddress,
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
        }),
      };

      await register(payload);

      // Redirect to verify email page
      const continuationFromQuery = sanitizeInternalRedirectPath(searchParams.get("from"), "");
      const continuation = continuationFromQuery || getPendingAuthRedirect();
      const verifyParams = new URLSearchParams({
        email: formData.email,
      });
      if (continuation) {
        verifyParams.set("from", continuation);
      }
      router.push(`/verify-email?${verifyParams.toString()}`);
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
