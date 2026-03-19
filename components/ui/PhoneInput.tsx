"use client";

import { forwardRef, useEffect, useMemo, useState, useCallback } from "react";
import { Input, InputProps } from "./Input";
import { Select } from "antd";
import { cn } from "@/lib/utils";

export interface PhoneInputProps extends Omit<InputProps, "prefix" | "type"> {
  defaultCountryCode?: string;
  countryCodes?: Array<{ label: string; value: string }>;
}

const DEFAULT_COUNTRY_CODES = [
  { label: "Nigeria (+234)", value: "+234" },
  { label: "United Kingdom (+44)", value: "+44" },
  { label: "United States (+1)", value: "+1" },
];

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      defaultCountryCode = "+234",
      countryCodes = DEFAULT_COUNTRY_CODES,
      value,
      onChange,
      className,
      ...props
    },
    ref
  ) => {
    const [countryCode, setCountryCode] = useState(defaultCountryCode);
    const [localValue, setLocalValue] = useState("");

    // When the controlled value changes, split it into code + local number
    useEffect(() => {
      if (typeof value === "string" && value.length > 0) {
        const matched = countryCodes.find((c) => value.startsWith(c.value));
        if (matched) {
          setCountryCode(matched.value);
          setLocalValue(value.slice(matched.value.length));
          return;
        }
      }
      // Default to current country code
      setLocalValue(typeof value === "string" ? value.replace(defaultCountryCode, "") : "");
    }, [value, countryCodes, defaultCountryCode]);

    const emitValue = useCallback(
      (combined: string) => {
        if (!onChange) return;
        const syntheticEvent = {
          target: { value: combined },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      },
      [onChange]
    );

    const handleCountryChange = useCallback(
      (newCode: string) => {
        setCountryCode(newCode);
        const combined = `${newCode}${localValue}`;
        emitValue(combined);
      },
      [emitValue, localValue] // depends on localValue
    );

    const handleLocalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(event.target.value);
      const combined = `${countryCode}${event.target.value}`;
      emitValue(combined);
    };

    const select = useMemo(
      () => (
        <Select
          className="w-24"
          value={countryCode}
          onChange={handleCountryChange}
          options={countryCodes}
          dropdownMatchSelectWidth={false}
          aria-label="Country code"
        />
      ),
      [countryCode, countryCodes, handleCountryChange]
    );

    return (
      <div className={cn("flex items-center gap-2", className)}>
        {select}
        <Input
          ref={ref}
          type="tel"
          value={localValue}
          onChange={handleLocalChange}
          placeholder="8123456789"
          className="flex-1"
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
