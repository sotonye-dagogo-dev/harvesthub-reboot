export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="mt-2 text-ds-text-secondary">
        Manage users, vendors, content and brand campaigns from here.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-ds-lg border border-ds-border-base p-4">
          <h2 className="text-xl font-semibold">Active Vendors</h2>
          <p className="text-ds-text-secondary">Quick stats and management shortcuts.</p>
        </div>
        <div className="rounded-ds-lg border border-ds-border-base p-4">
          <h2 className="text-xl font-semibold">Pending Ads</h2>
          <p className="text-ds-text-secondary">
            Review and approve ad applications collected from market places.
          </p>
        </div>
        <div className="rounded-ds-lg border border-ds-border-base p-4">
          <h2 className="text-xl font-semibold">Site Health</h2>
          <p className="text-ds-text-secondary">Track system status and performance metrics.</p>
        </div>
      </div>
    </div>
  );
}
