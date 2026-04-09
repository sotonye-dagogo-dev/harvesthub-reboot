"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Table, Button, Modal, message, Tag, Tooltip, Image } from "antd";
import type { ColumnsType } from "antd/es/table";
import { AdApplication } from "@/lib/types";
import { AD_BANNER_DIMENSIONS } from "@/lib/constants";
import { Eye, Check, X } from "lucide-react";
import { openActionConfirm, ActionConfirmBuilder } from "@/components/ui";

interface ApplicationRow extends AdApplication {
  key: string;
}

export default function OperationsAdsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [rateConfig, setRateConfig] = useState<{ hourlyRate: number; dailyRate: number } | null>(
    null
  );
  const [rateSaving, setRateSaving] = useState(false);

  const getEstimatedAmount = (row: ApplicationRow): number | null => {
    if (!rateConfig) return null;
    const durationType = row.durationType || "DAILY";
    const durationValue = row.durationValue || 1;
    const unitRate = durationType === "HOURLY" ? rateConfig.hourlyRate : rateConfig.dailyRate;
    return Math.round(unitRate * durationValue * 100) / 100;
  };

  const getExpectedActiveUntil = (row: ApplicationRow): Date | null => {
    const start = row.requestedStart ? new Date(row.requestedStart) : null;
    if (!start || Number.isNaN(start.getTime())) return null;
    const durationType = row.durationType || "DAILY";
    const durationValue = row.durationValue || 1;
    const activeUntil = new Date(start.getTime());
    if (durationType === "HOURLY") {
      activeUntil.setHours(activeUntil.getHours() + durationValue);
    } else {
      activeUntil.setDate(activeUntil.getDate() + durationValue);
    }
    return activeUntil;
  };

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
    const confirmConfig = new ActionConfirmBuilder()
      .title(status === "APPROVED" ? "Approve application" : "Reject application")
      .message(
        status === "APPROVED" ? "Approve this ad application?" : "Reject this ad application?"
      )
      .confirmText(status === "APPROVED" ? "Approve" : "Reject")
      .danger(status !== "APPROVED")
      .build();

    openActionConfirm(confirmConfig, async () => {
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
      title: "Payment",
      key: "payment",
      render: (_, record) => (
        <div className="text-xs">
          <p className="font-medium">{record.paymentMethod || "N/A"}</p>
          <p>Paid: NGN {(record.amountPaid || 0).toLocaleString("en-NG")}</p>
          {record.proofOfTransferUrl ? <p className="truncate">Proof uploaded</p> : <p>No proof</p>}
        </div>
      ),
    },
    {
      title: "Duration",
      key: "duration",
      render: (_, record) => {
        const durationType = record.durationType || "DAILY";
        const durationValue = record.durationValue || 1;
        const estimate = getEstimatedAmount(record);
        return (
          <div className="text-xs">
            <p className="font-medium">
              {durationValue} {durationType === "HOURLY" ? "hour" : "day"}
              {durationValue > 1 ? "s" : ""}
            </p>
            <p>Expected: {estimate !== null ? `NGN ${estimate.toLocaleString("en-NG")}` : "n/a"}</p>
          </div>
        );
      },
    },
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
                      {record.imageUrl ? (
                        <div className="my-2">
                          <Image
                            src={record.imageUrl}
                            alt="Ad creative"
                            width={320}
                            className="max-w-full rounded-ds-md"
                          />
                        </div>
                      ) : null}
                      <p>
                        <strong>Link:</strong> {record.linkUrl || "n/a"}
                      </p>
                      <p>
                        <strong>Payment:</strong> {record.paymentMethod || "N/A"} | NGN{" "}
                        {(record.amountPaid || 0).toLocaleString("en-NG")}
                      </p>
                      <p>
                        <strong>Proof of Transfer:</strong>{" "}
                        {record.proofOfTransferUrl ? (
                          <span>
                            <a href={record.proofOfTransferUrl} target="_blank" rel="noreferrer">
                              View proof
                            </a>
                            <div className="mt-2">
                              <Image
                                src={record.proofOfTransferUrl}
                                alt="Payment proof"
                                width={320}
                                className="max-w-full rounded-ds-md"
                              />
                            </div>
                          </span>
                        ) : (
                          "n/a"
                        )}
                      </p>
                      <p>
                        <strong>Duration:</strong> {record.durationValue || 1}{" "}
                        {record.durationType || "DAILY"}
                      </p>
                      <p>
                        <strong>Estimated Cost:</strong>{" "}
                        {getEstimatedAmount(record) !== null
                          ? `NGN ${getEstimatedAmount(record)!.toLocaleString("en-NG")}`
                          : "n/a"}
                      </p>
                      <p>
                        <strong>Schedule:</strong>{" "}
                        {new Date(record.requestedStart).toLocaleDateString()} -{" "}
                        {record.requestedEnd
                          ? new Date(record.requestedEnd).toLocaleDateString()
                          : "open"}
                      </p>
                      <p>
                        <strong>Computed Active Until:</strong>{" "}
                        {getExpectedActiveUntil(record)
                          ? getExpectedActiveUntil(record)!.toLocaleString()
                          : "n/a"}
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
            Top banner: {AD_BANNER_DIMENSIONS.topBanner.recommended.width}x
            {AD_BANNER_DIMENSIONS.topBanner.recommended.height} (ratio{" "}
            {AD_BANNER_DIMENSIONS.topBanner.recommended.ratio})
          </p>
          <p className="text-xs text-ds-text-secondary">
            Hero banner: {AD_BANNER_DIMENSIONS.heroBanner.recommended.width}x
            {AD_BANNER_DIMENSIONS.heroBanner.recommended.height} (ratio{" "}
            {AD_BANNER_DIMENSIONS.heroBanner.recommended.ratio})
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
