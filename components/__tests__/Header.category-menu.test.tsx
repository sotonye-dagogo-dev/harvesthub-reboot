import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";

const pathnameState = vi.hoisted(() => ({ value: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
  useRouter: () => ({ push: vi.fn() }),
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

describe("Header category accessibility", () => {
  it("exposes categories in hamburger menu via expandable section", () => {
    pathnameState.value = "/";
    render(<Header />);

    fireEvent.click(screen.getByLabelText(/toggle mobile menu/i));
    fireEvent.click(screen.getByRole("button", { name: /browse categories/i }));

    const categoryLinks = screen.getAllByRole("link", { name: /electronics/i });
    expect(categoryLinks.length).toBeGreaterThan(0);
    expect(categoryLinks[0]).toHaveAttribute("href", "/products?category=electronics");
  });

  it("keeps desktop category strip hidden on web view routes", () => {
    pathnameState.value = "/";
    render(<Header />);

    expect(screen.queryByRole("button", { name: /all categories/i })).not.toBeInTheDocument();
  });
});
