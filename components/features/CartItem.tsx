"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

export interface CartItemProps {
  id: string;
  name: string;
  price: number;
  image: string;
  vendorName: string;
  quantity: number;
  stock: number;
  variant?: string;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  className?: string;
}

export function CartItem({
  name,
  price,
  image,
  vendorName,
  quantity,
  stock,
  variant,
  onUpdateQuantity,
  onRemove,
  className,
}: CartItemProps) {
  const handleDecrease = () => {
    if (quantity > 1) {
      onUpdateQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < stock) {
      onUpdateQuantity(quantity + 1);
    }
  };

  const subtotal = price * quantity;

  return (
    <div
      className={cn(
        "flex gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      {/* Product Image */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
        <Image src={image} alt={name} fill className="object-cover" sizes="96px" />
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{vendorName}</p>
              {variant && <p className="text-sm text-gray-600 dark:text-gray-400">{variant}</p>}
            </div>
            <button
              onClick={onRemove}
              className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"
              aria-label="Remove item"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDecrease}
              disabled={quantity <= 1}
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center font-medium text-gray-900 dark:text-white">
              {quantity}
            </span>
            <Button
              onClick={handleIncrease}
              disabled={quantity >= stock}
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(subtotal)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(price)} each</p>
          </div>
        </div>

        {/* Stock Warning */}
        {stock < 5 && stock > 0 && (
          <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
            Only {stock} left in stock
          </p>
        )}
        {stock === 0 && <p className="mt-1 text-sm text-red-600 dark:text-red-400">Out of stock</p>}
      </div>
    </div>
  );
}
