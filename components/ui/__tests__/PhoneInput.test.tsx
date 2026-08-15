import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PhoneInput } from "@/components/ui/PhoneInput";

describe("PhoneInput", () => {
  it("renders with default country code and value", () => {
    render(<PhoneInput value="+2348012345678" onChange={vi.fn()} />);

    expect(screen.getByText("Nigeria (+234)")).toBeInTheDocument();
    const input = screen.getByPlaceholderText("8123456789") as HTMLInputElement;
    expect(input.value).toBe("8012345678");
  });

  it("calls onChange with combined country code and local number", async () => {
    const onChange = vi.fn();
    render(<PhoneInput value="+2348012345678" onChange={onChange} />);

    const combobox = screen.getByRole("combobox");
    fireEvent.mouseDown(combobox);
    fireEvent.mouseDown(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByTitle("United States (+1)")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("United States (+1)"));

    const input = screen.getByPlaceholderText("8123456789") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1234567890" } });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1] || [];
    const event = lastCall[0] as { target: { value: string } };
    expect(event.target.value).toBe("+11234567890");
  });
});