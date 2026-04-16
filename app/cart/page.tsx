"use client";

import { useCallback, useEffect } from "react";
import { useCart } from "@/lib/store/cartStore";
import { EmptyState, Button, Card } from "@/components/ui";
import { CartItemComponent } from "@/components/features";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Popconfirm, message } from "antd";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { getProductsClient } from "@/lib/data/clientDataFetchers";

export const dynamic = "force-dynamic";

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart, reconcileWithCatalog } =
    useCart();

  const loadProducts = useCallback(async () => getProductsClient({ limit: 120 }), []);
  const { data: runtimeProducts } = useSmartResource(loadProducts, {
    key: "home:products",
    staleTimeMs: 20_000,
    refreshIntervalMs: 120_000,
  });

  useEffect(() => {
    if (!Array.isArray(runtimeProducts) || runtimeProducts.length === 0 || items.length === 0) {
      return;
    }

    const summary = reconcileWithCatalog(runtimeProducts);
    if (summary.removedCount > 0 || summary.adjustedCount > 0) {
      message.warning(
        "Your cart was updated to reflect latest product availability, stock, and pricing."
      );
    }
  }, [runtimeProducts, items, reconcileWithCatalog]);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          icon={<ShoppingBag className="w-16 h-16" />}
          title="Your cart is empty"
          description="Add some products to get started"
          action={
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-ds-text-primary sm:text-3xl">
          Shopping Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
        </h1>
        <Popconfirm
          title="Remove all cart items"
          description="Remove all items from your cart?"
          okText="Remove all"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          onConfirm={clearCart}
        >
          <Button type="button" variant="outline">
            Clear Cart
          </Button>
        </Popconfirm>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Cart Items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <CartItemComponent
              key={item.productId}
              id={item.productId}
              name={item.name}
              price={item.price}
              image={item.image}
              vendorName={item.vendorName}
              quantity={item.quantity}
              stock={item.stock}
              onUpdateQuantity={(_, qty) => updateQuantity(item.productId, qty)}
              onRemove={() => removeItem(item.productId)}
            />
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 lg:top-24">
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">Order Summary</h2>

            <div className="space-y-3 border-t border-ds-border-base pt-4">
              <div className="flex items-center justify-between text-ds-text-secondary">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-medium">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-ds-text-secondary">
                <span>Delivery Fee</span>
                <span className="text-sm text-ds-text-tertiary">Calculated at checkout</span>
              </div>
            </div>

            <div className="mt-4 border-t border-ds-border-base pt-4">
              <div className="flex items-center justify-between text-lg font-bold text-ds-text-primary">
                <span>Total</span>
                <span className="text-ds-text-brand">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <Link href="/checkout" className="mt-6 block">
              <Button fullWidth size="lg">
                Proceed to Checkout
              </Button>
            </Link>

            <Link href="/" className="mt-3 block">
              <Button fullWidth variant="outline">
                Continue Shopping
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
