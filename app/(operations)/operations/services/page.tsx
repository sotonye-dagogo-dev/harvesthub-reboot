"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Select, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useAuth } from "@/lib/contexts/AuthContext";
import { UserRole } from "@/lib/constants";
import { PageLoader, SectionLoader } from "@/components/ui";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { emitDataMutated } from "@/lib/data-runtime/mutationBus";
import type { Product } from "@/lib/types";
import { serviceListingEnabled } from "@/components/features/services/serviceListingFlag";
import ServiceListingWizard from "@/components/features/services/ServiceListingWizard";

interface AuthMeResponse {
  roleData?: { id?: string } | null;
}

interface VendorOption {
  id: string;
  storeName: string;
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function DisabledNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-ds-lg border border-ds-border-brand bg-ds-brand-surface p-6 text-center">
      <h1 className="text-xl font-bold text-ds-text-primary">Service listings are switched off</h1>
      <p className="mt-2 text-sm text-ds-text-secondary">
        The service marketplace flag is disabled right now, so the listing wizard and service
        storefront are hidden. Existing service orders are unaffected.
      </p>
      <Link
        href="/operations/dashboard"
        className="mt-4 inline-block rounded-ds-md border border-ds-border-base px-3 py-2 text-sm text-ds-text-primary hover:bg-ds-surface-sunken"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

function ServicesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const isNew = searchParams.get("new") !== null;
  const editId = searchParams.get("edit");

  const [vendorScopeId, setVendorScopeId] = useState<string | null>(null);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [adminVendorId, setAdminVendorId] = useState<string>("");
  const [bootstrapping, setBootstrapping] = useState(true);

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isWizardRoute = isNew || Boolean(editId);
  const isAdmin = user?.role === UserRole.ADMIN;

