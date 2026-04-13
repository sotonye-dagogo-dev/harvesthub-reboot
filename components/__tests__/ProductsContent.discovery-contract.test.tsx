import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProductsContent from "@/components/features/ProductsContent";
import { parseProductDiscoveryQueryState } from "@/lib/config/productDiscovery";
import type { Product, Vendor } from "@/lib/types";

const { replaceMock, searchParamsMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  searchParamsMock: vi.fn(() => new URLSearchParams()),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/products",
  useSearchParams: () => searchParamsMock(),
}));

vi.mock("@/lib/hooks/useGuestGuard", () => ({
  useGuestGuard: () => ({
    requireAuth: () => true,
    isGuest: false,
  }),
}));

vi.mock("@/lib/contexts/ToastContext", () => ({
  useToast: () => ({
    message: {},
    notify: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock("@/lib/store/cartStore", () => ({
  useCart: () => ({
    addItem: vi.fn(),
  }),
}));

vi.mock("@/lib/store/favoritesStore", () => ({
  useFavorites: () => ({
    toggleFavorite: vi.fn(),
    isFavorite: vi.fn(() => false),
  }),
}));

vi.mock("@/components/features", () => ({
  ProductCard: ({ name }: { name: string }) => <div data-testid="product-card">{name}</div>,
  SearchBar: ({
    onSearch,
    defaultValue,
  }: {
    onSearch: (query: string) => void;
    defaultValue?: string;
  }) => (
    <input
      data-testid="search-bar"
      defaultValue={defaultValue}
      onChange={(event) => onSearch(event.target.value)}
    />
  ),
  CategoryNav: ({ currentCategory }: { currentCategory?: string }) => (
    <div data-testid="category-nav">{currentCategory || "none"}</div>
  ),
  FilterSidebar: ({
    onFilterChange,
  }: {
    onFilterChange: (filters: Record<string, unknown>) => void;
  }) => (
    <button
      data-testid="apply-canonical-filter"
      onClick={() =>
        onFilterChange({
          categories: ["ELECTRONICS"],
          priceRange: { min: 1000, max: 5000 },
          vendors: ["vendor-1"],
          locations: ["OREGUN_HQ"],
        })
      }
    >
      Apply canonical filter
    </button>
  ),
}));

function buildProduct(overrides: Partial<Product>): Product {
  const now = new Date("2026-04-08T10:00:00.000Z");

  return {
    id: "product-base",
    vendorId: "vendor-1",
    name: "Base Product",
    description: "Base product description",
    category: "MOBILE_DEVICES" as Product["category"],
    listingType: "PRODUCT" as Product["listingType"],
    price: 2500,
    stock: 10,
    images: ["/placeholder-product.jpg"],
    mainImage: "/placeholder-product.jpg",
    isActive: true,
    isFeatured: false,
    views: 0,
    sales: 0,
    averageRating: 0,
    totalReviews: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildVendor(overrides: Partial<Vendor> = {}): Vendor {
  const now = new Date("2026-04-08T10:00:00.000Z");

  return {
    id: "vendor-1",
    userId: "user-1",
    storeName: "Harvest Electronics",
    category: "ELECTRONICS" as Vendor["category"],
    whatsappNumber: "+2340000000000",
    campus: "OREGUN_HQ" as Vendor["campus"],
    status: "APPROVED" as Vendor["status"],
    isChurchAffiliated: true,
    commissionRate: 0.05,
    storeSettings: {
      allowsPickup: true,
      allowsDelivery: true,
      pickupServices: [],
      deliveryZones: [],
    },
    analytics: {
      totalSales: 0,
      totalOrders: 0,
      totalProducts: 0,
      averageRating: 0,
      totalReviews: 0,
      conversionRate: 0,
      lastUpdated: now,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("ProductsContent discovery contract", () => {
  const products: Product[] = [
    buildProduct({
      id: "electronics-1",
      name: "Mobile Phone",
      category: "MOBILE_DEVICES" as Product["category"],
    }),
    buildProduct({
      id: "grocery-1",
      name: "Rice Bag",
      category: "GROCERY" as Product["category"],
      vendorId: "vendor-2",
    }),
  ];

  const vendors: Vendor[] = [
    buildVendor(),
    buildVendor({
      id: "vendor-2",
      userId: "user-2",
      storeName: "Faith Groceries",
      category: "GROCERY_FOOD" as Vendor["category"],
    }),
  ];

  beforeEach(() => {
    replaceMock.mockClear();
    searchParamsMock.mockReset();
    searchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("filters products from home category click-through query state", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("category=electronics"));

    const initialQueryState = parseProductDiscoveryQueryState({
      category: "electronics",
    });

    render(
      <ProductsContent
        products={products}
        vendors={vendors}
        initialQueryState={initialQueryState}
      />
    );

    expect(screen.getByText("Showing 1 of 1 products")).toBeInTheDocument();
    expect(screen.getByText("Mobile Phone")).toBeInTheDocument();
    expect(screen.queryByText("Rice Bag")).not.toBeInTheDocument();
    expect(screen.getByTestId("category-nav")).toHaveTextContent("electronics");
  });

  it("maps filter sidebar selections to canonical discovery query params", async () => {
    render(<ProductsContent products={products} vendors={vendors} />);

    fireEvent.click(screen.getByTestId("apply-canonical-filter"));

    await waitFor(() => {
      const latestUrl = replaceMock.mock.calls.at(-1)?.[0];
      expect(typeof latestUrl).toBe("string");

      const parsed = new URL(latestUrl as string, "http://localhost");
      expect(parsed.pathname).toBe("/products");
      expect(parsed.searchParams.get("category")).toBe("electronics");
      expect(parsed.searchParams.get("vendor")).toBe("vendor-1");
      expect(parsed.searchParams.get("location")).toBe("OREGUN_HQ");
      expect(parsed.searchParams.get("minPrice")).toBe("1000");
      expect(parsed.searchParams.get("maxPrice")).toBe("5000");
    });
  });
});
