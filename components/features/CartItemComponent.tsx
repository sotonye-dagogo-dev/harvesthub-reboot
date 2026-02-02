"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface CartItemProps {
  id: string;
  name: string;
  price: number;
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
    <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="relative w-24 h-24 flex-shrink-0">
        <Image src={image} alt={name} fill className="object-cover rounded-md" />
      </div>

      <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-white">{name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{vendorName}</p>
        <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-2">
          ₦{price.toLocaleString()}
        </p>
      </div>

      <div className="flex flex-col items-end justify-between">
        <button
          onClick={() => onRemove(id)}
          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
          aria-label="Remove item"
        >
          <Trash2 size={20} />
        </button>

        <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg">
          <button
            onClick={handleDecrease}
            disabled={quantity <= 1}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>
          <span className="min-w-[40px] text-center font-medium">{quantity}</span>
          <button
            onClick={handleIncrease}
            disabled={quantity >= stock}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