  // ── Role gate (same pattern as the other operations pages) ────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== UserRole.VENDOR && user.role !== UserRole.ADMIN) {
      router.push("/unauthorized");
    }
  }, [authLoading, router, user]);

  // ── Vendor scope: vendors get their own id, admins pick one when creating ─
  useEffect(() => {
    if (!user || authLoading) return;
    let cancelled = true;

    async function bootstrap() {
      setBootstrapping(true);
      try {
        if (user?.role === UserRole.VENDOR) {
          const response = await fetch("/api/auth/me");
          if (!response.ok) throw new Error("Unable to load your vendor profile");
          const data = (await response.json()) as AuthMeResponse;
          if (cancelled) return;
          setVendorScopeId(data.roleData?.id ?? null);
          if (!data.roleData?.id) {
            message.error("A vendor profile is required to manage service listings.");
          }
          return;
        }

        const response = await fetch("/api/vendors?status=APPROVED&limit=100");
        const data = (await response.json().catch(() => ({}))) as {
          vendors?: Array<{ id: string; storeName: string }>;
        };
        if (!cancelled && Array.isArray(data.vendors)) {
          setVendorOptions(data.vendors);
        }
      } catch (error) {
        if (!cancelled) {
          message.error(
            error instanceof Error ? error.message : "Unable to load the services workspace.",
          );
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  // ── Service listings (drafts + published) ─────────────────────────────────
  const loadServices = useCallback(async (): Promise<Product[]> => {
    if (!user) return [];

    const params = new URLSearchParams({
      limit: "100",
      includeInactive: "true",
      listingType: "SERVICE",
    });
    if (vendorScopeId) params.set("vendorId", vendorScopeId);

    const response = await fetch(`/api/products?${params.toString()}`);
    const data = (await response.json().catch(() => ({}))) as {
      products?: Product[];
      error?: string;
    };
    if (!response.ok) throw new Error(data.error || "Failed to load service listings");
    return Array.isArray(data.products) ? data.products : [];
  }, [user, vendorScopeId]);

  const {
    data: services,
    isLoading: loadingList,
    isRefreshing,
    error: listError,
    refresh,
  } = useSmartResource(loadServices, {
    key: `operations-services:${user?.id ?? "guest"}:${vendorScopeId ?? "all"}`,
    enabled: Boolean(user?.id) && !isWizardRoute && (isAdmin || Boolean(vendorScopeId)),
    staleTimeMs: 20_000,
    onError: (error) => {
      message.error(error instanceof Error ? error.message : "Failed to load service listings");
    },
  });

  // ── The listing behind ?edit=<id> ─────────────────────────────────────────
  useEffect(() => {
    if (!editId) {
      setEditProduct(null);
      setEditError(null);
      return;
    }

    let cancelled = true;
    setEditLoading(true);
    setEditError(null);

    fetch(`/api/products/${editId}`)
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as {
          product?: Product;
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok || !data.product) {
          setEditError(data.error || "That listing could not be found");
          return;
        }
        setEditProduct(data.product);
      })
      .catch(() => {
        if (!cancelled) setEditError("That listing could not be found");
      })
      .finally(() => {
        if (!cancelled) setEditLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editId]);

  const wizardVendorId =
    editProduct?.vendorId ?? (isAdmin ? adminVendorId || undefined : vendorScopeId ?? undefined);

  // The wizard mounts once its route, its vendor scope and (for ?edit) the
  // listing row are all resolved.
  const wizardRouteReady =
    isWizardRoute && !bootstrapping && !editLoading && (!editId || Boolean(editProduct));
  const wizardVendorReady =
    editId && editProduct ? true : isAdmin ? Boolean(adminVendorId) : Boolean(vendorScopeId);
  const canMountWizard = wizardRouteReady && wizardVendorReady;

  const userScope = user?.id ?? user?.email ?? "anonymous";

  const stats = useMemo(() => {
    const rows = services ?? [];
    return {
      total: rows.length,
      drafts: rows.filter((row) => !row.isActive).length,
      published: rows.filter((row) => row.isActive).length,
    };
  }, [services]);

  const openWizard = (mode: "new" | "edit", id?: string) => {
    router.push(mode === "new" ? "/operations/services?new" : `/operations/services?edit=${id}`);
  };

  const columns: ColumnsType<Product> = [
    {
      title: "Service",
      dataIndex: "name",
      key: "name",
      render: (_value, record) => (
        <div className="min-w-0">
          <p className="font-medium text-ds-text-primary">{record.name}</p>
          <p className="text-xs text-ds-text-secondary">{record.id}</p>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (active: boolean, record) => {
        const draftStep = record.serviceDetails?.draftStep;
        return (
          <Space>
            <Tag color={active ? "green" : "orange"} className="m-0">
              {active ? "Published" : "Draft"}
            </Tag>
            {!active && typeof draftStep === "number" ? (
              <span className="text-xs text-ds-text-tertiary">step {draftStep + 1} of 5</span>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (value: number) => <span>{formatNaira(Number(value) || 0)}</span>,
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (value: string | Date) => new Date(value).toLocaleDateString("en-NG"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_value, record) => (
        <Space>
          <Button
            size="small"
            type={record.isActive ? "default" : "primary"}
            icon={record.isActive ? <EditOutlined /> : undefined}
            onClick={() => openWizard("edit", record.id)}
          >
            {record.isActive ? "Edit" : "Continue"}
          </Button>
          {record.isActive ? (
            <Link href={`/products/${record.id}`}>
              <Button size="small" icon={<EyeOutlined />}>
                View
              </Button>
            </Link>
          ) : null}
        </Space>
      ),
    },
  ];

  if (!serviceListingEnabled) return <DisabledNotice />;

  if (authLoading || bootstrapping || (!user?.id && !authLoading)) {
    return <PageLoader />;
  }

  if (editId && editLoading) return <SectionLoader />;

  if (editId && editError) {
    return (
      <div className="space-y-4 p-4">
        <p className="text-sm text-ds-status-error-text">{editError}</p>
        <Button onClick={() => router.push("/operations/services")}>Back to listings</Button>
      </div>
    );
  }

  if (canMountWizard) {
    return (
      <ServiceListingWizard
        product={editProduct}
        vendorId={wizardVendorId}
        userScope={userScope}
        onPublished={() => {
          emitDataMutated(["products", "operations-dashboard"]);
          void refresh(true);
          router.push("/operations/services");
        }}
        onExit={() => router.push("/operations/services")}
      />
    );
  }

  if (isNew && isAdmin && !adminVendorId) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-6 shadow-ds-sm">
        <h1 className="text-xl font-bold text-ds-text-primary">New service listing</h1>
        <p className="text-sm text-ds-text-secondary">
          Pick the vendor this listing belongs to before opening the wizard.
        </p>
        <Select
          className="w-full"
          value={adminVendorId || undefined}
          placeholder="Select a vendor"
          showSearch
          optionFilterProp="label"
          options={vendorOptions.map((vendor) => ({
            value: vendor.id,
            label: vendor.storeName,
          }))}
          onChange={(next) => setAdminVendorId(String(next ?? ""))}
        />
        <div className="flex justify-end gap-2">
          <Button onClick={() => router.push("/operations/services")}>Cancel</Button>
        </div>
        <p className="text-xs text-ds-text-tertiary">
          The wizard opens as soon as a vendor is selected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Services</h1>
          <p className="mt-1 text-ds-text-secondary">
            Publish and manage service listings. Drafts stay private to you until you publish.
          </p>
          {listError ? (
            <p className="mt-1 text-xs text-ds-status-error-text">{listError}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Tag color="blue" className="m-0">
              Total: {stats.total}
            </Tag>
            <Tag color="orange" className="m-0">
              Drafts: {stats.drafts}
            </Tag>
            <Tag color="green" className="m-0">
              Published: {stats.published}
            </Tag>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            icon={<ReloadOutlined />}
            loading={isRefreshing}
            onClick={() => void refresh(true)}
          >
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openWizard("new")}>
            New service listing
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table
          rowKey="id"
          loading={loadingList || isRefreshing}
          columns={columns}
          dataSource={services ?? []}
          pagination={{ defaultPageSize: 10 }}
          scroll={{ x: 760 }}
        />
      </div>
    </div>
  );
}

export default function OperationsServicesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ServicesWorkspace />
    </Suspense>
  );
}
