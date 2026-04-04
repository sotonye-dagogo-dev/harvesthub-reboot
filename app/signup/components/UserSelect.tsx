"use client";

import { useState } from "react";
import Link from "next/link";
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
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-ds-text-primary sm:text-4xl">Create your account</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ds-text-secondary">
          Pick your role and continue through the guided setup. You can always adjust your
          preferences later.
        </p>
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
              className={`group relative overflow-hidden rounded-ds-lg border-2 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring focus-visible:ring-offset-2 sm:p-6 ${isSelected ? "border-ds-border-brand bg-ds-brand-surface ring-1 ring-ds-focus-ring/30 dark:border-ds-border-focus dark:bg-ds-brand-subtle" : "border-ds-border-base bg-ds-surface-base hover:border-ds-brand-muted"}`}
            >
              {/* Icon */}
              <div
                className={`mb-4 inline-flex rounded-ds-md p-3 transition-colors ${isSelected ? "bg-ds-brand-primary text-ds-text-inverse" : "bg-ds-brand-subtle text-ds-text-brand group-hover:bg-ds-brand-primary group-hover:text-ds-text-inverse"}`}
              >
                <IconComponent className="h-6 w-6" />
              </div>
              {/* Title */}
              <h3 className="mb-2 text-xl font-bold text-ds-text-primary">{option.title}</h3>
              {/* Description */}
              <p className="mb-4 text-sm text-ds-text-secondary">{option.description}</p>
              {/* Features */}
              <ul className="space-y-2">
                {option.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-ds-text-secondary">
                    <span className="h-1.5 w-1.5 rounded-ds-full bg-ds-brand-primary"></span>
                    {feature}
                  </li>
                ))}
              </ul>
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute right-4 top-4 rounded-ds-full bg-ds-brand-primary p-1">
                  <svg
                    className="h-4 w-4 text-ds-text-inverse"
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
      <p className="mt-6 text-center text-sm text-ds-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-ds-text-brand hover:text-ds-palette-purple-700"
        >
          Sign in here
        </Link>
      </p>
    </div>
  );
}
