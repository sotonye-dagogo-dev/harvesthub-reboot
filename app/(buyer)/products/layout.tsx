import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products | MyHarvestHub",
  description: "Browse our wide selection of products from trusted vendors",
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
