import { getVendors, getProducts } from "@/lib/data/dataFetchers";
import { VendorsContent } from "./VendorsContent";

export default async function VendorsPage() {
  const [vendors, products] = await Promise.all([
    getVendors(),
    getProducts(),
  ]);

  return <VendorsContent vendors={vendors} products={products} />;
}
