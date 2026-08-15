"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, Button, EmptyState, SectionLoader, VendorAvatar } from "@/components/ui";
import { openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import type { Vendor, User, Product } from "@/lib/types";
import { Store, Search, Eye, CheckCircle, XCircle, Ban, MapPin, RefreshCw } from "lucide-react";
import { StatusTag } from "@/components/ui";
import { Input, Select, Table, message, Tag, Tooltip } from "antd";
import { useRouter } from "next/navigation";
import { VendorStatus, CAMPUS_LOCATIONS } from "@/lib/constants";
import { useSmartResource } from "@/lib/hooks/useSmartResource";

type VendorsApiResponse = {
  vendors?: Vendor[];
  data?: Vendor[];
  pagination?: {
    totalPages?: number;
  };
};

async function fetchAllVendors(limit = 50): Promise<Vendor[]> {
  const collected: Vendor[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await fetch(`/api/vendors?includeAllStatuses=true&page=${page}&limit=${limit}`);
    if (!res.ok) {
      throw new Error("Failed to fetch vendors");
    }

    const data = (await res.json()) as VendorsApiResponse;
    const list = Array.isArray(data.vendors)
      ? data.vendors
      : Array.isArray(data.data)
        ? data.data
        : [];

    collected.push(...list);
    totalPages = Number(data?.pagination?.totalPages ?? 1);
    page += 1;
  }

  return collected;
}

type ProductsApiResponse = {
  products?: Product[];
  data?: Product[];
  pagination?: {
    totalPages?: number;
  };
};

async function fetchAllProducts(limit = 50): Promise<Product[]> {
  const collected: Product[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await fetch(`/api/products?isActive=true&page=${page}&limit=${limit}`);
    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = (await res.json()) as ProductsApiResponse;
    const list = Array.isArray(data.products)
      ? data.products
      : Array.isArray(data.data)
        ? data.data
        : [];

    collected.push(...list);
    totalPages = Number(data?.pagination?.totalPages ?? 1);
    page += 1;
  }

  return collected;
}

export default function OperationsVendorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const loadVendorsResource = useCallback(async () => {
    const [vendorsRes, productsRes] = await Promise.all([fetchAllVendors(), fetchAllProducts()]);

    const uniqueById = new Map<string, Vendor>();
    vendorsRes.forEach((vendor) => {
      uniqueById.set(vendor.id, vendor);
    });

    return {
      vendors: Array.from(uniqueById.values()),
      allProducts: Array.isArray(productsRes) ? productsRes : [],
    };
  }, []);

  const {
    data: resource,
    isLoading,
    isRefreshing,
    error,
    mutate,
    refresh,
  } = useSmartResource(loadVendorsResource, {
    key: "operations-vendors-resource",
    refreshIntervalMs: 90_000,
    staleTimeMs: 15_000,
  });

  const vendors = resource?.vendors;
  const vendorsList = vendors ?? [];
  const allProducts = resource?.allProducts ?? [];
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredVendors = useMemo(() => {
    let filtered = [...(vendors ?? [])];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.storeName.toLowerCase().includes(query) ||
          v.storeDescription?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [vendors, searchQuery, statusFilter]);

  // Redirect if not admin
  if (user?.role !== "ADMIN") {
    router.push("/unauthorized");
    return null;
  }

  const updateVendorStatus = async (vendorId: string, status: VendorStatus) => {
    setLoadingId(vendorId);
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      const emailDispatchFailed =
        data?.emailDispatch?.attempted && !data?.emailDispatch?.sent;

      mutate((prev) => {
        if (!prev) {
          return { vendors: [], allProducts: [] };
        }
        return {
          ...prev,
          vendors: prev.vendors.map((vendor) =>
            vendor.id === vendorId ? { ...vendor, status, updatedAt: new Date() } : vendor
          ),
        };
      });

      if (status === VendorStatus.APPROVED || status === VendorStatus.REJECTED) {
        void refresh(true);
      }
      return { ok: true, emailDispatchFailed };
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to update vendor status");
      return { ok: false, emailDispatchFailed: false };
    } finally {
      setLoadingId(null);
    }
  };

  const handleApprove = (vendorId: string) => {
    openActionConfirm(ActionConfirmPresets.approve("vendor"), async () => {
      const result = await updateVendorStatus(vendorId, VendorStatus.APPROVED);
      if (result?.ok) {
        if (result.emailDispatchFailed) {
          message.warning(
            "Vendor approved, but the review email couldn't be delivered. You may need to contact them directly."
          );
        } else {
          message.success("Vendor approved successfully");
        }
      }
    });
  };

  const handleReject = (vendorId: string) => {
    openActionConfirm(ActionConfirmPresets.reject("vendor"), async () => {
      const result = await updateVendorStatus(vendorId, VendorStatus.REJECTED);
      if (result?.ok) {
        if (result.emailDispatchFailed) {
          message.warning(
            "Vendor application rejected, but the review email couldn't be delivered. You may need to contact them directly."
          );
        } else {
          message.warning("Vendor application rejected");
        }
      }
    });
  };

  const handleSuspend = (vendorId: string) => {
    openActionConfirm(ActionConfirmPresets.suspend("vendor"), async () => {
      const ok = await updateVendorStatus(vendorId, VendorStatus.SUSPENDED);
      if (ok) message.warning("Vendor has been suspended");
    });
  };

  const handleUnsuspend = (vendorId: string) => {
    openActionConfirm(ActionConfirmPresets.activate("vendor"), async () => {
      const ok = await updateVendorStatus(vendorId, VendorStatus.APPROVED);
      if (ok) message.success("Vendor reactivated successfully");
    });
  };

  const getVendorUser = (vendor: Vendor) => vendor.user as User | undefined;

  const getVendorProductCount = (vendorId: string) =>
    allProducts.filter((p) => p.vendorId === vendorId).length;

  const columns = [
    {
      title: "Store",
      key: "store",
      render: (_: unknown, record: Vendor) => {
        const vendorUser = getVendorUser(record);
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-ds-full">
              <VendorAvatar
                src={record.storeLogo || vendorUser?.profilePicture || "/placeholder-avatar.png"}
                alt={record.storeName}
                label={record.storeName}
                className="h-10 w-10"
              />
            </div>
            <div>
              <p className="font-medium text-ds-text-primary">{record.storeName}</p>
              <p className="text-xs text-ds-text-tertiary">
                {vendorUser?.firstName} {vendorUser?.lastName}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category: string) => <Tag>{category?.replace(/_/g, " ") || "N/A"}</Tag>,
    },
    {
      title: "Campus",
      dataIndex: "campus",
      key: "campus",
      render: (campus: string) => {
        const loc = CAMPUS_LOCATIONS.find((l) => l.value === campus);
        return (
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3" />
            {loc?.label || campus || "N/A"}
          </div>
        );
      },
    },
    {
      title: "Products",
      key: "products",
      render: (_: unknown, record: Vendor) => <span>{getVendorProductCount(record.id)}</span>,
    },
    {
      title: "Rating",
      key: "rating",
      render: (_: unknown, record: Vendor) => (
        <span>{(record.analytics?.averageRating || 0).toFixed(1)} ⭐</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <StatusTag domain="vendor" status={status} />,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Vendor) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/operations/vendors/${record.id}`)}
            title="View Store"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {record.status === VendorStatus.PENDING && (
            <>
              <Tooltip title="Approve">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApprove(record.id)}
                  disabled={loadingId === record.id}
                >
                  <CheckCircle className="h-4 w-4 text-ds-status-success" />
                </Button>
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReject(record.id)}
                  disabled={loadingId === record.id}
                >
                  <XCircle className="h-4 w-4 text-ds-status-error" />
                </Button>
              </Tooltip>
            </>
          )}
          {record.status === VendorStatus.APPROVED && (
            <Tooltip title="Suspend">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSuspend(record.id)}
                disabled={loadingId === record.id}
              >
                <Ban className="h-4 w-4 text-ds-status-warning" />
              </Button>
            </Tooltip>
          )}
          {record.status === VendorStatus.SUSPENDED && (
            <Tooltip title="Reactivate">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnsuspend(record.id)}
                disabled={loadingId === record.id}
              >
                <RefreshCw className="h-4 w-4 text-ds-status-success" />
              </Button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Vendor Management</h1>
          <p className="mt-1 text-ds-text-secondary">
            Manage vendor accounts and applications ({filteredVendors.length} vendors)
          </p>
          {isRefreshing ? (
            <p className="mt-1 text-xs text-ds-text-tertiary">Refreshing vendor data...</p>
          ) : null}
          {error ? <p className="mt-1 text-xs text-ds-status-error-text">{error}</p> : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh(true)}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading && (vendors?.length ?? 0) === 0 ? <SectionLoader /> : null}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-ds-status-success-bg dark:bg-ds-status-success-bg/20">
          <p className="text-sm text-ds-text-secondary">Approved</p>
          <p className="text-2xl font-bold text-ds-status-success-text">
            {vendorsList.filter((v) => v.status === VendorStatus.APPROVED).length}
          </p>
        </Card>
        <Card className="bg-ds-status-warning-bg /20">
          <p className="text-sm text-ds-text-secondary">Pending</p>
          <p className="text-2xl font-bold text-ds-status-warning-text">
            {vendorsList.filter((v) => v.status === VendorStatus.PENDING).length}
          </p>
        </Card>
        <Card className="bg-ds-status-error-bg dark:bg-ds-status-error-bg/20">
          <p className="text-sm text-ds-text-secondary">Rejected</p>
          <p className="text-2xl font-bold text-ds-status-error-text">
            {vendorsList.filter((v) => v.status === VendorStatus.REJECTED).length}
          </p>
        </Card>
        <Card className="bg-ds-brand-surface dark:bg-ds-brand-subtle">
          <p className="text-sm text-ds-text-secondary">Suspended</p>
          <p className="text-2xl font-bold text-ds-text-brand">
            {vendorsList.filter((v) => v.status === VendorStatus.SUSPENDED).length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search vendors..."
              prefix={<Search className="h-4 w-4 text-ds-text-placeholder" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full sm:w-48"
            options={[
              { value: "ALL", label: "All Statuses" },
              ...Object.values(VendorStatus).map((s) => ({
                value: s,
                label: s,
              })),
            ]}
          />
        </div>
      </Card>

      {/* Vendors Table */}
      {filteredVendors.length === 0 ? (
        <EmptyState
          icon={<Store className="h-12 w-12" />}
          title="No vendors found"
          description="No vendors match your search criteria"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table
              dataSource={filteredVendors}
              columns={columns}
              rowKey="id"
              pagination={{ defaultPageSize: 10, showSizeChanger: true }}
              scroll={{ x: 900 }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
