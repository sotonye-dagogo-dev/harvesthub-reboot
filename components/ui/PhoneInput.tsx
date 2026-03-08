import { forwardRef } from "react";
import { Input, InputProps } from "./Input";

export interface PhoneInputProps extends Omit<InputProps, "prefix" | "type"> {
  defaultCountryCode?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ defaultCountryCode = "+234", className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="tel"
        prefix={
          <span className="text-sm font-medium text-ds-text-secondary">{defaultCountryCode}</span>
        }
        placeholder="8012345678"
        className={className}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
