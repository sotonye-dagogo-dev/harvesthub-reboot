import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/data/database";
import { apiError, apiSuccess } from "@/lib/api/http";
import { estimateAdAmount, isPaymentSufficient, normalizeAdDuration, resolveAdRateConfig } from "@/lib/utils/adPricing";
import { verifyPayment, type SupportedPaymentGateway } from "@/lib/services/payments";
import {
  acquireIdempotencyGuard,
  buildPayloadFingerprint,
  getIdempotencyReplayResponse,
  readIdempotencyKeyHeader,
  setIdempotencyReplayResponse,
} from "@/lib/utils/idempotency";

const AD_APPLICATION_IDEMPOTENCY_SCOPE = "ad-application-create";
const AD_APPLICATION_IDEMPOTENCY_TTL_SECONDS = 60 * 5;

export const createAdApplicationSchema = z.object({
  userId: z.string().optional().nullable(),
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("A valid email is required"),
  phoneNumber: z.string().trim().min(7, "Phone number is required"),
  companyName: z.string().trim().optional().nullable(),
  title: z.string().trim().min(2, "Title is required"),
  description: z.string().trim().min(5, "Description is required"),
  imageUrl: z.string().trim().url("A valid image URL is required"),
  imagePublicId: z.string().trim().optional().nullable(),
  linkUrl: z.string().trim().url().optional().nullable(),
  position: z.enum(["TOP", "HERO", "SIDEBAR"]).optional(),
  theme: z.enum(["BUSINESS", "CHURCH", "EVENT", "PROMOTION"]).optional(),
  requestedStart: z.string().datetime().optional(),
  requestedEnd: z.string().datetime().optional().nullable(),
  paymentMethod: z.enum(["BANK_TRANSFER", "CARD", "USSD"]),
  amountPaid: z.coerce.number().positive("Amount paid must be greater than zero"),
  proofOfTransferUrl: z.string().trim().url("A valid proof of payment URL is required").optional().nullable(),
  proofPublicId: z.string().trim().optional().nullable(),
  paymentGateway: z.enum(["PAYSTACK", "FLUTTERWAVE"]).optional(),
  paymentReference: z.string().trim().min(6).max(100).optional(),
  paymentVerificationReference: z.string().trim().min(6).max(100).optional(),
  durationType: z.enum(["HOURLY", "DAILY"]).optional(),
  durationValue: z.coerce.number().int().min(1).optional(),
});

type CreateAdApplicationPayload = z.infer<typeof createAdApplicationSchema>;

function buildIdempotencyPayload(input: CreateAdApplicationPayload) {
  return {
    userId: input.userId ?? null,
    email: input.email.toLowerCase(),
    phoneNumber: input.phoneNumber,
    title: input.title,
    imageUrl: input.imageUrl,
    paymentMethod: input.paymentMethod,
    amountPaid: Number(input.amountPaid),
    durationType: input.durationType ?? "DAILY",
    durationValue: input.durationValue ?? 1,
    paymentVerificationReference: input.paymentVerificationReference ?? null,
    requestedStart: input.requestedStart ?? null,
  };
}

