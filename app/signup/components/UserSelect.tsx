"use client";

import { useState } from "react";
import { UserType, FormComponentProps } from "@/app/types";
import { ShoppingBag, Store } from "lucide-react";

interface UserOption {
  name: UserType;
  title: string;
  description: string;
  icon: "buyer" | "vendor";
  features: string[];
}

const options: UserOption[] = [
  {
    name: "buyer",
    title: "Buyer Account",
    description: "Shop from trusted vendors and enjoy flexible delivery options",
    icon: "buyer",
    features: ["Browse products", "Secure payments", "Church pickup or delivery", "Wallet system"],
  },
  {
    name: "vendor",
    title: "Vendor Account",
    description: "Set up your store and reach thousands of buyers",
    icon: "vendor",
    features: [
      "Manage products",
      "Track orders",
      "Analytics dashboard",
      "Multiple delivery options",
    ],
  },
];

export default function UserSelect({ onNext, updateFormData, formData }: FormComponentProps) {
  const [selectedType, setSelectedType] = useState<UserType | null>(
    (formData?.userType as UserType) || null
  );

  const handleSelect = (option: UserType): void => {
    setSelectedType(option);
    updateFormData({ userType: option });
    onNext();
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Join HarvestHub</h1>
        <p className="text-gray-600 dark:text-gray-400">Choose how you want to use HarvestHub</p>
      </div>

      {/* Account Type Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedType === option.name;
          const IconComponent = option.icon === "buyer" ? ShoppingBag : Store;

          return (
            <button
              key={option.name}
              onClick={() => handleSelect(option.name)}
              className={`group relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all ${
                isSelected
                  ? "border-purple-600 bg-purple-50 dark:border-purple-500 dark:bg-purple-900/20"
                  : "border-gray-200 bg-white hover:border-purple-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-700"
              }`}
            >
              {/* Icon */}
              <div
                className={`mb-4 inline-flex rounded-lg p-3 transition-colors ${
                  isSelected
                    ? "bg-purple-600 text-white"
                    : "bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-900/30 dark:text-purple-400"
                }`}
              >
                <IconComponent className="h-6 w-6" />
              </div>

              {/* Title */}
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                {option.title}
              </h3>

              {/* Description */}
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{option.description}</p>

              {/* Features */}
              <ul className="space-y-2">
                {option.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600"></span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute right-4 top-4 rounded-full bg-purple-600 p-1">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Additional Info */}
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
        >
          Sign in here
        </a>
      </p>
    </div>
  );
}
