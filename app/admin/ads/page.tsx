"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Table, Button, Modal, message, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { AdApplication } from "@/lib/types";
import { AD_BANNER_DIMENSIONS } from "@/lib/constants";
import { Eye, Check, X } from "lucide-react";

interface ApplicationRow extends AdApplication {
  key: string;
}

export default function AdminAdsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [rateConfig, setRateConfig] = useState<{ hourlyRate: number; dailyRate: number } | null>(
    null
  );
  const [rateSaving, setRateSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      router.push("/unauthorized");
      return;
    }
    fetchApplications();
    fetchAdRateConfig();
  }, [user, router]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ad-applications");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      const list = (data.applications ?? []).map((app: any) => ({ ...app, key: app.id }));
      setApplications(list);
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Could not load applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdRateConfig = async () => {
    try {
      const res = await fetch("/api/admin/ads/rates");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch ad rate config");
      setRateConfig(data.rateConfig);
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Could not load ad rate config");
    }
  };

  const handleRateSave = async () => {
    if (!rateConfig) return;
    setRateSaving(true);
    try {
      const res = await fetch("/api/admin/ads/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rateConfig),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update ad rate config");
      setRateConfig(data.rateConfig);
      message.success("Ad rates updated successfully");
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Could not update ad rate config");
    } finally {
      setRateSaving(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: "APPROVED" | "REJECTED") => {
    const actionLabel = status === "APPROVED" ? "approve" : "reject";
    Modal.confirm({
      title: `Confirm ${actionLabel}`,
      content: `Are you sure you want to ${actionLabel} this application?`,
      onOk: async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/ad-applications/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status,
              reviewComment: `${actionLabel}d by admin`,
              createBanner: status === "APPROVED",
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to update");
          message.success(`Application ${actionLabel}d successfully`);
          fetchApplications();
        } catch (err: any) {
          console.error(err);
          message.error(err.message || "Could not update application");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const columns: ColumnsType<ApplicationRow> = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Company", dataIndex: "companyName", key: "companyName" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phoneNumber", key: "phoneNumber" },
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Position", dataIndex: "position", key: "position" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color = status === "APPROVED" ? "green" : status === "REJECTED" ? "red" : "orange";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Approve and create banner">
            <Button
              type="primary"
              icon={<Check />}
              size="small"
              onClick={() => handleStatusUpdate(record.id, "APPROVED")}
            >
              Approve
            </Button>
          </Tooltip>
          <Tooltip title="Reject application">
            <Button
              danger
              size="small"
              icon={<X />}
              onClick={() => handleStatusUpdate(record.id, "REJECTED")}
            >
              Reject
            </Button>
          </Tooltip>
          <Tooltip title="View details">
            <Button
              size="small"
              icon={<Eye />}
              onClick={() => {
                Modal.info({
                  title: "Ad application details",
                  content: (
                    <div>
                      <p>
                        <strong>Description:</strong> {record.description}
                      </p>
                      <p>
                        <strong>Image URL:</strong> {record.imageUrl}
                      </p>
                      <p>
                        <strong>Link:</strong> {record.linkUrl || "n/a"}
                      </p>
                      <p>
                        <strong>Schedule:</strong>{" "}
                        {new Date(record.requestedStart).toLocaleDateString()} -{" "}
                        {record.requestedEnd
                          ? new Date(record.requestedEnd).toLocaleDateString()
                          : "open"}
                      </p>
                    </div>
                  ),
                  onOk() {},
                });
              }}
            >
              View
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-4 text-3xl font-bold">Ad Applications</h1>
      <p className="mb-6 text-ds-text-secondary">
        Review and approve/reject incoming ad requests. Approved apps generate banner entries for
        rotation.
      </p>

      <div className="mb-8 rounded-ds-lg border border-ds-border-base p-5">
        <h2 className="text-xl font-semibold mb-3">Ad Rate Configuration</h2>
        <div className="mb-4 rounded-ds-md border border-ds-border-base bg-ds-surface-muted p-3">
          <p className="text-sm text-ds-text-secondary font-medium">Banner image recommendations</p>
          <p className="text-xs text-ds-text-secondary">
            Top banner: {AD_BANNER_DIMENSIONS.topBanner.recommended.width}x{AD_BANNER_DIMENSIONS.topBanner.recommended.height} (ratio {AD_BANNER_DIMENSIONS.topBanner.recommended.ratio})
          </p>
          <p className="text-xs text-ds-text-secondary">
            Hero banner: {AD_BANNER_DIMENSIONS.heroBanner.recommended.width}x{AD_BANNER_DIMENSIONS.heroBanner.recommended.height} (ratio {AD_BANNER_DIMENSIONS.heroBanner.recommended.ratio})
          </p>
          <p className="text-xs text-ds-text-secondary">Max file size 1MB, prefer WebP/AVIF.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-ds-text-secondary mb-1">
              Hourly Rate (NGN)
            </label>
            <input
              type="number"
              title="Hourly rate in NGN"
              placeholder="Hourly rate"
              className="w-full rounded-ds-md border border-ds-border-base p-2"
              value={rateConfig?.hourlyRate ?? 0}
              onChange={(e) =>
                setRateConfig((prev) => {
                  const base = prev ?? { hourlyRate: 0, dailyRate: 0 };
                  return { ...base, hourlyRate: Number(e.target.value) };
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ds-text-secondary mb-1">
              Daily Rate (NGN)
            </label>
            <input
              type="number"
              title="Daily rate in NGN"
              placeholder="Daily rate"
              className="w-full rounded-ds-md border border-ds-border-base p-2"
              value={rateConfig?.dailyRate ?? 0}
              onChange={(e) =>
                setRateConfig((prev) => {
                  const base = prev ?? { hourlyRate: 0, dailyRate: 0 };
                  return { ...base, dailyRate: Number(e.target.value) };
                })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-ds-md bg-ds-brand-primary py-2 px-4 text-white hover:bg-ds-brand-primary-hover"
              onClick={handleRateSave}
            >
              Update Rates
            </button>
            {rateSaving && <span className="text-sm text-ds-text-secondary">Saving...</span>}
          </div>
        </div>
      </div>

      <Table<ApplicationRow> dataSource={applications} columns={columns} loading={loading} />
    </div>
  );
}
