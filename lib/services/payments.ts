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
  status: 'INITIALIZED' | 'STUBBED';
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
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'NOT_FOUND' | 'GATEWAY_UNAVAILABLE';
  amount: number;
  currency: string;
  message: string;
  providerStatus?: string;
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

function toSubunit(amount: number): number {
  return Math.round(normalizeAmount(amount) * 100);
}

function buildReference(gateway: SupportedPaymentGateway): string {
  return `${gateway.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function hasConfiguredSecret(secret: string | undefined): boolean {
  return typeof secret === 'string' && secret.trim().length > 0;
}

export function isGatewayReady(gateway: SupportedPaymentGateway): boolean {
  if (gateway === 'PAYSTACK') {
    return hasConfiguredSecret(env.paystackSecretKey);
  }

  return hasConfiguredSecret(env.flutterwaveSecretKey);
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

function mapPaystackVerificationStatus(status: string | null | undefined): VerifyPaymentResult['status'] {
  if (!status) return 'PENDING';
  const normalized = status.trim().toLowerCase();

  if (normalized === 'success') return 'SUCCESS';
  if (['failed', 'reversed'].includes(normalized)) return 'FAILED';
  if (['abandoned', 'ongoing', 'processing', 'queued', 'pending'].includes(normalized)) {
    return 'PENDING';
  }

  return 'PENDING';
}

async function initializePaystackPayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
  const paystackSecretKey = env.paystackSecretKey?.trim();
  if (!paystackSecretKey) {
    throw new Error('Paystack secret key is not configured.');
  }

  const reference = input.reference || buildReference('PAYSTACK');
  const amount = normalizeAmount(input.amount);
  if (amount <= 0) {
    throw new Error('Amount must be greater than zero.');
  }
  const currency = (input.currency || 'NGN').trim().toUpperCase();
  const callbackUrl = env.paystackCallbackUrl || input.callbackUrl;

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: toSubunit(amount),
      currency,
      reference,
      callback_url: callbackUrl,
      metadata: input.metadata,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  const providerData =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload.data as Record<string, unknown>)
      : {};
  const providerCallStatus =
    payload && typeof payload === 'object' && typeof payload.status === 'boolean'
      ? payload.status
      : null;
  const authorizationUrl =
    typeof providerData.authorization_url === 'string' ? providerData.authorization_url : '';
  const accessCode = typeof providerData.access_code === 'string' ? providerData.access_code : '';
  const providerReference =
    typeof providerData.reference === 'string' ? providerData.reference : reference;

  if (!response.ok || providerCallStatus === false || !authorizationUrl || !accessCode || !providerReference) {
    const providerMessage =
      payload && typeof payload === 'object' && typeof payload.message === 'string'
        ? payload.message
        : 'Unable to initialize Paystack payment.';
    throw new Error(providerMessage);
  }

  return {
    gateway: 'PAYSTACK',
    status: 'INITIALIZED',
    reference: providerReference,
    verificationReference: providerReference,
    authorizationUrl,
    accessCode,
    message: 'Paystack payment initialized successfully.',
    amount,
    currency,
    callbackUrl,
    metadata: input.metadata,
  };
}

async function verifyPaystackPayment(reference: string): Promise<VerifyPaymentResult> {
  const paystackSecretKey = env.paystackSecretKey?.trim();
  if (!paystackSecretKey) {
    return {
      gateway: 'PAYSTACK',
      reference,
      status: 'GATEWAY_UNAVAILABLE',
      amount: 0,
      currency: 'NGN',
      message: 'Paystack secret key is not configured.',
    };
  }

  let response: Response;
  try {
    response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );
  } catch {
    return {
      gateway: 'PAYSTACK',
      reference,
      status: 'GATEWAY_UNAVAILABLE',
      amount: 0,
      currency: 'NGN',
      message: 'Unable to reach Paystack verification endpoint.',
    };
  }

  const payload = await response.json().catch(() => ({}));
  const providerData =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload.data as Record<string, unknown>)
      : {};
  const providerCallStatus =
    payload && typeof payload === 'object' && typeof payload.status === 'boolean'
      ? payload.status
      : null;

  if (response.status === 404) {
    return {
      gateway: 'PAYSTACK',
      reference,
      status: 'NOT_FOUND',
      amount: 0,
      currency: 'NGN',
      message: 'Payment reference was not found by Paystack.',
    };
  }

  if (!response.ok || providerCallStatus === false) {
    const providerMessage =
      payload && typeof payload === 'object' && typeof payload.message === 'string'
        ? payload.message
        : 'Unable to verify payment with Paystack.';
    return {
      gateway: 'PAYSTACK',
      reference,
      status: 'FAILED',
      amount: 0,
      currency: 'NGN',
      message: providerMessage,
    };
  }

  const providerStatus =
    typeof providerData.status === 'string' ? providerData.status.trim().toLowerCase() : null;
  const providerReference =
    typeof providerData.reference === 'string' && providerData.reference.trim().length > 0
      ? providerData.reference
      : reference;
  const amount =
    typeof providerData.amount === 'number' && Number.isFinite(providerData.amount)
      ? providerData.amount / 100
      : 0;
  const currency =
    typeof providerData.currency === 'string' && providerData.currency.trim().length > 0
      ? providerData.currency.trim().toUpperCase()
      : 'NGN';

  return {
    gateway: 'PAYSTACK',
    reference: providerReference,
    status: mapPaystackVerificationStatus(providerStatus),
    amount,
    currency,
    message:
      typeof payload === 'object' && payload && typeof payload.message === 'string'
        ? payload.message
        : providerStatus
          ? `Paystack transaction status: ${providerStatus}.`
          : 'Payment verification response received from Paystack.',
    providerStatus: providerStatus || undefined,
  };
}

export async function initializePayment(
  input: InitializePaymentInput
): Promise<InitializePaymentResult> {
  if (input.gateway === 'PAYSTACK' && isGatewayReady('PAYSTACK')) {
    return initializePaystackPayment(input);
  }

  const reference = input.reference || buildReference(input.gateway);
  const amount = normalizeAmount(input.amount);
  const currency = input.currency || 'NGN';
  const callbackUrl =
    (input.gateway === 'PAYSTACK' ? env.paystackCallbackUrl : undefined) || input.callbackUrl;

  return {
    gateway: input.gateway,
    status: 'STUBBED',
    reference,
    verificationReference: reference,
    authorizationUrl: buildAuthorizationUrl(input.gateway, reference),
    accessCode: `stub-${reference}`,
    message: getGatewayMessage(input.gateway),
    amount,
    currency,
    callbackUrl,
    metadata: input.metadata,
  };
}

function inferVerificationStatus(reference: string): 'SUCCESS' | 'FAILED' | 'PENDING' | 'NOT_FOUND' {
  const normalized = reference.toLowerCase();
  if (normalized.includes('not_found') || normalized.includes('missing')) return 'NOT_FOUND';
  if (normalized.includes('success')) return 'SUCCESS';
  if (normalized.includes('fail')) return 'FAILED';
  return 'PENDING';
}

export async function verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
  if (input.gateway === 'PAYSTACK') {
    return verifyPaystackPayment(input.reference);
  }

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
        : status === 'NOT_FOUND'
          ? 'Stub verification did not find this provider reference.'
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
