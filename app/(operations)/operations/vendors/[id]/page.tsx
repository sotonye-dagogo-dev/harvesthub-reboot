"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Vendor, Product } from "@/lib/types";
import { StatusTag, PageLoader } from "@/components/ui";
import { message, Descriptions, Modal } from "antd";
import { Button, Card } from "@/components/ui";
import { openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import {
  ArrowLeft,
  Store,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  ShoppingBag,
  Star,
  FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type VerificationDocumentView = {
  label: string;
  filename: string;
  url: string;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const toNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export default function OperationsVendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchVendor = useCallback(async () => {
    try {
      const [vRes, pRes] = await Promise.all([
        fetch(`/api/vendors/${id}`),
        fetch(`/api/vendors/${id}/products`),
      ]);
      if (!vRes.ok) throw new Error("Vendor not found");
      const vData = await vRes.json();
      setVendor(vData.vendor);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData.products ?? []);
      }
    } catch {
      message.error("Failed to load vendor");
      router.push("/operations/vendors");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace("/");
      return;
    }
    fetchVendor();
  }, [user, authLoading, router, fetchVendor]);

  const updateVendorStatus = async (status: string, extraData?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extraData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      message.success(`Vendor ${status.toLowerCase()} successfully`);
      if (data?.emailDispatch?.attempted && !data?.emailDispatch?.sent) {
        message.warning("Status changed, but vendor review email was not delivered.");
      }
      setVendor(data.vendor);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
      setRejectModal(false);
    }
  };

  if (authLoading || loading) {
    return <PageLoader minHeight="min-h-[400px]" />;
  }

  if (!vendor) return null;

  const vendorRecord = asRecord(vendor);
  const analyticsRecord = asRecord(vendorRecord.analytics);
  const analytics = {
    totalSales: toNumber(analyticsRecord.totalSales, toNumber(vendorRecord.totalSales, 0)),
    averageRating: toNumber(analyticsRecord.averageRating, toNumber(vendorRecord.averageRating, 0)),
  };

  const verificationRecord = asRecord(vendor.businessVerification);
  const verificationDocs = (() => {
    const docsFromArray = Array.isArray(verificationRecord.verificationDocuments)
      ? (verificationRecord.verificationDocuments as unknown[])
          .map((item) => {
            const doc = asRecord(item);
            const url = typeof doc.url === "string" ? doc.url : "";
            if (!url) return null;

            const type =
              typeof doc.documentType === "string"
                ? doc.documentType.replace(/_/g, " ")
                : "Verification Document";

            return {
              label: type,
              filename:
                typeof doc.filename === "string" && doc.filename.trim().length > 0
                  ? doc.filename
                  : type,
              url,
            } as VerificationDocumentView;
          })
          .filter((item): item is VerificationDocumentView => Boolean(item))
      : [];

    if (docsFromArray.length > 0) return docsFromArray;

    const legacyMap: Array<{ key: string; label: string }> = [
      { key: "idDocumentUrl", label: "ID" },
      { key: "businessRegistrationUrl", label: "BUSINESS REGISTRATION" },
      { key: "utilityBillUrl", label: "UTILITY BILL" },
    ];

    return legacyMap
      .map(({ key, label }) => {
        const url = typeof verificationRecord[key] === "string" ? verificationRecord[key] : "";
        if (!url) return null;

        return {
          label,
          filename: `${label.toLowerCase().replace(/\s+/g, "-")}.pdf`,
          url,
        } as VerificationDocumentView;
      })
      .filter((item): item is VerificationDocumentView => Boolean(item));
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/operations/vendors")}
            className="rounded-ds-md p-2 text-ds-text-tertiary hover:bg-ds-surface-sunken"
            aria-label="Back to vendors"
            title="Back to vendors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-ds-text-primary flex items-center gap-2">
              <Store className="h-5 w-5 text-ds-text-brand" />
              {vendor.storeName}
            </h1>
            <p className="text-sm text-ds-text-tertiary">{vendor.category}</p>
          </div>
        </div>
        <StatusTag domain="vendor" status={vendor.status} className="text-sm px-3 py-1" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Vendor Details */}
          <Card>
            <h2 className="mb-4 text-base font-semibold text-ds-text-primary">Store Information</h2>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Store Name">{vendor.storeName}</Descriptions.Item>
              <Descriptions.Item label="Category">{vendor.category}</Descriptions.Item>
              <Descriptions.Item label="Campus">{vendor.campus}</Descriptions.Item>
              <Descriptions.Item label="Commission Rate">
                {vendor.commissionRate ?? 10}%
              </Descriptions.Item>
              {vendor.whatsappNumber && (
                <Descriptions.Item label="WhatsApp">{vendor.whatsappNumber}</Descriptions.Item>
              )}
              <Descriptions.Item label="Registered">
                {new Date(vendor.createdAt).toLocaleDateString("en-NG")}
              </Descriptions.Item>
              {vendor.storeDescription && (
                <Descriptions.Item label="Description" span={2}>
                  {vendor.storeDescription}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Verification Documents */}
          {vendor.businessVerification && (
            <Card>
              <h2 className="mb-4 text-base font-semibold text-ds-text-primary">
                Verification Documents
              </h2>
              {verificationDocs.length === 0 ? (
                <p className="text-sm text-ds-text-tertiary">No documents uploaded</p>
              ) : (
                <div className="space-y-3">
                  {verificationDocs.map((doc, idx) => (
                    <div
                      key={`${doc.label}-${idx}`}
                      className="flex items-center justify-between rounded-ds-md border border-ds-border-subtle p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-ds-text-brand" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-ds-text-tertiary">
                            {doc.label}
                          </p>
                          <p className="text-sm font-medium text-ds-text-primary">{doc.filename}</p>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-ds-text-brand hover:underline"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Products",
                value: products.length,
                icon: <Package className="h-5 w-5 text-ds-text-brand" />,
              },
              {
                label: "Total Sales",
                value: formatCurrency(analytics.totalSales),
                icon: <ShoppingBag className="h-5 w-5 text-ds-status-success-text" />,
              },
              {
                label: "Rating",
                value: analytics.averageRating ? `${analytics.averageRating.toFixed(1)} / 5` : "—",
                icon: <Star className="h-5 w-5 text-ds-status-warning-text" />,
              },
            ].map((stat) => (
              <Card key={stat.label}>
                <div className="flex items-center gap-3">
                  {stat.icon}
                  <div>
                    <p className="text-xs text-ds-text-tertiary">{stat.label}</p>
                    <p className="text-lg font-bold text-ds-text-primary">{stat.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Products Preview */}
          {products.length > 0 && (
            <Card>
              <h2 className="mb-4 text-base font-semibold text-ds-text-primary">
                Products ({products.length})
              </h2>
              <div className="divide-y divide-ds-border-subtle">
                {products.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-ds-text-primary">{p.name}</p>
                      <p className="text-xs text-ds-text-tertiary">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ds-text-brand">
                        {formatCurrency(p.price)}
                      </p>
                      <p className="text-xs text-ds-text-tertiary">Stock: {p.stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-base font-semibold text-ds-text-primary">Admin Actions</h2>
            <div className="space-y-3">
              {vendor.status === "PENDING" && (
                <>
                  <Button
                    className="w-full"
                    onClick={() =>
                      openActionConfirm(ActionConfirmPresets.approve("vendor"), () =>
                        updateVendorStatus("APPROVED")
                      )
                    }
                    disabled={actionLoading}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Vendor
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-ds-status-error/30 text-ds-status-error-text hover:bg-ds-status-error-bg"
                    onClick={() => setRejectModal(true)}
                    disabled={actionLoading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Application
                  </Button>
                </>
              )}
              {vendor.status === "APPROVED" && (
                <Button
                  variant="outline"
                  className="w-full border-ds-status-error/30 text-ds-status-error-text hover:bg-ds-status-error-bg"
                  onClick={() =>
                    openActionConfirm(ActionConfirmPresets.suspend("vendor"), () =>
                      updateVendorStatus("SUSPENDED")
                    )
                  }
                  disabled={actionLoading}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Suspend Vendor
                </Button>
              )}
              {vendor.status === "SUSPENDED" && (
                <Button
                  className="w-full"
                  onClick={() =>
                    openActionConfirm(ActionConfirmPresets.activate("vendor"), () =>
                      updateVendorStatus("APPROVED")
                    )
                  }
                  disabled={actionLoading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reinstate Vendor
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        title="Reject Vendor Application"
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        onOk={() => updateVendorStatus("REJECTED", { reason: rejectReason })}
        okText="Reject"
        okButtonProps={{ danger: true, loading: actionLoading }}
      >
        <p className="mb-3 text-ds-text-secondary">
          Please provide a reason for rejection (optional but recommended):
        </p>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          placeholder="e.g. Incomplete information, product category not permitted..."
          className="w-full rounded-ds-md border border-ds-border-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ds-focus-ring"
        />
      </Modal>
    </div>
  );
}
