"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  App,
  Button as AntButton,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Tabs,
} from "antd";
import {
  AlertTriangle,
  CreditCard,
  Package,
  Pencil,
  Plus,
  TrendingUp,
  Trash2,
  Users,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  EmptyState,
  Pagination,
  SectionLoader,
  StatCard,
  StatusTag,
  openActionConfirm,
  ActionConfirmPresets,
} from "@/components/ui";
import type { ActionConfirmConfig } from "@/components/ui";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { emitDataMutated } from "@/lib/data-runtime/mutationBus";

const formatNaira = (amount: number) =>
  "₦" + amount.toLocaleString("en-NG", { maximumFractionDigits: 2 });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

type SubscriptionStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  ACTIVE: "green",
  EXPIRED: "red",
  CANCELLED: "default",
  PENDING: "gold",
};

interface AdminPackage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  durationDays: number;
  features: unknown;
  isActive: boolean;
  sortOrder: number;
  _count?: { subscriptions: number };
}

interface AdminSubscriptionsResponse {
  subscriptions: AdminSubscription[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  stats: {
    activeSubscriptions: number;
    expiringSoon: number;
    expiredSubscriptions: number;
    totalSubscriptions: number;
    uniqueSubscribers: number;
    totalRevenue: number;
    activePackages: number;
  };
  config: { subscriptionEnabled?: boolean };
  packages: { id: string; name: string; slug: string; isActive: boolean }[];
}

interface AdminSubscription {
  id: string;
  status: SubscriptionStatus;
  amount: number;
  paymentMethod: string;
  paymentReference: string | null;
  startAt: string;
  expiresAt: string;
  createdAt: string;
  package: { id: string; name: string; slug: string; durationDays: number };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    vendor: { id: string; storeName: string; status: string } | null;
  };
}

interface AdminPackagesResponse {
  packages: AdminPackage[];
}

interface PackageFormValues {
  name: string;
  slug: string;
  description?: string;
  price: number;
  durationDays: number;
  features?: string[];
  sortOrder?: number;
  isActive?: boolean;
}

const toFeatureStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((f): f is string => typeof f === "string" && f.trim().length > 0)
    : [];

