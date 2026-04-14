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
  verificationReference: string;
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

export type InitiateTransferInput = {
  gateway: SupportedPaymentGateway;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference?: string;
  metadata?: Record<string, unknown>;
};

export type InitiateTransferResult = {
  gateway: SupportedPaymentGateway;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  reference: string;
  providerReference: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export type VerifyTransferInput = {
  gateway: SupportedPaymentGateway;
  providerReference: string;
};

export type VerifyTransferResult = {
  gateway: SupportedPaymentGateway;
  providerReference: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message: string;
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
      ? `Paystack integration stub initialized for ${env.paystackMode} mode (credentials detected).`
      : `Paystack integration stub initialized for ${env.paystackMode} mode (credentials missing).`;
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

  const callbackUrl =
    (input.gateway === 'PAYSTACK' ? env.paystackCallbackUrl : undefined) || input.callbackUrl;

  return {
    gateway: input.gateway,
    status: 'STUBBED',
    reference,
    verificationReference: `${reference}-success`,
    authorizationUrl: buildAuthorizationUrl(input.gateway, reference),
    accessCode: `stub-${reference}`,
    message: getGatewayMessage(input.gateway),
    amount,
    currency,
    callbackUrl,
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

function inferTransferStatus(reference: string): 'SUCCESS' | 'FAILED' | 'PENDING' {
  const normalized = reference.toLowerCase();
  if (normalized.includes('success')) return 'SUCCESS';
  if (normalized.includes('fail')) return 'FAILED';
  return 'PENDING';
}

export async function initiateTransfer(
  input: InitiateTransferInput
): Promise<InitiateTransferResult> {
  const reference = input.reference || buildReference(input.gateway);
  const providerReference = `${reference}-transfer-pending`;

  return {
    gateway: input.gateway,
    status: inferTransferStatus(providerReference),
    reference,
    providerReference,
    message:
      input.gateway === 'PAYSTACK'
        ? `Paystack transfer stub initiated for ${normalizeAmount(input.amount)} NGN.`
        : `Flutterwave transfer stub initiated for ${normalizeAmount(input.amount)} NGN.`,
    metadata: input.metadata,
  };
}

export async function verifyTransfer(
  input: VerifyTransferInput
): Promise<VerifyTransferResult> {
  const status = inferTransferStatus(input.providerReference);
  return {
    gateway: input.gateway,
    providerReference: input.providerReference,
    status,
    message:
      status === 'SUCCESS'
        ? 'Transfer verification marked as successful.'
        : status === 'FAILED'
          ? 'Transfer verification marked as failed.'
          : 'Transfer verification is pending. Replace with provider transfer status API.',
  };
}

export function getPaymentFallbackTelemetry(): PaymentFallbackTelemetry {
  return {
    bankTransferFallbackEnabled: env.paymentFallbackBankTransfer,
    deprecationDays: env.paymentFallbackDeprecationDays,
    usedAt: new Date().toISOString(),
  };
}
