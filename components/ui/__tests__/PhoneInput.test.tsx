import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PhoneInput } from "@/components/ui/PhoneInput";

describe("PhoneInput", () => {
  it("renders with default country code and value", () => {
    render(<PhoneInput value="+2348012345678" onChange={vi.fn()} />);

    const select = screen.getByLabelText("Country code") as HTMLSelectElement;
    const input = screen.getByPlaceholderText("8012345678") as HTMLInputElement;

    expect(select.value).toBe("+234");
    expect(input.value).toBe("8012345678");
  });

  it("calls onChange with combined country code and local number", () => {
    const onChange = vi.fn();
    render(<PhoneInput value="+2348012345678" onChange={onChange} />);

    const select = screen.getByLabelText("Country code") as HTMLSelectElement;
    const input = screen.getByPlaceholderText("8012345678") as HTMLInputElement;

    fireEvent.change(select, { target: { value: "+1" } });
    fireEvent.change(input, { target: { value: "1234567890" } });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1] || [];
    const event = lastCall[0] as { target: { value: string } };
    expect(event.target.value).toBe("+11234567890");
  });
});
