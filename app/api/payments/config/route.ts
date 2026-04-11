import { NextRequest } from "next/server";
import { apiSuccess, withApiHandler } from "@/lib/api/http";
import { getPaymentProcessingRuntimeConfig } from "@/lib/config/payments";

export async function GET(_req: NextRequest) {
  return withApiHandler("GET /api/payments/config", async () => {
    return apiSuccess(getPaymentProcessingRuntimeConfig());
  });
}