export async function processAdApplicationSubmission(req: NextRequest) {
  const parsedBody = createAdApplicationSchema.safeParse(await req.json());
  if (!parsedBody.success) {
    return apiError("Invalid request payload", 400, {
      details: parsedBody.error.flatten(),
    });
  }

  const data = parsedBody.data;
  const headerIdempotencyKey = readIdempotencyKeyHeader(req.headers);
  const fallbackFingerprint = buildPayloadFingerprint(buildIdempotencyPayload(data));
  const idempotencyKey = headerIdempotencyKey || fallbackFingerprint;

  const guard = await acquireIdempotencyGuard({
    scope: AD_APPLICATION_IDEMPOTENCY_SCOPE,
    key: idempotencyKey,
    ttlSeconds: AD_APPLICATION_IDEMPOTENCY_TTL_SECONDS,
  });

  if (!guard.acquired) {
    const replay = await getIdempotencyReplayResponse({
      scope: AD_APPLICATION_IDEMPOTENCY_SCOPE,
      key: idempotencyKey,
    });

    if (replay) {
      return apiSuccess({
        ...replay.body,
        idempotency: { replayed: true, key: idempotencyKey, mode: guard.mode },
      }, replay.status);
    }

    return apiSuccess(
      {
        duplicate: true,
        message: "An equivalent submission is already processing. Please wait.",
        idempotency: { replayed: true, key: idempotencyKey, mode: guard.mode },
      },
      202
    );
  }

  if (!data.imageUrl.startsWith("https://res.cloudinary.com/")) {
    return apiError("Banner image must be uploaded via managed Cloudinary flow.", 400);
  }
  if (data.proofOfTransferUrl && !data.proofOfTransferUrl.startsWith("https://res.cloudinary.com/")) {
    return apiError("Proof of transfer must be uploaded via managed Cloudinary flow.", 400);
  }
  const rateConfig = await db.adRateConfig.getActive();
  const { rateConfig: effectiveRateConfig } = resolveAdRateConfig(rateConfig);

  const normalizedDuration = normalizeAdDuration(data.durationType, data.durationValue);
  const expectedAmount = estimateAdAmount(
    {
      hourlyRate: effectiveRateConfig.hourlyRate,
      dailyRate: effectiveRateConfig.dailyRate,
    },
    normalizedDuration.durationType,
    normalizedDuration.durationValue
  );

  if (!isPaymentSufficient(data.amountPaid, expectedAmount)) {
    return apiError("Amount paid is below the required rate for selected duration", 400, {
      expectedAmount,
      amountPaid: data.amountPaid,
      durationType: normalizedDuration.durationType,
      durationValue: normalizedDuration.durationValue,
    });
  }

  if (data.paymentMethod === "BANK_TRANSFER") {
    if (!data.proofOfTransferUrl) {
      return apiError("Proof of transfer is required for bank transfer applications.", 400);
    }
  } else {
    if (!data.paymentGateway || !data.paymentReference || !data.paymentVerificationReference) {
      return apiError(
        "paymentGateway, paymentReference, and paymentVerificationReference are required for card/USSD applications.",
        400
      );
    }
    const verification = await verifyPayment({
      gateway: data.paymentGateway as SupportedPaymentGateway,
      reference: data.paymentVerificationReference,
    });
    if (verification.status !== "SUCCESS") {
      return apiError("Payment verification is not successful", 400, { verification });
    }
  }

  const application = await db.adApplications.create({
    userId: data.userId ?? null,
    name: data.name,
    email: data.email,
    phoneNumber: data.phoneNumber,
    companyName: data.companyName ?? null,
    title: data.title,
    description: data.description,
    imageUrl: data.imageUrl,
    linkUrl: data.linkUrl ?? null,
    position: data.position ?? "TOP",
    theme: data.theme ?? "BUSINESS",
    requestedStart: data.requestedStart ? new Date(data.requestedStart) : new Date(),
    requestedEnd: data.requestedEnd ? new Date(data.requestedEnd) : null,
    status: data.paymentMethod === "BANK_TRANSFER" ? "PENDING_PAYMENT" : "PENDING_APPROVAL",
    paymentMethod: data.paymentMethod,
    amountPaid: data.amountPaid,
    proofOfTransferUrl: data.proofOfTransferUrl ?? null,
    durationType: normalizedDuration.durationType,
    durationValue: normalizedDuration.durationValue,
    reviewComment: null,
    reviewedBy: null,
    activeUntil: null,
  });

  const replayBody = { application, expectedAmount };
  await setIdempotencyReplayResponse({
    scope: AD_APPLICATION_IDEMPOTENCY_SCOPE,
    key: idempotencyKey,
    status: 201,
    body: replayBody,
    ttlSeconds: AD_APPLICATION_IDEMPOTENCY_TTL_SECONDS,
  });

  return apiSuccess(
    {
      ...replayBody,
      idempotency: { replayed: false, key: idempotencyKey, mode: guard.mode },
    },
    201
  );
}
