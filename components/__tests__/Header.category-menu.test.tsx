import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
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

vi.mock("@/components/ui", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  ThemeToggle: () => <button type="button">Theme</button>,
}));

describe("Header category accessibility", () => {
  it("exposes categories in hamburger menu via expandable section", () => {
    render(<Header />);

    fireEvent.click(screen.getByLabelText(/toggle mobile menu/i));
    fireEvent.click(screen.getByRole("button", { name: /browse categories/i }));

    const categoryLinks = screen.getAllByRole("link", { name: /electronics/i });
    expect(categoryLinks.length).toBeGreaterThan(0);
    expect(categoryLinks[0]).toHaveAttribute("href", "/products?category=electronics");
  });
});
