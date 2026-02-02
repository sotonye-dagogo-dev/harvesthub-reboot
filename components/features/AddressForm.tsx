"use client";

import { Input, PhoneInput } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface AddressFormData {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface AddressFormProps {
  value: Partial<AddressFormData>;
  onChange: (value: Partial<AddressFormData>) => void;
  errors?: Partial<Record<keyof AddressFormData, string>>;
  className?: string;
}

export function AddressForm({ value, onChange, errors = {}, className }: AddressFormProps) {
  const handleChange =
    (field: keyof AddressFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [field]: e.target.value });
    };

  const handleCheckboxChange =
    (field: keyof AddressFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [field]: e.target.checked });
    };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Full Name */}
      <Input
        label="Full Name"
        value={value.fullName || ""}
        onChange={handleChange("fullName")}
        error={errors.fullName}
        placeholder="Enter your full name"
        required
      />

      {/* Phone Number */}
      <PhoneInput
        label="Phone Number"
        value={value.phone || ""}
        onChange={handleChange("phone")}
        error={errors.phone}
        placeholder="Enter your phone number"
        required
      />

      {/* Address */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Street Address <span className="text-red-500">*</span>
        </label>
        <textarea
          value={value.address || ""}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="Enter your street address"
          rows={3}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 dark:text-white dark:placeholder-gray-400",
            errors.address
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 dark:border-gray-700 dark:focus:border-purple-400"
          )}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address}</p>
        )}
      </div>

      {/* City */}
      <Input
        label="City"
        value={value.city || ""}
        onChange={handleChange("city")}
        error={errors.city}
        placeholder="Enter city"
        required
      />

      {/* State */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          State <span className="text-red-500">*</span>
        </label>
        <select
          value={value.state || ""}
          onChange={(e) => onChange({ ...value, state: e.target.value })}
          aria-label="Select state"
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-white",
            errors.state
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 dark:border-gray-700 dark:focus:border-purple-400"
          )}
        >
          <option value="">Select State</option>
          <option value="Lagos">Lagos</option>
          <option value="Abuja">Abuja</option>
          <option value="Ogun">Ogun</option>
          <option value="Oyo">Oyo</option>
          <option value="Rivers">Rivers</option>
          <option value="Kano">Kano</option>
          <option value="Delta">Delta</option>
          <option value="Edo">Edo</option>
          <option value="Anambra">Anambra</option>
          <option value="Enugu">Enugu</option>
          <option value="Other">Other</option>
        </select>
        {errors.state && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.state}</p>
        )}
      </div>

      {/* Landmark (Optional) */}
      <Input
        label="Landmark (Optional)"
        value={value.landmark || ""}
        onChange={handleChange("landmark")}
        error={errors.landmark}
        placeholder="Enter nearby landmark"
      />

      {/* Set as Default */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={value.isDefault || false}
          onChange={handleCheckboxChange("isDefault")}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700"
        />
        <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">
          Set as default address
        </label>
      </div>
    </div>
  );
}
