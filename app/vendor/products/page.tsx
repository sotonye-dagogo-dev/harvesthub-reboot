"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, Button, Badge, EmptyState } from "@/components/ui";
import { mockProducts } from "@/lib/data/mockData";
import type { Product } from "@/lib/types";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Input, Select, Table, Modal, message, Tag } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ProductCategory } from "@/lib/constants";

export default function VendorProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Redirect if not vendor
  if (user?.role !== "VENDOR") {
    router.push("/unauthorized");
    return null;
  }

  // Get vendor's products
  const vendorProducts = useMemo(() => {
    let filtered = mockProducts.filter((p) => p.vendorId === user?.id);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [user?.id, searchQuery, categoryFilter]);

  const handleDelete = (productId: string) => {
    Modal.confirm({
      title: "Delete Product",
      content: "Are you sure you want to delete this product? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        message.success("Product deleted successfully");
      },
    });
  };

  const handleToggleActive = (product: Product) => {
    message.success(
      `Product ${product.isActive ? "deactivated" : "activated"} successfully`
    );
  };

  const columns = [
    {
      title: "Product",
      key: "product",
      render: (_: unknown, record: Product) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg">
            <Image
              src={record.images?.[0] || "/placeholder-product.png"}
              alt={record.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{record.name}</p>
            <p className="text-xs text-gray-500">{record.category}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <span className="font-medium">{formatCurrency(price)}</span>
      ),
      sorter: (a: Product, b: Product) => a.price - b.price,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock: number) => (
        <Tag color={stock > 10 ? "green" : stock > 0 ? "orange" : "red"}>
          {stock > 0 ? `${stock} units` : "Out of stock"}
        </Tag>
      ),
      sorter: (a: Product, b: Product) => a.stock - b.stock,
    },
    {
      title: "Sales",
      dataIndex: "sales",
      key: "sales",
      render: (sales: number) => <span>{sales || 0}</span>,
      sorter: (a: Product, b: Product) => (a.sales || 0) - (b.sales || 0),
    },
    {
      title: "Rating",
      dataIndex: "averageRating",
      key: "rating",
      render: (rating: number, record: Product) => (
        <span>
          {(rating || 0).toFixed(1)} ⭐ ({record.totalReviews || 0})
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Badge variant={isActive ? "success" : "default"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Product) => (
        <div className="flex items-center gap-2">
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
            onClick={() => handleToggleActive(record)}
            title={record.isActive ? "Deactivate" : "Activate"}
          >
            {record.isActive ? (
              <ToggleRight className="h-4 w-4 text-green-500" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-gray-400" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(record.id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage your product listings ({vendorProducts.length} products)
          </p>
        </div>
        <Button onClick={() => message.info("Product creation form coming soon")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              prefix={<Search className="h-4 w-4 text-gray-400" />}
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
                label: cat.replace(/_/g, " "),
              })),
            ]}
          />
        </div>
      </Card>

      {/* Products Table */}
      {vendorProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No products yet"
          description="Start selling by adding your first product"
          action={
            <Button onClick={() => message.info("Product creation form coming soon")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Product
            </Button>
          }
        />
      ) : (
        <Card>
          <Table
            dataSource={vendorProducts}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 800 }}
          />
        </Card>
      )}
    </div>
  );
}
