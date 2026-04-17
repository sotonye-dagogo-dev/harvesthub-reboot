"use client";

import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { Card, Button, Badge, EmptyState } from "@/components/ui";
import { openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Ticket } from "lucide-react";
import { App, Form, Input, InputNumber, Modal, Select, Switch, DatePicker } from "antd";
import type { VoucherType } from "@/prisma/generated/client";
import dayjs from "dayjs";

interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  perUserLimit: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  _count?: { redemptions: number };
}

interface VouchersResponse {
  vouchers: Voucher[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function OperationsVouchersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { message } = App.useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchVouchers = useCallback(async (): Promise<Voucher[]> => {
    const res = await fetch("/api/admin/vouchers?limit=100");
    if (!res.ok) throw new Error("Failed to load vouchers");
    const data = await res.json() as VouchersResponse;
    return data.vouchers ?? [];
  }, []);

  const { data: vouchers = [], isLoading, error, mutate, refresh } = useSmartResource(fetchVouchers, {
    key: "operations-vouchers",
    refreshIntervalMs: 60_000,
    staleTimeMs: 10_000,
  });

  const activeCount = useMemo(() => vouchers.filter((v) => v.isActive).length, [vouchers]);
  const expiredCount = useMemo(() => {
    const now = new Date();
    return vouchers.filter((v) => new Date(v.validTo) < now).length;
  }, [vouchers]);

  if (user?.role !== "ADMIN") {
    router.push("/unauthorized");
    return null;
  }

  const handleCreate = () => {
    setEditingVoucher(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, perUserLimit: 1, type: "PERCENTAGE" });
    setShowModal(true);
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    form.setFieldsValue({
      type: voucher.type,
      value: voucher.value,
      minOrderAmount: voucher.minOrderAmount ?? undefined,
      maxDiscount: voucher.maxDiscount ?? undefined,
      usageLimit: voucher.usageLimit ?? undefined,
      perUserLimit: voucher.perUserLimit,
      validFrom: dayjs(voucher.validFrom),
      validTo: dayjs(voucher.validTo),
      isActive: voucher.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      const body = {
        ...values,
        validFrom: values.validFrom.toISOString(),
        validTo: values.validTo.toISOString(),
      };

      const url = editingVoucher
        ? `/api/admin/vouchers/${editingVoucher.id}`
        : "/api/admin/vouchers";
      const method = editingVoucher ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as { error?: string }));
        throw new Error((err as { error?: string }).error || "Failed to save voucher");
      }

