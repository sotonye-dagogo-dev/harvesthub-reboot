"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, Button, Badge, EmptyState } from "@/components/ui";
import { mockVendors, mockUsers, mockProducts } from "@/lib/data/mockData";
import type { Vendor } from "@/lib/types";
import { Store, Search, Eye, CheckCircle, XCircle, Ban, MapPin } from "lucide-react";
import { Input, Select, Table, Modal, message, Tag } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { VendorStatus, CAMPUS_LOCATIONS, VENDOR_CATEGORIES } from "@/lib/constants";

export default function AdminVendorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Redirect if not admin
  if (user?.role !== "ADMIN") {
    router.push("/unauthorized");
    return null;
  }

  const filteredVendors = useMemo(() => {
    let filtered = [...mockVendors];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.storeName.toLowerCase().includes(query) || v.description?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [searchQuery, statusFilter]);

  const handleApprove = (vendorId: string) => {
    message.success("Vendor approved successfully");
  };

  const handleReject = (vendorId: string) => {
    Modal.confirm({
      title: "Reject Vendor",
      content: "Are you sure you want to reject this vendor application?",
      okText: "Reject",
      okType: "danger",
      onOk: () => message.success("Vendor rejected"),
    });
  };

  const handleSuspend = (vendorId: string) => {
    Modal.confirm({
      title: "Suspend Vendor",
      content: "Are you sure you want to suspend this vendor?",
      okText: "Suspend",
      okType: "danger",
      onOk: () => message.success("Vendor suspended"),
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
                src={record.logoUrl || vendorUser?.profilePicture || "/placeholder-avatar.png"}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleApprove(record.id)}
                title="Approve"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReject(record.id)}
                title="Reject"
              >
                <XCircle className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
          {record.status === VendorStatus.APPROVED && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSuspend(record.id)}
              title="Suspend"
            >
              <Ban className="h-4 w-4 text-orange-500" />
            </Button>
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
            {mockVendors.filter((v) => v.status === VendorStatus.APPROVED).length}
          </p>
        </Card>
        <Card className="bg-orange-50 dark:bg-orange-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-orange-600">
            {mockVendors.filter((v) => v.status === VendorStatus.PENDING).length}
          </p>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
          <p className="text-2xl font-bold text-red-600">
            {mockVendors.filter((v) => v.status === VendorStatus.REJECTED).length}
          </p>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-purple-600">{mockVendors.length}</p>
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
