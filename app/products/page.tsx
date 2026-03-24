import { getProducts, getVendors } from "@/lib/data/dataFetchers";
import ProductsContent from "@/components/features/ProductsContent";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, vendors] = await Promise.all([getProducts(), getVendors()]);
  return <ProductsContent products={products} vendors={vendors} />;
}