      message.success(editingVoucher ? "Voucher updated" : "Voucher created");
      setShowModal(false);
      await refresh(true);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error(err instanceof Error ? err.message : "Failed to save voucher");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = (voucher: Voucher) => {
    openActionConfirm(
      voucher.isActive
        ? ActionConfirmPresets.suspend("voucher")
        : ActionConfirmPresets.activate("voucher"),
      async () => {
        try {
          const res = await fetch(`/api/admin/vouchers/${voucher.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !voucher.isActive }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({} as { error?: string }));
            throw new Error((err as { error?: string }).error || "Failed to update voucher");
          }
          mutate((prev) =>
            (prev ?? []).map((v) => (v.id === voucher.id ? { ...v, isActive: !voucher.isActive } : v))
          );
          message.success(`Voucher ${voucher.isActive ? "deactivated" : "activated"}`);
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Failed to update voucher");
        }
      }
    );
  };

  const handleDelete = (voucher: Voucher) => {
    openActionConfirm(ActionConfirmPresets.delete("voucher"), async () => {
      try {
        const res = await fetch(`/api/admin/vouchers/${voucher.id}`, { method: "DELETE" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({} as { error?: string }));
          throw new Error((err as { error?: string }).error || "Failed to delete voucher");
        }
        const data = await res.json() as { message?: string };
        mutate((prev) => (prev ?? []).filter((v) => v.id !== voucher.id));
        message.success(data.message ?? "Voucher removed");
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Failed to delete voucher");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ds-text-primary">
            <Ticket className="h-7 w-7 text-ds-text-brand" />
            Voucher Management
          </h1>
          <p className="mt-1 text-ds-text-secondary">
            Create and manage discount vouchers and coupons.
          </p>
          {error ? <p className="mt-1 text-xs text-ds-status-error-text">{error}</p> : null}
        </div>
        <Button onClick={handleCreate}>
          <>
            <Plus className="mr-2 h-4 w-4" />
            Create Voucher
          </>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-ds-brand-surface">
          <p className="text-sm text-ds-text-secondary">Total Vouchers</p>
          <p className="text-2xl font-bold text-ds-text-brand">{vouchers.length}</p>
        </Card>
        <Card className="bg-ds-status-success-bg">
          <p className="text-sm text-ds-text-secondary">Active</p>
          <p className="text-2xl font-bold text-ds-status-success-text">{activeCount}</p>
        </Card>
        <Card className="bg-ds-status-warning-bg">
          <p className="text-sm text-ds-text-secondary">Expired</p>
          <p className="text-2xl font-bold text-ds-status-warning-text">{expiredCount}</p>
        </Card>
        <Card className="bg-ds-status-info-bg">
          <p className="text-sm text-ds-text-secondary">Total Redemptions</p>
          <p className="text-2xl font-bold text-ds-status-info-text">
            {vouchers.reduce((sum, v) => sum + (v._count?.redemptions ?? 0), 0)}
          </p>
        </Card>
      </div>

      {/* Vouchers Table */}
      {isLoading ? (
        <Card><p className="text-ds-text-secondary">Loading vouchers...</p></Card>
      ) : vouchers.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ticket className="h-12 w-12" />}
            title="No vouchers yet"
            description="Create your first voucher to offer discounts to buyers."
            action={
              <Button onClick={handleCreate}>
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Voucher
                </>
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-ds-border-base bg-ds-surface-sunken">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">Type / Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">Usage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">Valid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => {
                  const now = new Date();
                  const expired = new Date(v.validTo) < now;
                  const label =
                    v.type === "PERCENTAGE" ? `${v.value}% off` : `${formatCurrency(v.value)} off`;
                  const usageLabel = v.usageLimit ? `${v.usedCount}/${v.usageLimit}` : `${v.usedCount} used`;
                  const redemptionsLabel = v._count?.redemptions ?? 0;

                  return (
                    <tr key={v.id} className="border-b border-ds-border-base last:border-0 hover:bg-ds-surface-sunken">
                      <td className="px-4 py-3 font-mono font-bold text-ds-text-brand">{v.code}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ds-text-primary">{label}</p>
                        {v.minOrderAmount ? (
                          <p className="text-xs text-ds-text-tertiary">Min. {formatCurrency(Number(v.minOrderAmount))}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ds-text-primary">{usageLabel}</p>
                        <p className="text-xs text-ds-text-tertiary">{redemptionsLabel} redemptions</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-ds-text-secondary">
                        <p>{new Date(v.validFrom).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</p>
                        <p>→ {new Date(v.validTo).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </td>
                      <td className="px-4 py-3">
                        {expired ? (
                          <Badge variant="warning">Expired</Badge>
                        ) : v.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="danger">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(v)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(v)}
                            title={v.isActive ? "Deactivate" : "Activate"}
                          >
                            {v.isActive ? (
                              <ToggleRight className="h-4 w-4 text-ds-status-success-text" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-ds-text-tertiary" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(v)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-ds-status-error" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={editingVoucher ? "Edit Voucher" : "Create Voucher"}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={() => void handleSubmit()}
        okButtonProps={{ loading: isSubmitting }}
        cancelButtonProps={{ disabled: isSubmitting }}
        okText={editingVoucher ? "Update" : "Create"}
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-4">
          {!editingVoucher && (
            <Form.Item
              name="code"
              label="Voucher Code (leave blank to auto-generate)"
            >
              <Input placeholder="e.g. SAVE20" style={{ textTransform: "uppercase" }} />
            </Form.Item>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="type"
              label="Discount Type"
              rules={[{ required: true, message: "Select type" }]}
            >
              <Select>
                <Select.Option value="PERCENTAGE">Percentage (%)</Select.Option>
                <Select.Option value="FIXED">Fixed Amount (₦)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="value"
              label="Value"
              rules={[{ required: true, message: "Enter value" }]}
            >
              <InputNumber min={0.01} className="w-full" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="minOrderAmount" label="Min. Order Amount (₦)">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item name="maxDiscount" label="Max Discount (₦, for %)">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="usageLimit" label="Global Usage Limit">
              <InputNumber min={1} className="w-full" placeholder="Unlimited" />
            </Form.Item>
            <Form.Item
              name="perUserLimit"
              label="Per User Limit"
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="validFrom"
              label="Valid From"
              rules={[{ required: true, message: "Required" }]}
            >
              <DatePicker showTime className="w-full" />
            </Form.Item>
            <Form.Item
              name="validTo"
              label="Valid To"
              rules={[{ required: true, message: "Required" }]}
            >
              <DatePicker showTime className="w-full" />
            </Form.Item>
          </div>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
