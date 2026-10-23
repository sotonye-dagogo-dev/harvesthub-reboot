import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ServiceDetailPanel,
  minServicePackagePrice,
  parseServiceDetails,
} from "@/components/features/services/ServiceDetailPanel";
import { useCart } from "@/lib/store/cartStore";
import { SERVICE_UNLIMITED_STOCK } from "@/lib/constants";
import type { ServiceDetails } from "@/lib/types";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/contexts/ToastContext", () => ({
  useToast: () => toastMock,
}));

vi.mock("@/lib/hooks/useGuestGuard", () => ({
  useGuestGuard: () => ({ requireAuth: () => true, isGuest: false }),
}));

const baseDetails: ServiceDetails = {
  deliveryMode: "DIGITAL",
  description: "Professional logo design",
  packages: [
    {
      tier: "BASIC",
      title: "Basic logo",
      description: "One concept",
      price: 3000,
      deliveryDays: 2,
      revisions: 1,
      extras: [{ title: "Source file", price: 500 }],
    },
    {
      tier: "STANDARD",
      title: "Standard logo",
      description: "Three concepts",
      price: 6000,
      deliveryDays: 4,
      revisions: 2,
      extras: [],
    },
  ],
  requirementFields: [
    { key: "BRAND_NAME", label: "Brand name", type: "TEXT", required: true },
    {
      key: "COLORS",
      label: "Preferred colors",
      type: "SELECT",
      options: ["Blue"],
      required: false,
    },
  ],
  availableSlots: [
    { id: "slot-1", dayOfWeek: 0, startTime: "10:00", endTime: "13:00", isAvailable: true },
    { id: "slot-2", dayOfWeek: 3, startTime: "17:00", endTime: "20:00", isAvailable: false },
  ],
};

function renderPanel(details: ServiceDetails = baseDetails) {
  return render(
    <ServiceDetailPanel
      productId="service-1"
      name="Logo Design"
      price={2500}
      images={["/service.jpg"]}
      vendorId="vendor-1"
      vendorName="Design Hub"
      details={details}
    />
  );
}