export default function OperationsSubscriptionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<PackageFormValues>();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [packageFilter, setPackageFilter] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<AdminPackage | null>(null);
  const [isSubmittingPackage, setIsSubmittingPackage] = useState(false);

  const fetchAdminSubscriptions =
    useCallback(async (): Promise<AdminSubscriptionsResponse> => {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (packageFilter !== "ALL") params.set("packageId", packageFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to load subscriptions");
      }
      return {
        subscriptions: Array.isArray(data.subscriptions) ? data.subscriptions : [],
        pagination: data.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
        stats: data.stats ?? {
          activeSubscriptions: 0,
          expiringSoon: 0,
          expiredSubscriptions: 0,
          totalSubscriptions: 0,
          uniqueSubscribers: 0,
          totalRevenue: 0,
          activePackages: 0,
        },
        config: data.config ?? {},
        packages: Array.isArray(data.packages) ? data.packages : [],
      };
    }, [statusFilter, packageFilter, search, page]);

  const fetchAdminPackages = useCallback(async (): Promise<AdminPackagesResponse> => {
    const res = await fetch("/api/admin/subscription-packages");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || "Failed to load packages");
    }
    return { packages: Array.isArray(data.packages) ? data.packages : [] };
  }, []);

  const {
    data: adminData,
    isLoading,
    error,
    refresh: refreshSubscriptions,
  } = useSmartResource(fetchAdminSubscriptions, {
    key: "admin-subscriptions",
    staleTimeMs: 10_000,
  });

  const {
    data: packagesData,
    isLoading: packagesLoading,
    error: packagesError,
    refresh: refreshPackages,
  } = useSmartResource(fetchAdminPackages, {
    key: "admin-subscription-packages",
    staleTimeMs: 15_000,
  });

  // Filters change the fetcher closure — refetch after the new fetcher has been
  // registered (declaration order guarantees this runs after useSmartResource's
  // registration effect within the same commit).
  const filtersKey = `${statusFilter}|${packageFilter}|${search}|${page}`;
  const isFirstFilterRun = useRef(true);
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    void refreshSubscriptions(true);
  }, [filtersKey, refreshSubscriptions]);

  const stats = adminData?.stats;
  const pagination = adminData?.pagination;
  const subscriptions = adminData?.subscriptions ?? [];
  const packages = packagesData?.packages ?? [];
  const subscriptionsEnabled = adminData?.config?.subscriptionEnabled !== false;

  const packageOptions = useMemo(() => {
    const list =
      adminData?.packages && adminData.packages.length > 0
        ? adminData.packages
        : packages.map((pkg) => ({ id: pkg.id, name: pkg.name, slug: pkg.slug, isActive: pkg.isActive }));
    return [
      { value: "ALL", label: "All packages" },
      ...list.map((pkg) => ({ value: pkg.id, label: pkg.name })),
    ];
  }, [adminData, packages]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePackageChange = (value: string) => {
    setPackageFilter(value);
    setPage(1);
  };

  const applySearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleCreatePackage = () => {
    setEditingPackage(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, sortOrder: 0, features: [], durationDays: 30 });
    setPackageModalOpen(true);
  };

  const handleEditPackage = (pkg: AdminPackage) => {
    setEditingPackage(pkg);
    form.setFieldsValue({
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description ?? "",
      price: pkg.price,
      durationDays: pkg.durationDays,
      features: toFeatureStrings(pkg.features),
      sortOrder: pkg.sortOrder,
      isActive: pkg.isActive,
    });
    setPackageModalOpen(true);
  };

  const handlePackageSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmittingPackage(true);

      const body = JSON.stringify({
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description?.trim() || null,
        price: values.price,
        durationDays: values.durationDays,
        features: (values.features ?? [])
          .map((feature) => (typeof feature === "string" ? feature.trim() : ""))
          .filter((feature) => feature.length > 0),
        sortOrder: values.sortOrder ?? 0,
        isActive: values.isActive ?? true,
      });

      const res = await fetch(
        editingPackage
          ? `/api/admin/subscription-packages/${editingPackage.id}`
          : "/api/admin/subscription-packages",
        {
          method: editingPackage ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to save package");
      }

      message.success(editingPackage ? "Package updated" : "Package created");
      emitDataMutated(["subscriptions", "operations-dashboard"]);
      setPackageModalOpen(false);
      setEditingPackage(null);
      await refreshPackages(true);
      void refreshSubscriptions(true);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error(err instanceof Error ? err.message : "Failed to save package");
    } finally {
      setIsSubmittingPackage(false);
    }
  };

  const handleDeletePackage = (pkg: AdminPackage) => {
    openActionConfirm(ActionConfirmPresets.delete("package"), async () => {
      try {
        const res = await fetch(`/api/admin/subscription-packages/${pkg.id}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to delete package");
        }
        if (data.softDeleted) {
          message.info(data.message || "Package has subscribers and was hidden instead.");
        } else {
          message.success("Package deleted");
        }
        emitDataMutated(["subscriptions", "operations-dashboard"]);
        await refreshPackages(true);
        void refreshSubscriptions(true);
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Failed to delete package");
      }
    });
  };

  const runSubscriptionAction = (
    subscription: AdminSubscription,
    action: "cancel" | "restore",
    config: ActionConfirmConfig
  ) => {
    openActionConfirm(config, async () => {
      try {
        const res = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || `Failed to ${action} subscription`);
        }
        message.success(
          data.message ||
            (action === "cancel" ? "Subscription cancelled" : "Subscription restored")
        );
        emitDataMutated(["subscriptions", "operations-dashboard"]);
        await refreshSubscriptions(true);
      } catch (err) {
        message.error(err instanceof Error ? err.message : `Failed to ${action} subscription`);
      }
    });
  };

  if (user && user.role !== "ADMIN") {
    router.push("/unauthorized");
    return null;
  }

  const overviewTab = stats ? (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <StatCard
        title="Active"
        value={String(stats.activeSubscriptions)}
        icon={CheckCircle2}
        colorPreset="success"
      />
      <StatCard
        title="Expiring soon"
        value={String(stats.expiringSoon)}
        icon={AlertTriangle}
        colorPreset="warning"
      />
      <StatCard
        title="Expired"
        value={String(stats.expiredSubscriptions)}
        icon={XCircle}
        colorPreset="error"
      />
      <StatCard
        title="Unique subscribers"
        value={String(stats.uniqueSubscribers)}
        icon={Users}
        colorPreset="brand"
      />
      <StatCard
        title="Total revenue"
        value={formatNaira(stats.totalRevenue)}
        icon={TrendingUp}
        colorPreset="info"
      />
      <StatCard
        title="Active packages"
        value={String(stats.activePackages)}
        icon={Package}
        colorPreset="brand"
      />
    </div>
  ) : (
    <Card>
      <EmptyState title="No overview data yet" description="Stats will appear shortly." />
    </Card>
  );

  const packagesTab = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ds-text-primary">Packages</h2>
          <p className="text-sm text-ds-text-secondary">
            Define what vendors can buy — pricing, duration and features are fully admin-controlled.
          </p>
        </div>
        <AntButton type="primary" onClick={handleCreatePackage}>
          <span className="inline-flex items-center gap-1">
            <Plus className="h-4 w-4" />
            New Package
          </span>
        </AntButton>
      </div>

      {packagesLoading && packages.length === 0 ? (
        <Card>
          <SectionLoader />
        </Card>
      ) : packagesError && packages.length === 0 ? (
        <Card>
          <EmptyState
            title="Unable to load packages"
            description={String(packagesError)}
          />
        </Card>
      ) : packages.length === 0 ? (
        <Card>
          <EmptyState
            title="No packages yet"
            description="Create your first subscription package to start selling access."
            action={{ label: "New Package", onClick: handleCreatePackage }}
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-ds-border-base bg-ds-surface-sunken">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Subscribers
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    className="border-b border-ds-border-base last:border-0 hover:bg-ds-surface-sunken"
                  >
                    <td className="px-4 py-3 font-medium text-ds-text-primary">{pkg.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ds-text-secondary">
                      {pkg.slug}
                    </td>
                    <td className="px-4 py-3 text-ds-text-primary">{formatNaira(pkg.price)}</td>
                    <td className="px-4 py-3 text-ds-text-secondary">{pkg.durationDays} days</td>
                    <td className="px-4 py-3">
                      {pkg.isActive ? (
                        <StatusTag
                          domain="payment"
                          status="ACTIVE"
                          color="green"
                          label="Active"
                        />
                      ) : (
                        <StatusTag
                          domain="payment"
                          status="INACTIVE"
                          color="default"
                          label="Hidden"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-ds-text-secondary">
                      {pkg._count?.subscriptions ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <AntButton
                          size="small"
                          icon={<Pencil className="h-4 w-4" />}
                          onClick={() => handleEditPackage(pkg)}
                          aria-label={`Edit ${pkg.name}`}
                        />
                        <AntButton
                          size="small"
                          danger
                          icon={<Trash2 className="h-4 w-4" />}
                          onClick={() => handleDeletePackage(pkg)}
                          aria-label={`Delete ${pkg.name}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );

  const subscriptionsTab = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onChange={handleStatusChange}
          className="w-44"
          aria-label="Filter by status"
          options={[
            { value: "ALL", label: "All statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "EXPIRED", label: "Expired" },
            { value: "CANCELLED", label: "Cancelled" },
            { value: "PENDING", label: "Pending" },
          ]}
        />
        <Select
          value={packageFilter}
          onChange={handlePackageChange}
          className="w-52"
          aria-label="Filter by package"
          options={packageOptions}
        />
        <div className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onPressEnter={applySearch}
            placeholder="Search email or store"
            allowClear
            className="w-64"
            aria-label="Search subscribers"
          />
          <AntButton onClick={applySearch}>Search</AntButton>
        </div>
      </div>

      {isLoading && !adminData ? (
        <Card>
          <SectionLoader />
        </Card>
      ) : error && !adminData ? (
        <Card>
          <EmptyState title="Unable to load subscriptions" description={String(error)} />
        </Card>
      ) : subscriptions.length === 0 ? (
        <Card>
          <EmptyState
            title="No subscriptions found"
            description="Adjust the filters or wait for the first purchases to come in."
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-ds-border-base bg-ds-surface-sunken">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Subscriber
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Package
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Started
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-ds-border-base last:border-0 hover:bg-ds-surface-sunken"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-ds-text-primary">
                        {row.user.firstName} {row.user.lastName}
                      </p>
                      <p className="text-xs text-ds-text-tertiary">{row.user.email}</p>
                      {row.user.vendor ? (
                        <p className="text-xs text-ds-text-secondary">
                          Store: {row.user.vendor.storeName}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ds-text-primary">
                      {row.package.name}
                      <p className="text-xs text-ds-text-tertiary">
                        {row.package.durationDays} days
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ds-text-primary">
                      {formatNaira(row.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-ds-text-secondary">
                        <CreditCard className="h-3.5 w-3.5" />
                        {row.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ds-text-secondary">
                      {formatDate(row.startAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-ds-text-secondary">
                      {formatDate(row.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusTag domain="payment" status={row.status} color={STATUS_COLORS[row.status]} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {row.status === "ACTIVE" ? (
                          <AntButton
                            size="small"
                            danger
                            onClick={() =>
                              runSubscriptionAction(
                                row,
                                "cancel",
                                ActionConfirmPresets.deactivate("subscription")
                              )
                            }
                          >
                            Cancel
                          </AntButton>
                        ) : null}
                        {row.status === "CANCELLED" &&
                        new Date(row.expiresAt).getTime() > Date.now() ? (
                          <AntButton
                            size="small"
                            onClick={() =>
                              runSubscriptionAction(
                                row,
                                "restore",
                                ActionConfirmPresets.activate("subscription")
                              )
                            }
                          >
                            Restore
                          </AntButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ds-text-tertiary">
                {pagination.total} subscription{pagination.total === 1 ? "" : "s"} total
              </p>
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Subscriptions</h1>
        <p className="mt-1 text-ds-text-secondary">
          Manage subscription packages and review every vendor subscription on the platform.
        </p>
        {error ? <p className="mt-1 text-xs text-ds-status-error-text">{error}</p> : null}
        <p className="mt-1 text-xs text-ds-text-tertiary">
          Need to change the model itself?{" "}
          <Link
            href="/operations/settings"
            className="text-ds-text-brand hover:underline"
          >
            Operations → Settings → Payment Models
          </Link>
        </p>
      </div>

      {!subscriptionsEnabled ? (
        <Alert
          type="info"
          showIcon
          message="Subscription packages are disabled."
          description="Enable subscription packages in Operations → Settings → Payment Models."
        />
      ) : null}

      <Tabs
        defaultActiveKey="overview"
        items={[
          { key: "overview", label: "Overview", children: overviewTab },
          { key: "packages", label: "Packages", children: packagesTab },
          { key: "subscriptions", label: "Subscriptions", children: subscriptionsTab },
        ]}
      />

      {/* Create/Edit package modal */}
      <Modal
        title={editingPackage ? "Edit Package" : "New Package"}
        open={packageModalOpen}
        onCancel={() => {
          setPackageModalOpen(false);
          setEditingPackage(null);
        }}
        onOk={() => void handlePackageSubmit()}
        okText={editingPackage ? "Update" : "Create"}
        okButtonProps={{ loading: isSubmittingPackage }}
        cancelButtonProps={{ disabled: isSubmittingPackage }}
        destroyOnHidden
        width={640}
      >
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <Form form={form} layout="vertical">
              <Form.Item
                name="name"
                label="Name"
                rules={[
                  { required: true, message: "Enter a package name" },
                  { max: 80, message: "Name must be 80 characters or fewer" },
                ]}
              >
                <Input placeholder="e.g. Starter Store" maxLength={80} />
              </Form.Item>

              <Form.Item
                name="slug"
                label="Slug"
                rules={[
                  { required: true, message: "Enter a slug" },
                  {
                    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    message: "lowercase letters, numbers, hyphens",
                  },
                ]}
                help="lowercase letters, numbers, hyphens"
              >
                <Input placeholder="e.g. starter-store" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
                rules={[{ max: 500, message: "Description must be 500 characters or fewer" }]}
              >
                <Input.TextArea rows={3} maxLength={500} showCount />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="price"
                  label="Price (NGN)"
                  rules={[{ required: true, message: "Enter a price" }]}
                >
                  <InputNumber min={0} className="w-full" prefix="₦" />
                </Form.Item>
                <Form.Item
                  name="durationDays"
                  label="Duration"
                  rules={[{ required: true, message: "Enter duration" }]}
                >
                  <InputNumber min={1} max={3650} className="w-full" addonAfter="days" />
                </Form.Item>
              </div>

              <Form.List name="features">
                {(fields, { add, remove }) => (
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-medium text-ds-text-primary">Features</p>
                    {fields.map((field) => (
                      <div key={field.key} className="mb-2 flex items-start gap-2">
                        <Form.Item
                          className="mb-0 flex-1"
                          name={field.name}
                          rules={[{ max: 120, message: "Max 120 characters per feature" }]}
                        >
                          <Input placeholder="e.g. Unlimited product listings" maxLength={120} />
                        </Form.Item>
                        <AntButton
                          size="small"
                          onClick={() => remove(field.name)}
                          disabled={fields.length <= 1}
                        >
                          Remove
                        </AntButton>
                      </div>
                    ))}
                    <AntButton
                      type="dashed"
                      block
                      disabled={fields.length >= 20}
                      onClick={() => add("")}
                    >
                      Add feature {fields.length >= 20 ? "(max 20 reached)" : ""}
                    </AntButton>
                  </div>
                )}
              </Form.List>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="sortOrder" label="Sort order">
                  <InputNumber min={-1000} max={1000} className="w-full" />
                </Form.Item>
                <Form.Item
                  name="isActive"
                  label="Visible for purchase"
                  valuePropName="checked"
                  initialValue
                >
                  <Switch />
                </Form.Item>
              </div>
            </Form>
          </div>
        </Modal>
    </div>
  );
}
