export type PaystackInlineInitParams = {
  key: string;
  email: string;
  amount: number;
  reference: string;
  currency?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (result: { reference: string; [key: string]: unknown }) => void;
  onClose?: () => void;
};

type PaystackInlineHandler = {
  openIframe: () => void;
};

type PaystackPopRuntime = {
  setup: (params: Record<string, unknown>) => PaystackInlineHandler;
};

declare global {
  interface Window {
    PaystackPop?: PaystackPopRuntime;
  }
}

const PAYSTACK_INLINE_SCRIPT_URL = "https://js.paystack.co/v1/inline.js";

function isPositiveAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0;
}

function toSubunit(amount: number): number {
  return Math.round(amount * 100);
}

async function loadPaystackInlineScript(): Promise<PaystackPopRuntime> {
  if (typeof window === "undefined") {
    throw new Error("Paystack inline payment is only available in the browser.");
  }

  if (window.PaystackPop?.setup) {
    return window.PaystackPop;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${PAYSTACK_INLINE_SCRIPT_URL}"]`
  );

  if (existingScript) {
    if (window.PaystackPop?.setup) {
      return window.PaystackPop;
    }

    await new Promise<void>((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Unable to load Paystack inline script.")),
        { once: true }
      );
    });
  } else {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PAYSTACK_INLINE_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load Paystack inline script."));
      document.body.appendChild(script);
    });
  }

  if (!window.PaystackPop?.setup) {
    throw new Error("Paystack inline runtime is unavailable.");
  }

  return window.PaystackPop;
}

export function buildPaystackReference(prefix = "PAY"): string {
  const securePart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  return `${prefix}-${Date.now()}-${securePart}`;
}

export async function initializePaystackInlinePayment(
  params: PaystackInlineInitParams
): Promise<void> {
  const { key, email, amount, reference, currency = "NGN", metadata, onSuccess, onClose } = params;

  if (!key.trim()) {
    throw new Error("Paystack public key is not configured.");
  }
  if (!email.trim()) {
    throw new Error("A valid payer email is required for card payment.");
  }
  if (!isPositiveAmount(amount)) {
    throw new Error("Payment amount must be greater than zero.");
  }
  if (!reference.trim()) {
    throw new Error("Payment reference is required.");
  }

  const runtime = await loadPaystackInlineScript();
  const handler = runtime.setup({
    key,
    email,
    amount: toSubunit(amount),
    currency,
    ref: reference,
    metadata,
    callback: (result: { reference?: unknown; [key: string]: unknown }) => {
      const resolvedReference =
        typeof result.reference === "string" && result.reference.trim().length > 0
          ? result.reference.trim()
          : reference;
      onSuccess({ ...result, reference: resolvedReference });
    },
    onClose,
  });

  handler.openIframe();
}
