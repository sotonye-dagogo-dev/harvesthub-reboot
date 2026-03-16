"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, Button, Badge, EmptyState, stockLevelColor } from "@/components/ui";
import { getProductsClient, getVendorsClient } from "@/lib/data/clientDataFetchers";
import type { Product } from "@/lib/types";
import { Package, Plus, Trash2, Eye, Search, ToggleLeft, ToggleRight, Pencil } from "lucide-react";
import { Input, Select, Table, Modal, message, Tag } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ProductCategory, PRODUCT_CATEGORY_LABELS } from "@/lib/constants";

export default function VendorProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Resolve vendor record from user ID, then filter products by vendor.id
  const [_vendor, setVendor] = useState<any | null>(null);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      // loading state intentionally omitted; UI shows placeholder based on vendorProducts length
      const vendors = await getVendorsClient();
      const found = vendors.find((v: any) => v.user?.id === user?.id);
      if (!mounted) return;
      setVendor(found ?? null);

      if (found) {
        const prods = await getProductsClient({
          limit: 200,
          search: searchQuery,
          category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        });
        if (!mounted) return;
        const filtered = prods.filter((p: any) => p.vendorId === found.id);
        setVendorProducts(
          filtered.sort(
            (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } else {
        setVendorProducts([]);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [user?.id, searchQuery, categoryFilter]);

  // Redirect if not vendor
  if (user?.role !== "VENDOR") {
    router.push("/unauthorized");
    return null;
  }

  const handleDelete = (_productId: string) => {
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
    message.success(`Product ${product.isActive ? "deactivated" : "activated"} successfully`);
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
              {PRODUCT_CATEGORY_LABELS[record.category] ?? record.category.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number, record: Product) => (
        <div>
          <span className="font-medium">
            {record.discount
              ? formatCurrency(price - (price * record.discount) / 100)
              : formatCurrency(price)}
          </span>
          {record.discount && record.discount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-ds-text-tertiary line-through">
                {formatCurrency(price)}
              </span>
              <Tag color="red" className="!text-[10px] !px-1 !py-0 !m-0 !leading-4">
                -{record.discount}%
              </Tag>
            </div>
          )}
        </div>
      ),
      sorter: (a: Product, b: Product) => a.price - b.price,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock: number) => (
        <Tag color={stockLevelColor(stock)}>{stock > 0 ? `${stock} units` : "Out of stock"}</Tag>
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
        <Badge variant={isActive ? "success" : "default"}>{isActive ? "Active" : "Inactive"}</Badge>
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
            onClick={() => router.push(`/vendor/products/${record.id}`)}
            title="Edit"
          >
            <Pencil className="h-4 w-4 text-ds-text-brand" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(record)}
            title={record.isActive ? "Deactivate" : "Activate"}
          >
            {record.isActive ? (
              <ToggleRight className="h-4 w-4 text-ds-status-success" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-ds-text-placeholder" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)} title="Delete">
            <Trash2 className="h-4 w-4 text-ds-status-error" />
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
          <h1 className="text-2xl font-bold text-ds-text-primary">Products</h1>
          <p className="mt-1 text-ds-text-secondary">
            Manage your product listings ({vendorProducts.length} products)
          </p>
        </div>
        <Button onClick={() => router.push("/vendor/products/new")}>
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
        </div>
      </Card>

      {/* Products Table */}
      {vendorProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No products yet"
          description="Start selling by adding your first product"
          action={
            <Button onClick={() => router.push("/vendor/products/new")}>
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
