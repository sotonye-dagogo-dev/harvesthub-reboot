"use client";

import {
  ArrowRightOutlined,
  ShoppingFilled,
  ShopOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { UserType, FormComponentProps } from "@/app/types";

interface UserOption {
  name: UserType;
  description: string;
  icon: "individual" | "store";
}

const options: UserOption[] = [
  {
    name: "individual",
    description: "Wish to buy various products.",
    icon: "individual",
  },
  {
    name: "store",
    description: "Own a store and wish to sell products.",
    icon: "store",
  },
];

export default function UserSelect({
  onNext,
  updateFormData,
  formData,
}: FormComponentProps) {
  const [selectedType, setSelectedType] = useState<UserType | null>(
    (formData?.userType as UserType) || null
  );

  const handleSelect = (option: UserType): void => {
    setSelectedType(option);
    updateFormData({ userType: option });
    onNext();
  };

  return (
    <div className="w-full flex flex-col justify-between items-center gap-6">
      <h3 className="text-[24px] leading-[26.4px] text-center">
        Choose Account Type
      </h3>
      <p className="text-sm text-gray-400 text-center mb-4">
        Select the type of account you want to create
      </p>

      {options.map((option) => (
        <div
          key={option.name}
          className={`capitalize w-full flex justify-between items-center p-6 rounded-xl border ${
            selectedType === option.name
              ? "border-primary-100 bg-orange-50"
              : "border-gray-100 hover:border-blue-500 hover:bg-blue-50"
          } cursor-pointer transition-colors duration-150`}
          onClick={() => handleSelect(option.name)}>
          <div className="flex gap-3 items-center">
            <div
              className={`border rounded-full p-5 box-border leading-none transition-colors duration-150 ${
                selectedType === option.name
                  ? "border-primary-100 bg-primary-100 text-white"
                  : "border-blue-500 hover:bg-blue-500 hover:text-white"
              }`}>
              {option.icon === "individual" ? (
                <ShoppingFilled />
              ) : (
                <ShopOutlined />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <h6 className="font-semibold">{option.name}</h6>
              <p className="text-xs text-gray-400 normal-case">
                {option.description}
              </p>
            </div>
          </div>
          <ArrowRightOutlined
            className={selectedType === option.name ? "text-primary-100" : ""}
          />
        </div>
      ))}
    </div>
  );
}
