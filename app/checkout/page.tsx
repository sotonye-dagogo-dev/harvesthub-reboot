"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/store/cartStore";
import { Button, Card } from "@/components/ui";
import { AddressForm } from "@/components/features";
import { formatCurrency } from "@/lib/utils";
import { Radio, message, Tag } from "antd";
import { Store, Wallet, CreditCard, Truck, CheckCircle, Info, CalendarClock, Ticket } from "lucide-react";
import Image from "next/image";
import { PLATFORM_DEFAULTS } from "@/lib/constants";
import type { AddressFormData } from "@/lib/types";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { mapCheckoutErrorMessage } from "@/app/checkout/error-mapping";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getProductsClient } from "@/lib/data/clientDataFetchers";

export const dynamic = "force-dynamic";

type DeliveryMethod = "PICKUP" | "DELIVERY";
type PaymentMethod = "WALLET" | "CARD";
type PickupService = "SUNDAY_FIRST" | "SUNDAY_SECOND" | "MIDWEEK" | "SPECIAL_EVENT";
type CardPaymentState = "IDLE" | "INITIALIZED" | "VERIFYING" | "VERIFIED";
type CheckoutWalletSummary = {
  availableBalance: number | null;
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, totalPrice, clearCart, reconcileWithCatalog } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP");
  const [pickupService, setPickupService] = useState<PickupService>("SUNDAY_FIRST");
  const [selectedAddress, setSelectedAddress] = useState<Partial<AddressFormData> | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("WALLET");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [vendorVerificationAcknowledged, setVendorVerificationAcknowledged] = useState(false);
  const [cardPaymentReference, setCardPaymentReference] = useState<string | null>(null);
  const [cardPaymentState, setCardPaymentState] = useState<CardPaymentState>("IDLE");

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    id: string;
    code: string;
    discount: number;
  } | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  const hasServiceItems = useMemo(() => items.some((item) => item.isService), [items]);
  const hasMultipleVendors = useMemo(() => {
    const vendorIds = new Set(items.map((item) => item.vendorId).filter(Boolean));
    return vendorIds.size > 1;
  }, [items]);
  const vendorIds = useMemo(
    () => Array.from(new Set(items.map((item) => item.vendorId).filter(Boolean))),
    [items]
  );
  const vendorCount = Math.max(1, vendorIds.length);
  const deliveryFee = deliveryMethod === "DELIVERY" ? 1500 * vendorCount : 0;
  const voucherDiscount = appliedVoucher?.discount ?? 0;
  const total = totalPrice + deliveryFee - voucherDiscount;
  const vendorStatusKey = useMemo(() => vendorIds.slice().sort().join(","), [vendorIds]);
  const vendorOrderPayload = useMemo(
    () =>
      Array.from(
        items.reduce((map, item) => {
          const key = item.vendorId || "";
          if (!key) return map;

          const existing = map.get(key) || [];
          existing.push({
            productId: item.productId,
            quantity: item.quantity,
            selectedVariants: item.variant ? { value: item.variant } : undefined,
          });
          map.set(key, existing);
          return map;
        }, new Map<string, Array<{ productId: string; quantity: number; selectedVariants?: { value: string } }>>())
      ).map(([groupVendorId, groupItems]) => ({
        vendorId: groupVendorId,
        items: groupItems,
      })),
    [items]
  );

  const fetchVendorStatuses = useMemo(
    () => async (): Promise<Record<string, string | null>> => {
      if (vendorIds.length === 0) {
        return {};
      }

      const entries = await Promise.all(
        vendorIds.map(async (vendorId) => {
          try {
            const res = await fetch(`/api/vendors/${vendorId}`);
            const data = await res.json().catch(() => ({}));
            return [vendorId, (data?.vendor?.status ?? null) as string | null] as const;
          } catch {
            return [vendorId, null] as const;
          }
        })
      );

      return Object.fromEntries(entries);
    },
    [vendorIds]
  );

  const { data: vendorStatuses } = useSmartResource(fetchVendorStatuses, {
    key: `checkout-vendor-status:${vendorStatusKey}`,
    enabled: vendorIds.length > 0,
    refreshIntervalMs: 120_000,
    staleTimeMs: 30_000,
  });

  const primaryVendorId = vendorIds[0];
  const primaryVendorStatus = primaryVendorId ? (vendorStatuses?.[primaryVendorId] ?? null) : null;
  const hasAnyUnverifiedVendor = vendorIds.some((vendorId) => {
    const status = vendorStatuses?.[vendorId];
    return Boolean(status && status !== "APPROVED");
  });
  const hasUnverifiedVendorItems = hasMultipleVendors
    ? hasAnyUnverifiedVendor
    : !!primaryVendorStatus && primaryVendorStatus !== "APPROVED";

  const loadPaymentConfig = useCallback(async (): Promise<{
    paymentsEnabled: boolean;
    gatewayReady: boolean;
  }> => {
    const res = await fetch("/api/payments/config", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || "Unable to load payment processing status");
    }
    return {
      paymentsEnabled: Boolean(data?.paymentsEnabled),
      gatewayReady: Boolean(data?.gatewayReady),
    };
  }, []);

  const { data: paymentConfig } = useSmartResource(loadPaymentConfig, {
    key: "checkout-payment-config",
    refreshIntervalMs: 120_000,
    staleTimeMs: 20_000,
  });

  const loadWalletSummary = useCallback(async (): Promise<CheckoutWalletSummary> => {
    const res = await fetch("/api/wallet", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { availableBalance: null };
    }

    const wallet = data?.wallet;
    if (!wallet || typeof wallet !== "object") {
      return { availableBalance: null };
    }

    const availableBalance =
      typeof wallet.availableBalance === "number"
        ? wallet.availableBalance
        : typeof wallet.balance === "number"
          ? wallet.balance
          : null;

    return { availableBalance };
  }, []);

  const { data: walletSummary } = useSmartResource(loadWalletSummary, {
    key: `checkout-wallet-summary:${user?.id ?? "guest"}`,
    enabled: Boolean(user?.id),
    refreshIntervalMs: 120_000,
    staleTimeMs: 20_000,
  });
  const loadProductsRuntime = useCallback(async () => getProductsClient({ limit: 120 }), []);
  const { data: runtimeProducts } = useSmartResource(loadProductsRuntime, {
    key: "home:products",
    refreshIntervalMs: 120_000,
    staleTimeMs: 20_000,
  });

  const paymentsEnabled = paymentConfig?.paymentsEnabled ?? PLATFORM_DEFAULTS.PAYMENTS_ENABLED;
  const gatewayReady = paymentConfig?.gatewayReady ?? false;
  const cardPaymentsAvailable = paymentsEnabled && gatewayReady;
  const availableWalletBalance = walletSummary?.availableBalance ?? null;
  const hasSufficientWalletBalance =
    typeof availableWalletBalance === "number" ? availableWalletBalance >= total : true;
  const walletBalanceLabel =
    typeof availableWalletBalance === "number"
      ? `Balance: ${formatCurrency(availableWalletBalance)}`
      : "Balance unavailable";

  useEffect(() => {
    if (paymentMethod !== "CARD") {
      setCardPaymentReference(null);
      setCardPaymentState("IDLE");
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (!cardPaymentsAvailable && paymentMethod === "CARD") {
      setPaymentMethod("WALLET");
    }
  }, [cardPaymentsAvailable, paymentMethod]);

  useEffect(() => {
    if (!Array.isArray(runtimeProducts) || runtimeProducts.length === 0 || items.length === 0) {
      return;
    }

    const summary = reconcileWithCatalog(runtimeProducts);
    if (summary.removedCount > 0 || summary.adjustedCount > 0) {
      message.warning(
        "Your cart was updated to match current product availability, stock, and pricing."
      );
    }
  }, [runtimeProducts, items, reconcileWithCatalog]);

  const pickupOptions = [
    { value: "SUNDAY_FIRST", label: "Sunday Service (First)", time: "7:00 AM - 9:30 AM" },
    { value: "SUNDAY_SECOND", label: "Sunday Service (Second)", time: "9:30 AM - 12:00 PM" },
    { value: "MIDWEEK", label: "Midweek Service", time: "Wednesday 6:00 PM - 8:00 PM" },
    { value: "SPECIAL_EVENT", label: "Special Event", time: "As scheduled" },
  ];

  const reconcileCheckoutCartWithLiveDb = useCallback(async (): Promise<boolean> => {
    if (items.length === 0) return false;

    const fetched = await Promise.all(
      items.map(async (item) => {
        try {
          const res = await fetch(`/api/products/${item.productId}`, { cache: "no-store" });
          if (res.status === 404) {
            return { id: item.productId, isActive: false } as const;
          }
          if (!res.ok) {
            return null;
          }
          const data = await res.json().catch(() => ({}));
          if (data?.product && typeof data.product.id === "string") {
            return data.product;
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    const liveCatalog = fetched.filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    if (liveCatalog.length === 0) return false;

    const summary = reconcileWithCatalog(liveCatalog);
    const changed = summary.removedCount > 0 || summary.adjustedCount > 0;
    if (changed) {
      message.warning("Your cart changed just now. Please review the updated checkout and continue.");
    }
    return changed;
  }, [items, reconcileWithCatalog]);

  const handleApplyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      message.error("Please enter a voucher code");
      return;
    }
    if (appliedVoucher?.code === code) {
      message.info("This voucher is already applied");
      return;
    }
    // Clear previous voucher before applying a new one to prevent stacking
    if (appliedVoucher) {
      setAppliedVoucher(null);
    }
    setIsValidatingVoucher(true);
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderTotal: totalPrice + deliveryFee }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as { error?: string }));
        throw new Error((err as { error?: string }).error || "Invalid voucher code");
      }
      const data = await res.json() as { voucher: { id: string; code: string; discount: number } };
      setAppliedVoucher({
        id: data.voucher.id,
        code: data.voucher.code,
        discount: data.voucher.discount,
      });
      message.success(`Voucher applied! Saving ${formatCurrency(data.voucher.discount)}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to validate voucher");
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    message.info("Voucher removed");
  };

  const handleVoucherKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleApplyVoucher();
  };

  const handlePlaceOrder = async () => {
    if (deliveryMethod === "DELIVERY" && !selectedAddress) {
      message.error("Please select or add a delivery address");
      return;
    }

    if (paymentMethod === "WALLET" && !hasSufficientWalletBalance) {
      message.error("Insufficient wallet balance for this order total.");
      return;
    }

    const hasLiveCartChanges = await reconcileCheckoutCartWithLiveDb();
    if (hasLiveCartChanges) {
      return;
    }

    setIsPlacingOrder(true);
    try {
      if (vendorOrderPayload.length === 0) {
        throw new Error("Unable to determine vendor group(s) for this order");
      }

      let paymentReference: string | null = null;
      if (paymentMethod === "CARD") {
        if (!cardPaymentsAvailable) {
          throw new Error(
            mapCheckoutErrorMessage({
              code: "PAYMENT_GATEWAY_UNAVAILABLE",
              error: "Card payment gateway is unavailable.",
            })
          );
        }

        if (!cardPaymentReference) {
          const paymentRes = await fetch("/api/payments/initialize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              gateway: "PAYSTACK",
              amount: total,
              currency: "NGN",
              callbackUrl:
                typeof window !== "undefined" ? `${window.location.origin}/checkout` : undefined,
              metadata: {
                source: "checkout",
                itemCount: items.length,
                vendorCount,
                deliveryMethod,
              },
            }),
          });

          const paymentData = await paymentRes.json().catch(() => ({}));
          if (!paymentRes.ok || !paymentData?.payment?.authorizationUrl) {
            throw new Error(paymentData?.error || "Unable to initialize card payment");
          }

          const initializedReference = String(paymentData.payment.reference);
          setCardPaymentReference(initializedReference);
          setCardPaymentState("INITIALIZED");

          window.open(paymentData.payment.authorizationUrl, "_blank", "noopener,noreferrer");
          message.info(
            `Payment initialized (ref: ${initializedReference}). Complete payment in the opened tab, then click again to verify and place the order.`
          );

          return;
        }

        setCardPaymentState("VERIFYING");
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gateway: "PAYSTACK",
            reference: cardPaymentReference,
          }),
        });
        const verifyData = await verifyRes.json().catch(() => ({}));
        const verification = verifyData?.verification;

        if (!verifyRes.ok || verification?.status !== "SUCCESS") {
          const verificationStatus =
            typeof verification?.status === "string" ? verification.status : undefined;
          setCardPaymentState("INITIALIZED");
          throw new Error(
            mapCheckoutErrorMessage({
              code:
                verificationStatus === "GATEWAY_UNAVAILABLE"
                  ? "PAYMENT_GATEWAY_UNAVAILABLE"
                  : "PAYMENT_VERIFICATION_FAILED",
              error: verifyData?.error,
              verification,
            })
          );
        }

        setCardPaymentState("VERIFIED");
        paymentReference = cardPaymentReference;
      }

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId:
            vendorOrderPayload.length === 1 && vendorOrderPayload[0]
              ? vendorOrderPayload[0].vendorId
              : undefined,
          items:
            vendorOrderPayload.length === 1 && vendorOrderPayload[0]
              ? vendorOrderPayload[0].items
              : undefined,
          vendorOrders: vendorOrderPayload,
          paymentMethod,
          deliveryMethod,
          deliveryAddress: deliveryMethod === "DELIVERY" ? selectedAddress : null,
          pickupDetails:
            deliveryMethod === "PICKUP"
              ? {
                  pickupService,
                }
              : null,
          paymentGateway: paymentMethod === "CARD" ? "PAYSTACK" : undefined,
          paymentReference,
          paymentVerificationReference:
            paymentMethod === "CARD" && paymentReference ? paymentReference : undefined,
          vendorVerificationAcknowledged,
          voucherCode: appliedVoucher?.code,
          voucherDiscount: appliedVoucher?.discount,
        }),
      });
      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) {
        throw new Error(mapCheckoutErrorMessage(orderData));
      }

      if (orderData?.split && Array.isArray(orderData?.orders)) {
        message.success(
          `Checkout complete. ${orderData.orders.length} orders placed successfully.`
        );
      } else {
        message.success("Order placed successfully!");
      }
      setCardPaymentReference(null);
      setCardPaymentState("IDLE");
      clearCart();
      router.push("/orders");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to place order";
      message.error(errorMessage);
      if (paymentMethod === "CARD" && cardPaymentState === "VERIFYING") {
        setCardPaymentState("INITIALIZED");
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="mb-4 text-2xl font-bold text-ds-text-primary sm:text-3xl">Checkout</h1>

      {/* Payment Notice */}
      {!paymentsEnabled && (
        <div className="mb-6 flex items-start gap-3 rounded-ds-md border border-ds-status-info-border bg-ds-status-info-bg p-4">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-ds-status-info" />
          <div>
            <p className="text-sm font-medium text-ds-status-info-text">
              Payment Processing Coming Soon
            </p>
            <p className="mt-1 text-xs text-ds-text-secondary">
              {PLATFORM_DEFAULTS.PAYMENT_NOTICE}
            </p>
          </div>
        </div>
      )}

      {paymentsEnabled && !gatewayReady && (
        <div className="mb-6 flex items-start gap-3 rounded-ds-md border border-ds-status-warning-border bg-ds-status-warning-bg p-4">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-ds-status-warning" />
          <div>
            <p className="text-sm font-medium text-ds-status-warning-text">
              Card payment is temporarily unavailable
            </p>
            <p className="mt-1 text-xs text-ds-text-secondary">
              Wallet checkout is still available while gateway credentials are being finalized.
            </p>
          </div>
        </div>
      )}

      {/* Service Booking Notice */}
      {hasServiceItems && (
        <div className="mb-6 flex items-start gap-3 rounded-ds-md border border-ds-border-brand bg-ds-brand-surface p-4">
          <CalendarClock className="mt-0.5 h-5 w-5 flex-shrink-0 text-ds-text-brand" />
          <div>
            <p className="text-sm font-medium text-ds-text-brand">Service Bookings Included</p>
            <p className="mt-1 text-xs text-ds-text-secondary">
              Your order includes service bookings. The vendor will confirm your booking and reach
              out to coordinate scheduling.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          {hasUnverifiedVendorItems && (
            <Card>
              <div className="rounded-ds-md border border-ds-status-warning/30 bg-ds-status-warning-bg p-4">
                <p className="text-sm font-semibold text-ds-status-warning-text">
                  Some items are from an unverified vendor
                </p>
                <p className="mt-1 text-xs text-ds-text-secondary">
                  You can still proceed, but please acknowledge this vendor verification warning.
                </p>
                <label className="mt-3 flex items-start gap-2 text-sm text-ds-text-primary">
                  <input
                    type="checkbox"
                    checked={vendorVerificationAcknowledged}
                    onChange={(e) => setVendorVerificationAcknowledged(e.target.checked)}
                    className="mt-0.5"
                  />
                  I understand and want to continue with this order.
                </label>
              </div>
            </Card>
          )}
          {/* Order Items */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">
              Order Items ({items.length})
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 border-b border-ds-border-base pb-3 last:border-0"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={60}
                    height={60}
                    className="rounded-ds-md object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ds-text-primary">{item.name}</span>
                      {item.isService && (
                        <span className="rounded-full bg-ds-status-info-bg px-2 py-0.5 text-[10px] font-medium text-ds-status-info-text">
                          Service
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-ds-text-secondary">
                      {item.vendorName} · {item.isService ? "Booking" : `Qty: ${item.quantity}`}
                    </div>
                  </div>
                  <div className="font-semibold text-ds-text-primary">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Delivery Method */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">Delivery Method</h2>
            <Radio.Group
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className="w-full space-y-3"
            >
              <Radio
                value="PICKUP"
                className="flex w-full items-center gap-3 rounded-ds-md border border-ds-border-base p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-ds-text-primary">
                    <Store className="h-5 w-5" />
                    Church Pickup
                  </div>
                  <div className="mt-1 text-sm text-ds-text-secondary">
                    Pick up your order at church service
                  </div>
                </div>
              </Radio>
              <Radio
                value="DELIVERY"
                className="flex w-full items-center gap-3 rounded-ds-md border border-ds-border-base p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-ds-text-primary">
                    <Truck className="h-5 w-5" />
                    Home Delivery
                  </div>
                  <div className="mt-1 text-sm text-ds-text-secondary">
                    Get your order delivered to your address
                  </div>
                </div>
                <div className="font-semibold text-ds-text-brand">
                  +{formatCurrency(deliveryFee)}
                </div>
              </Radio>
            </Radio.Group>

            {deliveryMethod === "PICKUP" && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-ds-text-secondary">
                  Select Pickup Time
                </label>
                <Radio.Group
                  value={pickupService}
                  onChange={(e) => setPickupService(e.target.value)}
                  className="w-full space-y-2"
                >
                  {pickupOptions.map((option) => (
                    <Radio
                      key={option.value}
                      value={option.value}
                      className="flex w-full items-center justify-between rounded-ds-md border border-ds-border-base p-3"
                    >
                      <div>
                        <div className="font-medium text-ds-text-primary">{option.label}</div>
                        <div className="text-sm text-ds-text-secondary">{option.time}</div>
                      </div>
                    </Radio>
                  ))}
                </Radio.Group>
              </div>
            )}

            {deliveryMethod === "DELIVERY" && (
              <div className="mt-4">
                <AddressForm
                  value={selectedAddress || {}}
                  onChange={(address) => {
                    setSelectedAddress(address);
                  }}
                />
              </div>
            )}
          </Card>

          {/* Payment Method */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">Payment Method</h2>
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full space-y-3"
            >
              <Radio
                value="WALLET"
                className="flex w-full items-center gap-3 rounded-ds-md border border-ds-border-base p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-ds-text-primary">
                    <Wallet className="h-5 w-5" />
                    Pay with Wallet
                  </div>
                  <div className="mt-1 text-sm text-ds-text-secondary">{walletBalanceLabel}</div>
                  {!hasSufficientWalletBalance ? (
                    <div className="mt-1 text-xs text-ds-status-warning-text">
                      Wallet balance is below your current order total.
                    </div>
                  ) : null}
                  {typeof availableWalletBalance !== "number" ? (
                    <div className="mt-1 text-xs text-ds-text-tertiary">
                      Wallet summary is still loading or unavailable right now.
                    </div>
                  ) : null}
                </div>
              </Radio>
              <Radio
                value="CARD"
                disabled={!cardPaymentsAvailable}
                className="flex w-full items-center gap-3 rounded-ds-md border border-ds-border-base p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-ds-text-primary">
                    <CreditCard className="h-5 w-5" />
                    Pay with Card
                  </div>
                  <div className="mt-1 text-sm text-ds-text-secondary">
                    {cardPaymentsAvailable ? "Paystack secure payment" : "Temporarily unavailable"}
                  </div>
                </div>
              </Radio>
            </Radio.Group>

            {paymentMethod === "CARD" && cardPaymentReference ? (
              <div className="mt-4 rounded-ds-md border border-ds-status-info-border bg-ds-status-info-bg p-3 text-xs text-ds-status-info-text">
                <p className="font-semibold">Card payment reference: {cardPaymentReference}</p>
                <p className="mt-1">
                  Complete payment in the opened Paystack tab, then click the checkout button again
                  to verify and finalize.
                </p>
                <button
                  type="button"
                  className="mt-2 text-ds-text-brand underline"
                  onClick={() => {
                    setCardPaymentReference(null);
                    setCardPaymentState("IDLE");
                  }}
                >
                  Reinitialize card payment
                </button>
              </div>
            ) : null}
          </Card>

          {/* Voucher / Coupon */}
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-ds-text-primary">
              <Ticket className="h-5 w-5 text-ds-text-brand" />
              Voucher / Coupon
            </h2>
            {appliedVoucher ? (
              <div className="flex items-center justify-between rounded-ds-md border border-ds-status-success-border bg-ds-status-success-bg p-3">
                <div>
                  <p className="text-sm font-medium text-ds-status-success-text">
                    <Tag color="green">{appliedVoucher.code}</Tag> applied
                  </p>
                  <p className="mt-0.5 text-xs text-ds-text-secondary">
                    You save {formatCurrency(appliedVoucher.discount)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="text-xs text-ds-status-error hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  onKeyDown={handleVoucherKeyDown}
                  placeholder="Enter voucher code"
                  className="flex-1 rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-sm text-ds-text-primary placeholder:text-ds-text-placeholder focus:border-ds-brand-primary focus:outline-none"
                  disabled={isValidatingVoucher}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleApplyVoucher()}
                  loading={isValidatingVoucher}
                  disabled={isValidatingVoucher || !voucherCode.trim()}
                >
                  Apply
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 lg:top-24">
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">Order Summary</h2>

            <div className="space-y-3 border-t border-ds-border-base pt-4">
              <div className="flex items-center justify-between text-ds-text-secondary">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-medium">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-ds-text-secondary">
                <span>Delivery Fee</span>
                <span className="font-medium">{formatCurrency(deliveryFee)}</span>
              </div>
              {deliveryMethod === "DELIVERY" && hasMultipleVendors ? (
                <p className="text-[11px] text-ds-text-tertiary">
                  Delivery is applied per vendor package ({vendorCount} vendors).
                </p>
              ) : null}
              {appliedVoucher && (
                <div className="flex items-center justify-between text-ds-status-success-text">
                  <span>Voucher discount</span>
                  <span className="font-medium">-{formatCurrency(voucherDiscount)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-ds-border-base pt-4">
              <div className="flex items-center justify-between text-lg font-bold text-ds-text-primary">
                <span>Total</span>
                <span className="text-ds-text-brand">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              className="mt-6"
              onClick={handlePlaceOrder}
              loading={isPlacingOrder}
              disabled={hasUnverifiedVendorItems && !vendorVerificationAcknowledged}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {paymentMethod === "CARD" && cardPaymentState !== "VERIFIED"
                ? cardPaymentReference
                  ? "Verify Card Payment & Place Order"
                  : "Initialize Card Payment"
                : paymentsEnabled
                  ? "Place Order"
                  : "Place Order (Pay Later)"}
            </Button>

            {!paymentsEnabled && (
              <p className="mt-3 text-center text-[11px] text-ds-text-tertiary">
                Your order will be placed with payment pending. You&apos;ll be notified when payment
                processing is available.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
