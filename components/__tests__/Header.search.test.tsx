import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";

const pushSpy = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: pushSpy }),
}));

vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/store/cartStore", () => ({
  useCart: () => ({
    totalItems: 0,
  }),
}));

vi.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({
    unreadCount: 0,
  }),
}));

vi.mock("@/components/ui", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  ThemeToggle: () => <button type="button">Theme</button>,
}));

describe("Header search integration", () => {
  it("navigates to products search route when form is submitted", () => {
    render(<Header />);

    const input = screen.getByPlaceholderText("Search products and vendors") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "rice" } });
    const form = input.closest("form");
    expect(form).toBeTruthy();
    fireEvent.submit(form!);

    expect(pushSpy).toHaveBeenCalledWith("/products?search=rice");
  });
});