describe("parseServiceDetails", () => {
  it("returns null for non-object payloads", () => {
    expect(parseServiceDetails(null)).toBeNull();
    expect(parseServiceDetails(undefined)).toBeNull();
    expect(parseServiceDetails("legacy")).toBeNull();
    expect(parseServiceDetails([1, 2, 3])).toBeNull();
  });

  it("keeps booking-era rows renderable with safe defaults", () => {
    const parsed = parseServiceDetails({
      rate: 5000,
      rateType: "FIXED",
      durationMinutes: 60,
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.deliveryMode).toBe("DIGITAL");
    expect(parsed?.rate).toBe(5000);
    expect(parsed?.packages).toBeUndefined();
    expect(parsed?.requirementFields).toBeUndefined();
  });

  it("coerces packages: drops priceless tiers, repairs bad tiers, keeps extras", () => {
    const parsed = parseServiceDetails({
      deliveryMode: "ON_SITE",
      packages: [
        { tier: "nope", title: "Starter", price: 1000, deliveryDays: 3, revisions: 0 },
        { tier: "BASIC", title: "Broken price", price: "free" },
        {
          tier: "PREMIUM",
          title: "Premium",
          price: 9000,
          deliveryDays: 7,
          revisions: -1,
          extras: [
            { title: " Rush ", price: 1500 },
            { title: "", price: 100 },
            { title: "Bad", price: "x" },
          ],
        },
      ],
    });

    expect(parsed?.deliveryMode).toBe("ON_SITE");
    expect(parsed?.packages).toHaveLength(2);
    expect(parsed?.packages?.[0]).toEqual(
      expect.objectContaining({ tier: "BASIC", title: "Starter", price: 1000 })
    );
    expect(parsed?.packages?.[1]).toEqual(
      expect.objectContaining({ tier: "PREMIUM", price: 9000, revisions: -1 })
    );
    expect(parsed?.packages?.[1]?.extras).toEqual([{ title: "Rush", price: 1500 }]);
  });

  it("coerces requirement fields, slots and geo", () => {
    const parsed = parseServiceDetails({
      requirementFields: [
        { key: 42, label: "Upload brief", type: "SOMETHING", required: undefined },
        { label: "   " },
      ],
      availableSlots: [
        { dayOfWeek: 2, startTime: "09:00", endTime: "11:00", isAvailable: false },
        { dayOfWeek: 9, startTime: "09:00", endTime: "11:00" },
        { dayOfWeek: 4, startTime: "bad" },
      ],
      geo: { address: "12 Church Road", lat: "x", landmark: "Gate" },
    });

    expect(parsed?.requirementFields).toEqual([
      expect.objectContaining({ key: "FIELD_1", label: "Upload brief", type: "TEXT", required: true }),
    ]);
    expect(parsed?.availableSlots).toEqual([
      expect.objectContaining({ dayOfWeek: 2, isAvailable: false }),
    ]);
    expect(parsed?.geo).toEqual({ address: "12 Church Road", landmark: "Gate" });
  });
});

describe("minServicePackagePrice", () => {
  it("returns the cheapest tier and null without packages", () => {
    expect(minServicePackagePrice(baseDetails)).toBe(3000);
    expect(minServicePackagePrice({})).toBeNull();
  });
});

describe("ServiceDetailPanel", () => {
  beforeEach(() => {
    useCart.setState({ items: [], totalItems: 0, totalPrice: 0 });
    toastMock.success.mockClear();
    toastMock.error.mockClear();
  });

  it("renders every tier with price, delivery window and revisions", () => {
    renderPanel();

    expect(screen.getByRole("radiogroup", { name: /package/i })).toBeInTheDocument();
    expect(screen.getByText("Basic logo")).toBeInTheDocument();
    expect(screen.getByText("Standard logo")).toBeInTheDocument();
    expect(screen.getAllByText(/₦3,000/)).toHaveLength(2); // tier card + running total
    expect(screen.getAllByText(/₦6,000/)).toHaveLength(1);
    expect(screen.getByText("2 days delivery")).toBeInTheDocument();
    expect(screen.getByText("1 revision")).toBeInTheDocument();
    expect(screen.getByText("2 revisions")).toBeInTheDocument();
  });

  it("switches packages and reprices the summary", () => {
    renderPanel();
    expect(screen.getByTestId("service-total")).toHaveTextContent("₦3,000");

    fireEvent.click(screen.getByRole("radio", { name: /Standard logo/ }));

    expect(screen.getByTestId("service-total")).toHaveTextContent("₦6,000");
    expect(screen.getByText(/Standard logo · Standard/)).toBeInTheDocument();
  });

  it("adds the chosen package and extras to the cart at quantity 1", () => {
    renderPanel();

    expect(screen.getByTestId("service-total")).toHaveTextContent("₦3,000");
    fireEvent.click(screen.getByLabelText(/Source file/));

    expect(screen.getByTestId("service-total")).toHaveTextContent("₦3,500");

    fireEvent.click(screen.getByRole("button", { name: /Add Service to Cart/i }));

    const items = useCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(
      expect.objectContaining({
        productId: "service-1",
        name: "Logo Design",
        price: 3500,
        basePrice: 2500,
        quantity: 1,
        isService: true,
        stock: SERVICE_UNLIMITED_STOCK,
        serviceDeliveryMode: "DIGITAL",
      })
    );
    expect(items[0]?.selectedPackage).toEqual(
      expect.objectContaining({
        tier: "BASIC",
        title: "Basic logo",
        price: 3000,
        extras: [{ title: "Source file", price: 500 }],
      })
    );
    expect(toastMock.success).toHaveBeenCalled();
    expect(useCart.getState().totalPrice).toBe(3500);
  });

  it("clears extras when the tier changes", () => {
    renderPanel();

    fireEvent.click(screen.getByLabelText(/Source file/));
    expect(screen.getByTestId("service-total")).toHaveTextContent("₦3,500");

    fireEvent.click(screen.getByRole("radio", { name: /Standard logo/ }));
    expect(screen.getByTestId("service-total")).toHaveTextContent("₦6,000");

    fireEvent.click(screen.getByRole("radio", { name: /Basic logo/ }));
    expect(screen.getByTestId("service-total")).toHaveTextContent("₦3,000");
    expect((screen.getByLabelText(/Source file/) as HTMLInputElement).checked).toBe(false);
  });

  it("shows availability slots and hides unavailable ones", () => {
    renderPanel();

    expect(screen.getByText(/Availability/)).toBeInTheDocument();
    expect(screen.getByText("10:00 – 13:00")).toBeInTheDocument();
    expect(screen.queryByText("17:00 – 20:00")).not.toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.queryByText("Wed")).not.toBeInTheDocument();
  });

  it("lists what the vendor needs with optional markers", () => {
    renderPanel();

    expect(screen.getByText(/What I'll need from you/)).toBeInTheDocument();
    expect(screen.getByText("Brand name")).toBeInTheDocument();
    expect(screen.getByText("Preferred colors")).toBeInTheDocument();
    expect(screen.getByText("(optional)")).toBeInTheDocument();
    expect(screen.getByText("Choice")).toBeInTheDocument();
  });

  it("surfaces the on-site delivery mode", () => {
    renderPanel({
      ...baseDetails,
      deliveryMode: "ON_SITE",
      geo: { address: "12 Church Road" },
    });

    expect(screen.getByText("On-site service")).toBeInTheDocument();
    expect(screen.getByText(/Vendor comes to: 12 Church Road/)).toBeInTheDocument();
  });
});
