import type { Vendor } from "@/lib/types";

export function isVendorVerified(vendor: Pick<Vendor, "status" | "businessVerification"> | null | undefined): boolean {
  if (!vendor) return false;
  return vendor.status === "APPROVED" || vendor.businessVerification?.verifiedAt != null;
}
