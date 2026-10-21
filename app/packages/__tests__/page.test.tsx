import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { App as AntApp } from "antd";
import PackagesPage from "@/app/packages/page";
import { clearSmartResourceCache } from "@/lib/hooks/useSmartResource";

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const enabledPackagesPayload = {
  success: true,
  subscriptionsEnabled: true,
  enforcementLevel: "WARN",
  packages: [
    {
      id: "pkg-1",
      name: "Starter Store",
      slug: "starter-store",
      description: "Everything needed to start selling.",
      price: 2500,
      durationDays: 30,
      features: ["List up to 20 products"],
      sortOrder: 1,
    },
    {
      id: "pkg-2",
      name: "Growth Store",
      slug: "growth-store",
      description: "For vendors ready to scale.",
      price: 7500,
      durationDays: 90,
      features: [],
      sortOrder: 2,
    },
  ],
};

const disabledPackagesPayload = {
  success: true,
  subscriptionsEnabled: false,
  enforcementLevel: "NONE",
  packages: [],
};

const noSubscriptionPayload = {
  success: true,
  summary: {
    enabled: true,
    enforcementLevel: "WARN",
    status: "NONE",
    subscription: null,
    daysRemaining: null,
    expiringSoon: false,
    blocked: false,
  },
  history: [],
  walletBalance: 5000,
  walletActive: true,
};

const paymentsConfigPayload = {
  success: true,
  paystackPublicKey: null,
  inlinePopupEnabled: false,
  paymentsEnabled: false,
  gatewayReady: false,
};

let packagesPayload: Record<string, unknown> = enabledPackagesPayload;
let subscriptionsPayload: Record<string, unknown> = noSubscriptionPayload;

function jsonResponse(payload: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    json: async () => payload,
  } as unknown as Response;
}

function renderPage() {
  return render(
    <AntApp>
      <PackagesPage />
    </AntApp>
  );
}

describe("PackagesPage smoke tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSmartResourceCache();
    packagesPayload = enabledPackagesPayload;
    subscriptionsPayload = noSubscriptionPayload;

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/subscription-packages")) {
        return Promise.resolve(jsonResponse(packagesPayload));
      }
      if (url.includes("/api/payments/config")) {
        return Promise.resolve(jsonResponse(paymentsConfigPayload));
      }
      if (url.includes("/api/subscriptions")) {
        return Promise.resolve(jsonResponse(subscriptionsPayload));
      }
      return Promise.resolve(jsonResponse({ success: false, error: "Not found" }, false));
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    useAuthMock.mockReturnValue({ user: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows packages and sign-in CTAs to guests", async () => {
    useAuthMock.mockReturnValue({ user: null });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Starter Store")).toBeInTheDocument();
    });
    expect(screen.getByText("Growth Store")).toBeInTheDocument();

    const signInLinks = screen.getAllByRole("link", { name: "Sign in to subscribe" });
    expect(signInLinks).toHaveLength(2);
    expect(signInLinks[0]).toHaveAttribute(
      "href",
      "/login?from=%2Fpackages%3Fselected%3Dstarter-store"
    );
  });

  it("renders the disabled EmptyState when subscriptions are turned off", async () => {
    packagesPayload = disabledPackagesPayload;
    useAuthMock.mockReturnValue({ user: null });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("Subscription packages are not currently offered")
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("The platform currently has packages turned off — check back soon.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Starter Store")).not.toBeInTheDocument();
  });

  it("offers Subscribe to a vendor without an active subscription", async () => {
    useAuthMock.mockReturnValue({
      user: {
        id: "vendor-1",
        email: "vendor@example.com",
        firstName: "Vera",
        lastName: "Vendor",
        role: "VENDOR",
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Subscribe" })).toHaveLength(2);
    });
    for (const button of screen.getAllByRole("button", { name: "Subscribe" })) {
      expect(button).toBeEnabled();
    }
    expect(screen.queryByRole("link", { name: "Sign in to subscribe" })).not.toBeInTheDocument();
  });
});
