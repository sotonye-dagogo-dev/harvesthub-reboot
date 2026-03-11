import { getBanners, getProducts, getVendors } from "@/lib/data/dataFetchers";
import { HomeContent } from "@/app/components/HomeContent";

export default async function HomePage() {
  const [banners, products, vendors] = await Promise.all([
    getBanners(),
    getProducts(),
    getVendors(),
  ]);

  return <HomeContent banners={banners} products={products} vendors={vendors} />;
}
