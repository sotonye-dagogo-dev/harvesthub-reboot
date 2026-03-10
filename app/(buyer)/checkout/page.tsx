"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/store/cartStore";
import { Button, Card } from "@/components/ui";
import { AddressForm } from "@/components/features";
import { formatCurrency } from "@/lib/utils";
import { Radio, message } from "antd";
import { Store, Wallet, CreditCard, Truck, CheckCircle, Info, CalendarClock } from "lucide-react";
import Image from "next/image";
import { PLATFORM_DEFAULTS } from "@/lib/constants";
import type { AddressFormData } from "@/lib/types";

export const dynamic = "force-dynamic";

type DeliveryMethod = "PICKUP" | "DELIVERY";
type PaymentMethod = "WALLET" | "CARD";
type PickupService = "SUNDAY_FIRST" | "SUNDAY_SECOND" | "MIDWEEK" | "SPECIAL_EVENT";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP");
  const [pickupService, setPickupService] = useState<PickupService>("SUNDAY_FIRST");
  const [selectedAddress, setSelectedAddress] = useState<Partial<AddressFormData> | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("WALLET");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const deliveryFee = deliveryMethod === "DELIVERY" ? 1500 : 0;
  const total = totalPrice + deliveryFee;

  const hasServiceItems = useMemo(
    () => items.some((item) => item.isService),
    [items]
  );

  const pickupOptions = [
    { value: "SUNDAY_FIRST", label: "Sunday Service (First)", time: "7:00 AM - 9:30 AM" },
    { value: "SUNDAY_SECOND", label: "Sunday Service (Second)", time: "9:30 AM - 12:00 PM" },
    { value: "MIDWEEK", label: "Midweek Service", time: "Wednesday 6:00 PM - 8:00 PM" },
    { value: "SPECIAL_EVENT", label: "Special Event", time: "As scheduled" },
  ];

  const handlePlaceOrder = async () => {
    if (deliveryMethod === "DELIVERY" && !selectedAddress) {
      message.error("Please select or add a delivery address");
      return;
    }

    setIsPlacingOrder(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    message.success("Order placed successfully!");
    clearCart();
    router.push("/orders");
  };

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold text-ds-text-primary">Checkout</h1>

      {/* Payment Notice */}
      {!PLATFORM_DEFAULTS.PAYMENTS_ENABLED && (
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

      {/* Service Booking Notice */}
      {hasServiceItems && (
        <div className="mb-6 flex items-start gap-3 rounded-ds-md border border-ds-brand-primary/30 bg-ds-brand-primary/5 p-4">
          <CalendarClock className="mt-0.5 h-5 w-5 flex-shrink-0 text-ds-text-brand" />
          <div>
            <p className="text-sm font-medium text-ds-text-brand">
              Service Bookings Included
            </p>
            <p className="mt-1 text-xs text-ds-text-secondary">
              Your order includes service bookings. The vendor will confirm your booking and reach out to coordinate scheduling.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
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
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">
              Delivery Method
            </h2>
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
                <div className="font-semibold text-ds-text-brand">+{formatCurrency(deliveryFee)}</div>
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
                        <div className="font-medium text-ds-text-primary">
                          {option.label}
                        </div>
                        <div className="text-sm text-ds-text-secondary">
                          {option.time}
                        </div>
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
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">
              Payment Method
            </h2>
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
                  <div className="mt-1 text-sm text-ds-text-secondary">
                    Balance: {formatCurrency(50000)}
                  </div>
                </div>
              </Radio>
              <Radio
                value="CARD"
                className="flex w-full items-center gap-3 rounded-ds-md border border-ds-border-base p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-ds-text-primary">
                    <CreditCard className="h-5 w-5" />
                    Pay with Card
                  </div>
                  <div className="mt-1 text-sm text-ds-text-secondary">
                    Paystack secure payment
                  </div>
                </div>
              </Radio>
            </Radio.Group>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">
              Order Summary
            </h2>

            <div className="space-y-3 border-t border-ds-border-base pt-4">
              <div className="flex items-center justify-between text-ds-text-secondary">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-medium">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-ds-text-secondary">
                <span>Delivery Fee</span>
                <span className="font-medium">{formatCurrency(deliveryFee)}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-ds-border-base pt-4">
              <div className="flex items-center justify-between text-lg font-bold text-ds-text-primary">
                <span>Total</span>
                <span className="text-ds-text-brand">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              className="mt-6"
              onClick={handlePlaceOrder}
              loading={isPlacingOrder}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {PLATFORM_DEFAULTS.PAYMENTS_ENABLED ? "Place Order" : "Place Order (Pay Later)"}
            </Button>

            {!PLATFORM_DEFAULTS.PAYMENTS_ENABLED && (
              <p className="mt-3 text-center text-[11px] text-ds-text-tertiary">
                Your order will be placed with payment pending. You&apos;ll be notified when payment processing is available.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
