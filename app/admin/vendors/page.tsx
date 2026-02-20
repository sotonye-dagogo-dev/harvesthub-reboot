"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, Button, EmptyState } from "@/components/ui";
import { mockVendors, mockUsers, mockProducts } from "@/lib/data/mockData";
import type { Vendor } from "@/lib/types";
import { Store, Search, Eye, CheckCircle, XCircle, Ban, MapPin, RefreshCw } from "lucide-react";
import { Input, Select, Table, Modal, message, Tag, Tooltip } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { VendorStatus, CAMPUS_LOCATIONS } from "@/lib/constants";

export default function AdminVendorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [vendors, setVendors] = useState<Vendor[]>([...mockVendors]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredVendors = useMemo(() => {
    let filtered = [...vendors];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.storeName.toLowerCase().includes(query) || v.storeDescription?.toLowerCase().includes(query)
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
      content: "Are you sure you want to reject this vendor application? The vendor will be notified.",
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

  const getVendorUser = (vendor: Vendor) => mockUsers.find((u) => u.id === vendor.userId);

  const getVendorProductCount = (vendorId: string) =>
    mockProducts.filter((p) => p.vendorId === vendorId).length;

  const statusColors: Record<string, string> = {
    APPROVED: "green",
    PENDING: "orange",
    REJECTED: "red",
    SUSPENDED: "volcano",
  };

  const columns = [
    {
      title: "Store",
      key: "store",
      render: (_: unknown, record: Vendor) => {
        const vendorUser = getVendorUser(record);
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image
                src={record.storeLogo || vendorUser?.profilePicture || "/placeholder-avatar.png"}
                alt={record.storeName}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{record.storeName}</p>
              <p className="text-xs text-gray-500">
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
      render: (status: string) => <Tag color={statusColors[status] || "default"}>{status}</Tag>,
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
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </Button>
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReject(record.id)}
                  disabled={loadingId === record.id}
                >
                  <XCircle className="h-4 w-4 text-red-500" />
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
                <Ban className="h-4 w-4 text-orange-500" />
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
                <RefreshCw className="h-4 w-4 text-green-500" />
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Management</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage vendor accounts and applications ({filteredVendors.length} vendors)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-green-50 dark:bg-green-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
          <p className="text-2xl font-bold text-green-600">
            {vendors.filter((v) => v.status === VendorStatus.APPROVED).length}
          </p>
        </Card>
        <Card className="bg-orange-50 dark:bg-orange-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-orange-600">
            {vendors.filter((v) => v.status === VendorStatus.PENDING).length}
          </p>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
          <p className="text-2xl font-bold text-red-600">
            {vendors.filter((v) => v.status === VendorStatus.REJECTED).length}
          </p>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Suspended</p>
          <p className="text-2xl font-bold text-purple-600">
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
              prefix={<Search className="h-4 w-4 text-gray-400" />}
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
