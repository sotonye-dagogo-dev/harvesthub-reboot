"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, Button, EmptyState } from "@/components/ui";
import { getProductsClient } from "@/lib/data/clientDataFetchers";
import type { Vendor, User, Product } from "@/lib/types";
import { Store, Search, Eye, CheckCircle, XCircle, Ban, MapPin, RefreshCw } from "lucide-react";
import { StatusTag } from "@/components/ui";
import { Input, Select, Table, Modal, message, Tag, Tooltip } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { VendorStatus, CAMPUS_LOCATIONS } from "@/lib/constants";

export default function AdminVendorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  useEffect(() => {
    let mounted = true;
    async function loadVendors() {
      try {
        const [vendorsRes, usersRes, productsRes] = await Promise.all([
          (async () => {
            const r = await fetch("/api/vendors");
            return r.ok ? (await r.json()).data : null;
          })(),
          (async () => {
            const r = await fetch("/api/users");
            return r.ok ? (await r.json()).data : null;
          })(),
          getProductsClient(),
        ]);
        if (!mounted) return;
        if (Array.isArray(vendorsRes)) setVendors(vendorsRes);
        setAllUsers(Array.isArray(usersRes) ? usersRes : []);
        setAllProducts(Array.isArray(productsRes) ? productsRes : []);
      } catch (e) {
        if (!mounted) return;
        message.error("Unable to load vendor data. Please try again later.");
        setVendors([]);
        setAllUsers([]);
        setAllProducts([]);
      }
    }
    loadVendors();
    return () => {
      mounted = false;
    };
  }, []);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredVendors = useMemo(() => {
    let filtered = [...vendors];

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
      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, status, updatedAt: new Date() } : v))
      );
      return true;
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to update vendor status");
      return false;
    } finally {
      setLoadingId(null);
    }
  };

  const handleApprove = (vendorId: string) => {
    Modal.confirm({
      title: "Approve Vendor",
      content: "Approve this vendor? They will be able to list products and accept orders.",
      okText: "Approve",
      okButtonProps: { style: { backgroundColor: "#22c55e", borderColor: "#22c55e" } },
      onOk: async () => {
        const ok = await updateVendorStatus(vendorId, VendorStatus.APPROVED);
        if (ok) message.success("Vendor approved successfully");
      },
    });
  };

  const handleReject = (vendorId: string) => {
    Modal.confirm({
      title: "Reject Vendor",
      content:
        "Are you sure you want to reject this vendor application? The vendor will be notified.",
      okText: "Reject",
      okType: "danger",
      onOk: async () => {
        const ok = await updateVendorStatus(vendorId, VendorStatus.REJECTED);
        if (ok) message.warning("Vendor application rejected");
      },
    });
  };

  const handleSuspend = (vendorId: string) => {
    Modal.confirm({
      title: "Suspend Vendor",
      content: "Suspending this vendor will hide their store and products from buyers. Continue?",
      okText: "Suspend",
      okType: "danger",
      onOk: async () => {
        const ok = await updateVendorStatus(vendorId, VendorStatus.SUSPENDED);
        if (ok) message.warning("Vendor has been suspended");
      },
    });
  };

  const handleUnsuspend = (vendorId: string) => {
    Modal.confirm({
      title: "Reactivate Vendor",
      content: "Reactivate this vendor? Their store and products will become visible again.",
      okText: "Reactivate",
      okButtonProps: { style: { backgroundColor: "#22c55e", borderColor: "#22c55e" } },
      onOk: async () => {
        const ok = await updateVendorStatus(vendorId, VendorStatus.APPROVED);
        if (ok) message.success("Vendor reactivated successfully");
      },
    });
  };

  const getVendorUser = (vendor: Vendor) => allUsers.find((u) => u.id === vendor.userId);

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
              <Image
                src={record.storeLogo || vendorUser?.profilePicture || "/placeholder-avatar.png"}
                alt={record.storeName}
                fill
                className="object-cover"
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
            onClick={() => router.push(`/vendors/${record.id}`)}
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
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Vendor Management</h1>
        <p className="mt-1 text-ds-text-secondary">
          Manage vendor accounts and applications ({filteredVendors.length} vendors)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-ds-status-success-bg dark:bg-ds-status-success-bg/20">
          <p className="text-sm text-ds-text-secondary">Approved</p>
          <p className="text-2xl font-bold text-ds-status-success-text">
            {vendors.filter((v) => v.status === VendorStatus.APPROVED).length}
          </p>
        </Card>
        <Card className="bg-ds-status-warning-bg /20">
          <p className="text-sm text-ds-text-secondary">Pending</p>
          <p className="text-2xl font-bold text-ds-status-warning-text">
            {vendors.filter((v) => v.status === VendorStatus.PENDING).length}
          </p>
        </Card>
        <Card className="bg-ds-status-error-bg dark:bg-ds-status-error-bg/20">
          <p className="text-sm text-ds-text-secondary">Rejected</p>
          <p className="text-2xl font-bold text-ds-status-error-text">
            {vendors.filter((v) => v.status === VendorStatus.REJECTED).length}
          </p>
        </Card>
        <Card className="bg-ds-brand-surface dark:bg-ds-brand-subtle">
          <p className="text-sm text-ds-text-secondary">Suspended</p>
          <p className="text-2xl font-bold text-ds-text-brand">
            {vendors.filter((v) => v.status === VendorStatus.SUSPENDED).length}
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
          <Table
            dataSource={filteredVendors}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 900 }}
          />
        </Card>
      )}
    </div>
  );
}
