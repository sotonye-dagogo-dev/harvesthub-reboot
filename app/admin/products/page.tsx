"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, Button, Badge, EmptyState, stockLevelColor } from "@/components/ui";
import { mockProducts, mockVendors } from "@/lib/data/mockData";
import { getProductsClient, getVendorsClient } from "@/lib/data/clientDataFetchers";
import type { Product } from "@/lib/types";
import { Package, Search, Eye, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Input, Select, Table, Modal, Tag } from "antd";
import { useToast } from "@/lib/contexts/ToastContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ProductCategory, PRODUCT_CATEGORY_LABELS } from "@/lib/constants";

export default function AdminProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [products, setProducts] = useState<Product[]>([...mockProducts]);
  const [vendors, setVendors] = useState(() => [...mockVendors]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [p, v] = await Promise.all([getProductsClient(), getVendorsClient()]);
        if (!mounted) return;
        if (Array.isArray(p)) setProducts(p as Product[]);
        if (Array.isArray(v)) setVendors(v as any[]);
      } catch (e) {
        // keep mock fallback
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter((p) => p.isActive);
    } else if (statusFilter === "INACTIVE") {
      filtered = filtered.filter((p) => !p.isActive);
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [searchQuery, categoryFilter, statusFilter, products]);

  // Redirect if not admin
  if (user?.role !== "ADMIN") {
    router.push("/unauthorized");
    return null;
  }

  const getVendorName = (vendorId: string) =>
    vendors.find((v) => v.id === vendorId)?.storeName ||
    mockVendors.find((v) => v.id === vendorId)?.storeName ||
    "Unknown";

  const handleToggle = (product: Product) => {
    toast.success(`Product ${product.isActive ? "deactivated" : "activated"} successfully`);
  };

  const handleDelete = (_productId: string) => {
    Modal.confirm({
      title: "Delete Product",
      content: "Are you sure you want to remove this product from the platform?",
      okText: "Delete",
      okType: "danger",
      onOk: () => toast.success("Product removed"),
    });
  };

  const columns = [
    {
      title: "Product",
      key: "product",
      render: (_: unknown, record: Product) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-ds-md">
            <Image
              src={record.images?.[0] || "/placeholder-product.png"}
              alt={record.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-ds-text-primary">{record.name}</p>
            <p className="text-xs text-ds-text-tertiary">
              {PRODUCT_CATEGORY_LABELS[record.category] ?? record.category?.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Vendor",
      key: "vendor",
      render: (_: unknown, record: Product) => (
        <span className="text-sm">{getVendorName(record.vendorId)}</span>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => formatCurrency(price),
      sorter: (a: Product, b: Product) => a.price - b.price,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock: number) => (
        <Tag color={stockLevelColor(stock)}>{stock > 0 ? `${stock}` : "Out"}</Tag>
      ),
    },
    {
      title: "Sales",
      dataIndex: "sales",
      key: "sales",
      render: (sales: number) => sales || 0,
      sorter: (a: Product, b: Product) => (a.sales || 0) - (b.sales || 0),
    },
    {
      title: "Rating",
      key: "rating",
      render: (_: unknown, record: Product) => (
        <span>{(record.averageRating || 0).toFixed(1)} ⭐</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: unknown, record: Product) => (
        <Badge variant={record.isActive ? "success" : "default"}>
          {record.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Product) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/products/${record.id}`)}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggle(record)}
            title={record.isActive ? "Deactivate" : "Activate"}
          >
            {record.isActive ? (
              <ToggleRight className="h-4 w-4 text-ds-status-success" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-ds-text-placeholder" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)} title="Remove">
            <Trash2 className="h-4 w-4 text-ds-status-error" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Product Management</h1>
        <p className="mt-1 text-ds-text-secondary">
          Moderate and manage platform products ({filteredProducts.length} products)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-ds-brand-surface dark:bg-ds-brand-subtle">
          <p className="text-sm text-ds-text-secondary">Total</p>
          <p className="text-2xl font-bold text-ds-text-brand">{products.length}</p>
        </Card>
        <Card className="bg-ds-status-success-bg dark:bg-ds-status-success-bg/20">
          <p className="text-sm text-ds-text-secondary">Active</p>
          <p className="text-2xl font-bold text-ds-status-success-text">
            {products.filter((p) => p.isActive).length}
          </p>
        </Card>
        <Card className="bg-ds-status-error-bg dark:bg-ds-status-error-bg/20">
          <p className="text-sm text-ds-text-secondary">Out of Stock</p>
          <p className="text-2xl font-bold text-ds-status-error-text">
            {products.filter((p) => p.stock === 0).length}
          </p>
        </Card>
        <Card className="bg-ds-status-info-bg dark:bg-ds-status-info-bg/20">
          <p className="text-sm text-ds-text-secondary">Featured</p>
          <p className="text-2xl font-bold text-ds-status-info-text">
            {products.filter((p) => p.isFeatured).length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              prefix={<Search className="h-4 w-4 text-ds-text-placeholder" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            className="w-full sm:w-48"
            options={[
              { value: "ALL", label: "All Categories" },
              ...Object.values(ProductCategory).map((cat) => ({
                value: cat,
                label: PRODUCT_CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " "),
              })),
            ]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full sm:w-36"
            options={[
              { value: "ALL", label: "All Status" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
        </div>
      </Card>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No products found"
          description="No products match your search criteria"
        />
      ) : (
        <Card>
          <Table
            dataSource={filteredProducts}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1000 }}
          />
        </Card>
      )}
    </div>
  );
}
