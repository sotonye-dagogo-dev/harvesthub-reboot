"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Popconfirm } from "antd";

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  quantity: number;
  image: string;
  vendorName: string;
  stock: number;
  variant?: string;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemComponent({
  id,
  name,
  price,
  originalPrice,
  discountPercent,
  quantity,
  image,
  vendorName,
  stock,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const handleDecrease = () => {
    if (quantity > 1) {
      onUpdateQuantity(id, quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < stock) {
      onUpdateQuantity(id, quantity + 1);
    }
  };

  return (
    <div className="flex gap-4 p-4 bg-ds-surface-base rounded-ds-md border border-ds-border-base">
      <div className="relative w-24 h-24 flex-shrink-0">
        <Image src={image} alt={name} fill className="object-cover rounded-ds-sm" />
      </div>

      <div className="flex-1">
        <h3 className="font-medium text-ds-text-primary">{name}</h3>
        <p className="text-sm text-ds-text-secondary">{vendorName}</p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-lg font-semibold text-ds-text-brand">{formatCurrency(price)}</p>
          {typeof originalPrice === "number" && originalPrice > price ? (
            <>
              <p className="text-sm text-ds-text-tertiary line-through">{formatCurrency(originalPrice)}</p>
              {typeof discountPercent === "number" && discountPercent > 0 ? (
                <span className="rounded-ds-full bg-ds-status-success-bg px-2 py-0.5 text-xs font-medium text-ds-status-success-text">
                  -{discountPercent}%
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-end justify-between">
        <Popconfirm
          title="Remove cart item"
          description="Remove this item from your cart?"
          okText="Remove"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          onConfirm={() => onRemove(id)}
        >
          <button
            type="button"
            className="text-ds-text-placeholder hover:text-ds-status-error dark:hover:text-ds-status-error"
            aria-label="Remove item"
          >
            <Trash2 size={20} />
          </button>
        </Popconfirm>

        <div className="flex items-center gap-2 border border-ds-border-base rounded-ds-md">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={quantity <= 1}
            className="p-2 hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-overlay disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>
          <span className="min-w-[40px] text-center font-medium">{quantity}</span>
          <button
            type="button"
            onClick={handleIncrease}
            disabled={quantity >= stock}
            className="p-2 hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-overlay disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
