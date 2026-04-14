import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      role: "BUYER",
      firstName: "Ada",
    },
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/store/cartStore", () => ({
  useCart: () => ({
    totalItems: 2,
  }),
}));

vi.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({
    unreadCount: 6,
  }),
}));

vi.mock("@/components/ui", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  ThemeToggle: () => <button type="button">Theme</button>,
}));

describe("Header notification badges", () => {
  it("shows notifications link with unread count for authenticated users", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getAllByText("6").length).toBeGreaterThan(0);
  });
});
