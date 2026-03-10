import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";

// Mock providers wrapper for testing
interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  // Add your providers here (Auth, Theme, etc.)
  return <>{children}</>;
}

// Custom render function that wraps with providers
function customRender(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Mock user data for tests
export const mockBuyer = {
  id: "buyer-test-1",
  email: "buyer@test.com",
  firstName: "Test",
  lastName: "Buyer",
  role: "BUYER" as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockVendor = {
  id: "vendor-test-1",
  email: "vendor@test.com",
  firstName: "Test",
  lastName: "Vendor",
  role: "VENDOR" as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockAdmin = {
  id: "admin-test-1",
  email: "admin@test.com",
  firstName: "Test",
  lastName: "Admin",
  role: "ADMIN" as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockProduct = {
  id: "prod-test-1",
  name: "Test Product",
  description: "Test product description",
  price: 1000,
  category: "ELECTRONICS" as const,
  images: [],
  vendorId: "vendor-test-1",
  stock: 100,
  isActive: true,
  isFeatured: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
