import { env } from '@/lib/config/env';

export type SupportedPaymentGateway = 'PAYSTACK' | 'FLUTTERWAVE';

export type InitializePaymentInput = {
  gateway: SupportedPaymentGateway;
  amount: number;
  email: string;
  currency?: string;
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

export type InitializePaymentResult = {
  gateway: SupportedPaymentGateway;
  status: 'STUBBED';
  reference: string;
  authorizationUrl: string;
  accessCode: string;
  message: string;
  amount: number;
  currency: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

export type VerifyPaymentInput = {
  gateway: SupportedPaymentGateway;
  reference: string;
};

export type VerifyPaymentResult = {
  gateway: SupportedPaymentGateway;
  reference: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  amount: number;
  currency: string;
  message: string;
};

export type PaymentFallbackTelemetry = {
  bankTransferFallbackEnabled: boolean;
  deprecationDays: number;
  usedAt: string;
};

function normalizeAmount(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

function buildReference(gateway: SupportedPaymentGateway): string {
  return `${gateway.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function getGatewayMessage(gateway: SupportedPaymentGateway): string {
  if (gateway === 'PAYSTACK') {
    return env.paystackSecretKey
      ? 'Paystack integration stub initialized (credentials detected).'
      : 'Paystack integration stub initialized (credentials missing).';
  }

  return env.flutterwaveSecretKey
    ? 'Flutterwave integration stub initialized (credentials detected).'
    : 'Flutterwave integration stub initialized (credentials missing).';
}

function buildAuthorizationUrl(gateway: SupportedPaymentGateway, reference: string): string {
  if (gateway === 'PAYSTACK') {
    return `https://checkout.paystack.com/${reference}`;
  }

  return `https://checkout.flutterwave.com/v3/hosted/pay/${reference}`;
}

export async function initializePayment(
  input: InitializePaymentInput
): Promise<InitializePaymentResult> {
  const reference = input.reference || buildReference(input.gateway);
  const amount = normalizeAmount(input.amount);
  const currency = input.currency || 'NGN';

  return {
    gateway: input.gateway,
    status: 'STUBBED',
    reference,
    authorizationUrl: buildAuthorizationUrl(input.gateway, reference),
    accessCode: `stub-${reference}`,
    message: getGatewayMessage(input.gateway),
    amount,
    currency,
    callbackUrl: input.callbackUrl,
    metadata: input.metadata,
  };
}

function inferVerificationStatus(reference: string): 'SUCCESS' | 'FAILED' | 'PENDING' {
  const normalized = reference.toLowerCase();
  if (normalized.includes('success')) return 'SUCCESS';
  if (normalized.includes('fail')) return 'FAILED';
  return 'PENDING';
}

export async function verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
  const status = inferVerificationStatus(input.reference);

  return {
    gateway: input.gateway,
    reference: input.reference,
    status,
    amount: 0,
    currency: 'NGN',
    message:
      status === 'SUCCESS'
        ? 'Stub verification marked as successful.'
        : status === 'FAILED'
          ? 'Stub verification marked as failed.'
          : 'Stub verification is pending. Replace with provider API verification.',
  };
}

export function getPaymentFallbackTelemetry(): PaymentFallbackTelemetry {
  return {
    bankTransferFallbackEnabled: env.paymentFallbackBankTransfer,
    deprecationDays: env.paymentFallbackDeprecationDays,
    usedAt: new Date().toISOString(),
  };
}
