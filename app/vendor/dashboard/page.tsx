export default function VendorDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
      <p className="mt-2 text-ds-text-secondary">
        View your sales, orders, products, and ad campaign performance.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-ds-lg border border-ds-border-base p-4">
          <h2 className="text-xl font-semibold">My Orders</h2>
          <p className="text-ds-text-secondary">Monitor pending orders and delivery status.</p>
        </div>
        <div className="rounded-ds-lg border border-ds-border-base p-4">
          <h2 className="text-xl font-semibold">Product Catalog</h2>
          <p className="text-ds-text-secondary">Publish new products and optimize listings.</p>
        </div>
        <div className="rounded-ds-lg border border-ds-border-base p-4">
          <h2 className="text-xl font-semibold">Ad Campaigns</h2>
          <p className="text-ds-text-secondary">Track your ads and activity analytics.</p>
        </div>
      </div>
    </div>
  );
}
