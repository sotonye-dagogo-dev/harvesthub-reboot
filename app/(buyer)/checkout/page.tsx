"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/store/cartStore";
import { Button, Card } from "@/components/ui";
import { AddressForm } from "@/components/features";
import { formatCurrency } from "@/lib/utils";
import { Radio, message } from "antd";
import { Store, Wallet, CreditCard, Truck, CheckCircle } from "lucide-react";
import Image from "next/image";
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
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Order Items ({items.length})
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 border-b border-gray-200 pb-3 last:border-0 dark:border-gray-800"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={60}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {item.vendorName} · Qty: {item.quantity}
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Delivery Method */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Delivery Method
            </h2>
            <Radio.Group
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className="w-full space-y-3"
            >
              <Radio
                value="PICKUP"
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                    <Store className="h-5 w-5" />
                    Church Pickup
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Pick up your order at church service
                  </div>
                </div>
              </Radio>
              <Radio
                value="DELIVERY"
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                    <Truck className="h-5 w-5" />
                    Home Delivery
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Get your order delivered to your address
                  </div>
                </div>
                <div className="font-semibold text-purple-600">+{formatCurrency(deliveryFee)}</div>
              </Radio>
            </Radio.Group>

            {deliveryMethod === "PICKUP" && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
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
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Payment Method
            </h2>
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full space-y-3"
            >
              <Radio
                value="WALLET"
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                    <Wallet className="h-5 w-5" />
                    Pay with Wallet
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Balance: {formatCurrency(50000)}
                  </div>
                </div>
              </Radio>
              <Radio
                value="CARD"
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                    <CreditCard className="h-5 w-5" />
                    Pay with Card
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Order Summary
            </h2>

            <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-medium">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                <span>Delivery Fee</span>
                <span className="font-medium">{formatCurrency(deliveryFee)}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
              <div className="flex items-center justify-between text-lg font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span className="text-purple-600 dark:text-purple-400">
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
              Place Order
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
