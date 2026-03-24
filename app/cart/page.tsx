"use client";

import { useCart } from "@/lib/store/cartStore";
import { EmptyState, Button, Card } from "@/components/ui";
import { CartItemComponent } from "@/components/features";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ds-text-primary">
          Shopping Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
        </h1>
        <Button variant="outline" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
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
          <Card className="sticky top-24">
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">
              Order Summary
            </h2>

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
                <span className="text-ds-text-brand">
                  {formatCurrency(totalPrice)}
                </span>
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
