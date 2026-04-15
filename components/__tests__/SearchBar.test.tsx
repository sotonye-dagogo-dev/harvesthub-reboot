import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SearchBar } from "@/components/features/SearchBar";
import { getProductsClient } from "@/lib/data/clientDataFetchers";

vi.mock("@/lib/data/clientDataFetchers", () => ({
  getProductsClient: vi.fn(),
}));

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

function installLocalStorageMock(initialData: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initialData));
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  });
}

describe("SearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installLocalStorageMock();
  });

  it("renders recent searches and allows replay", async () => {
    installLocalStorageMock({
      "myharvesthub.test.recent": JSON.stringify(["rice", "yam"]),
    });
    const onSearch = vi.fn();

    render(
      <SearchBar
        onSearch={onSearch}
        showRecentSearches
        recentSearchKey="myharvesthub.test.recent"
      />
    );

    const input = screen.getByPlaceholderText("Search products...");
    fireEvent.focus(input);

    expect(await screen.findByText("Recent searches")).toBeInTheDocument();
    fireEvent.click(screen.getByText("rice"));

    expect(onSearch).toHaveBeenCalledWith("rice");
  });

  it("shows live suggestions and navigates on suggestion click", async () => {
    vi.mocked(getProductsClient).mockResolvedValue([
      {
        id: "product-1",
        name: "Laptop Pro",
        images: ["/laptop.jpg"],
        price: 250000,
      } as any,
    ]);

    render(<SearchBar onSearch={vi.fn()} showRecentSearches />);

    const input = screen.getByPlaceholderText("Search products...");
    fireEvent.change(input, { target: { value: "lap" } });

    await waitFor(() => {
      expect(getProductsClient).toHaveBeenCalledWith({ search: "lap", limit: 6 });
    });

    fireEvent.click(await screen.findByText("Laptop Pro"));
    expect(routerPush).toHaveBeenCalledWith("/products/product-1");
  });

  it("supports keyboard navigation and enter-select for suggestions", async () => {
    vi.mocked(getProductsClient).mockResolvedValue([
      {
        id: "product-1",
        name: "Laptop Pro",
        images: ["/laptop.jpg"],
        price: 250000,
      } as any,
      {
        id: "product-2",
        name: "Laptop Air",
        images: ["/laptop-air.jpg"],
        price: 180000,
      } as any,
    ]);

    render(<SearchBar onSearch={vi.fn()} showRecentSearches />);

    const input = screen.getByPlaceholderText("Search products...");
    fireEvent.change(input, { target: { value: "lap" } });

    await screen.findByText("Laptop Pro");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(routerPush).toHaveBeenCalledWith("/products/product-2");
  });
});
