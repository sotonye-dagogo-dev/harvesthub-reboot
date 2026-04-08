import { getProducts, getVendors } from "@/lib/data/dataFetchers";
import ProductsContent from "@/components/features/ProductsContent";
import { parseProductDiscoveryQueryState } from "@/lib/config/productDiscovery";

export const dynamic = "force-dynamic";

type SearchParamsInput = Record<string, string | string[] | undefined>;

type ProductsPageProps = {
  searchParams?: Promise<SearchParamsInput>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialQueryState = parseProductDiscoveryQueryState(resolvedSearchParams);
  const [products, vendors] = await Promise.all([getProducts(), getVendors()]);
  return (
    <ProductsContent products={products} vendors={vendors} initialQueryState={initialQueryState} />
  );
}
