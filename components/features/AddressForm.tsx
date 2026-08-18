"use client";

import { Input, PhoneInput } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CAMPUS_LOCATIONS, Campus } from "@/lib/constants";

export interface AddressFormData {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  campus?: Campus;
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
        <label className="mb-1 block text-sm font-medium text-ds-text-secondary">
          Street Address <span className="text-ds-status-error">*</span>
        </label>
        <textarea
          value={value.address || ""}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="Enter your street address"
          rows={3}
          className={cn(
            "w-full rounded-ds-md border px-3 py-2 text-ds-text-primary placeholder-ds-text-placeholder focus:outline-none focus:ring-2 dark:text-ds-text-primary dark:placeholder-ds-text-placeholder",
            errors.address
              ? "border-ds-status-error focus:border-ds-status-error focus:ring-ds-status-error/20"
              : "border-ds-border-base focus:border-ds-border-focus focus:ring-ds-focus-ring/20  dark:focus:border-ds-brand-accent"
          )}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-ds-status-error-text">{errors.address}</p>
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
        <label className="mb-1 block text-sm font-medium text-ds-text-secondary">
          State <span className="text-ds-status-error">*</span>
        </label>
        <select
          value={value.state || ""}
          onChange={(e) => onChange({ ...value, state: e.target.value })}
          aria-label="Select state"
          className={cn(
            "w-full rounded-ds-md border px-3 py-2 text-ds-text-primary focus:outline-none focus:ring-2 dark:bg-ds-surface-base dark:text-ds-text-primary",
            errors.state
              ? "border-ds-status-error focus:border-ds-status-error focus:ring-ds-status-error/20"
              : "border-ds-border-base focus:border-ds-border-focus focus:ring-ds-focus-ring/20  dark:focus:border-ds-brand-accent"
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
          <p className="mt-1 text-sm text-ds-status-error-text">{errors.state}</p>
        )}
      </div>

      {/* Campus (Optional) */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ds-text-secondary">
          Campus / Pickup Location
        </label>
        <select
          value={value.campus || ""}
          onChange={(e) => onChange({ ...value, campus: e.target.value as Campus })}
          aria-label="Select campus"
          className={cn(
            "w-full rounded-ds-md border px-3 py-2 text-ds-text-primary focus:outline-none focus:ring-2 dark:bg-ds-surface-base dark:text-ds-text-primary",
            "border-ds-border-base focus:border-ds-border-focus focus:ring-ds-focus-ring/20 dark:focus:border-ds-brand-accent"
          )}
        >
          <option value="">Select campus (optional)</option>
          {CAMPUS_LOCATIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
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
          className="h-4 w-4 rounded-ds-xs border-ds-border-base text-ds-text-brand focus:ring-2 focus:ring-ds-focus-ring/20"
        />
        <label htmlFor="isDefault" className="text-sm text-ds-text-secondary">
          Set as default address
        </label>
      </div>
    </div>
  );
}
