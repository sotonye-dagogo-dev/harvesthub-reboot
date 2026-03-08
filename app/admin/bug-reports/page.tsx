"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, EmptyState } from "@/components/ui";
import { BUG_REPORT_CATEGORIES, BUG_REPORT_PRIORITIES, BUG_REPORT_STATUSES } from "@/lib/constants";
import type { BugReport } from "@/lib/types";
import { Bug, Eye, Loader2, Filter, RefreshCw } from "lucide-react";
import { App, Table, Tag, Select, Modal, Input } from "antd";
import type { ColumnsType } from "antd/es/table";

const STATUS_COLORS: Record<string, string> = {
    OPEN: "orange",
    IN_PROGRESS: "blue",
    RESOLVED: "green",
    CLOSED: "default",
};

const PRIORITY_COLORS: Record<string, string> = {
    LOW: "default",
    MEDIUM: "blue",
    HIGH: "orange",
    CRITICAL: "red",
};

interface BugReportStats {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
}

export default function AdminBugReportsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { message } = App.useApp();

    const [reports, setReports] = useState<BugReport[]>([]);
    const [stats, setStats] = useState<BugReportStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [priorityFilter, setPriorityFilter] = useState<string>("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [detailModal, setDetailModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
    const [updating, setUpdating] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", "20");
            if (statusFilter) params.set("status", statusFilter);
            if (categoryFilter) params.set("category", categoryFilter);
            if (priorityFilter) params.set("priority", priorityFilter);

            const res = await fetch(`/api/bug-reports?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setReports(data.reports);
                setStats(data.stats);
                setTotal(data.pagination.total);
            }
        } catch {
            message.error("Failed to fetch bug reports");
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, categoryFilter, priorityFilter, message]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    // Redirect if not admin
    if (user?.role !== "ADMIN") {
        router.push("/unauthorized");
        return null;
    }

    const handleViewDetail = (report: BugReport) => {
        setSelectedReport(report);
        setAdminNotes(report.adminNotes ?? "");
        setDetailModal(true);
    };

    const handleStatusChange = async (reportId: string, newStatus: string) => {
        setUpdating(true);
        try {
            const res = await fetch(`/api/bug-reports/${reportId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(`Status updated to ${newStatus.replace("_", " ")}`);
                await fetchReports();
                if (selectedReport?.id === reportId) {
                    setSelectedReport(data.report);
                }
            } else {
                message.error(data.error || "Failed to update status");
            }
        } catch {
            message.error("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedReport) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/bug-reports/${selectedReport.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminNotes }),
            });
            const data = await res.json();
            if (data.success) {
                message.success("Notes saved");
                setSelectedReport(data.report);
                await fetchReports();
            } else {
                message.error(data.error || "Failed to save notes");
            }
        } catch {
            message.error("Failed to save notes");
        } finally {
            setUpdating(false);
        }
    };

    const getLabelFor = (
        list: { value: string; label: string }[],
        value: string
    ): string => {
        return list.find((item) => item.value === value)?.label ?? value;
    };

    const columns: ColumnsType<BugReport> = [
        {
            title: "Subject",
            dataIndex: "subject",
            key: "subject",
            ellipsis: true,
            width: 250,
        },
        {
            title: "Category",
            dataIndex: "category",
            key: "category",
            width: 140,
            render: (val: string) => getLabelFor(BUG_REPORT_CATEGORIES, val),
        },
        {
            title: "Priority",
            dataIndex: "priority",
            key: "priority",
            width: 100,
            render: (val: string) => (
                <Tag color={PRIORITY_COLORS[val]}>{getLabelFor(BUG_REPORT_PRIORITIES, val)}</Tag>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (val: string, record: BugReport) => (
                <Select
                    value={val}
                    size="small"
                    style={{ width: 120 }}
                    onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
                    options={BUG_REPORT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                />
            ),
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            ellipsis: true,
            width: 180,
        },
        {
            title: "Date",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 140,
            render: (val: string) => new Date(val).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
            }),
        },
        {
            title: "",
            key: "actions",
            width: 60,
            render: (_: unknown, record: BugReport) => (
                <button
                    onClick={() => handleViewDetail(record)}
                    className="rounded-ds-sm p-1 text-ds-text-secondary hover:bg-ds-surface-sunken hover:text-ds-text-brand"
                    aria-label="View details"
                >
                    <Eye className="h-4 w-4" />
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-ds-text-primary">Bug Reports</h1>
                    <p className="text-sm text-ds-text-secondary">
                        Review and manage user-submitted bug reports
                    </p>
                </div>
                <button
                    onClick={fetchReports}
                    className="flex items-center gap-2 rounded-ds-md border border-ds-border-base px-4 py-2 text-sm text-ds-text-secondary hover:bg-ds-surface-sunken"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    {[
                        { label: "Total", value: stats.total, color: "text-ds-text-primary" },
                        { label: "Open", value: stats.open, color: "text-orange-500" },
                        { label: "In Progress", value: stats.inProgress, color: "text-blue-500" },
                        { label: "Resolved", value: stats.resolved, color: "text-green-500" },
                        { label: "Closed", value: stats.closed, color: "text-ds-text-secondary" },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <div className="p-4 text-center">
                                <p className="text-xs text-ds-text-secondary">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Filters */}
            <Card>
                <div className="flex flex-wrap items-center gap-3 p-4">
                    <Filter className="h-4 w-4 text-ds-text-secondary" />
                    <Select
                        placeholder="Status"
                        value={statusFilter || undefined}
                        onChange={(val) => { setStatusFilter(val ?? ""); setPage(1); }}
                        allowClear
                        style={{ width: 140 }}
                        options={BUG_REPORT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                    />
                    <Select
                        placeholder="Category"
                        value={categoryFilter || undefined}
                        onChange={(val) => { setCategoryFilter(val ?? ""); setPage(1); }}
                        allowClear
                        style={{ width: 160 }}
                        options={BUG_REPORT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                    />
                    <Select
                        placeholder="Priority"
                        value={priorityFilter || undefined}
                        onChange={(val) => { setPriorityFilter(val ?? ""); setPage(1); }}
                        allowClear
                        style={{ width: 130 }}
                        options={BUG_REPORT_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
                    />
                </div>
            </Card>

            {/* Table */}
            {loading ? (
                <Card>
                    <div className="flex items-center justify-center p-16">
                        <Loader2 className="h-8 w-8 animate-spin text-ds-text-secondary" />
                    </div>
                </Card>
            ) : reports.length === 0 ? (
                <EmptyState
                    icon={<Bug className="h-12 w-12" />}
                    title="No bug reports"
                    description="No bug reports match the current filters."
                />
            ) : (
                <Card>
                    <Table
                        columns={columns}
                        dataSource={reports}
                        rowKey="id"
                        pagination={{
                            current: page,
                            pageSize: 20,
                            total,
                            onChange: (p) => setPage(p),
                            showTotal: (t) => `${t} reports`,
                        }}
                        scroll={{ x: 900 }}
                        size="middle"
                    />
                </Card>
            )}

            {/* Detail Modal */}
            <Modal
                open={detailModal}
                onCancel={() => setDetailModal(false)}
                title="Bug Report Details"
                footer={null}
                width={640}
            >
                {selectedReport && (
                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-ds-text-placeholder">Category</p>
                                <p className="font-medium text-ds-text-primary">
                                    {getLabelFor(BUG_REPORT_CATEGORIES, selectedReport.category)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-ds-text-placeholder">Priority</p>
                                <Tag color={PRIORITY_COLORS[selectedReport.priority]}>
                                    {getLabelFor(BUG_REPORT_PRIORITIES, selectedReport.priority)}
                                </Tag>
                            </div>
                            <div>
                                <p className="text-xs text-ds-text-placeholder">Status</p>
                                <Tag color={STATUS_COLORS[selectedReport.status]}>
                                    {getLabelFor(BUG_REPORT_STATUSES, selectedReport.status)}
                                </Tag>
                            </div>
                            <div>
                                <p className="text-xs text-ds-text-placeholder">Reporter Email</p>
                                <p className="font-medium text-ds-text-primary">{selectedReport.email}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-ds-text-placeholder">Subject</p>
                            <p className="font-semibold text-ds-text-primary">{selectedReport.subject}</p>
                        </div>

                        <div>
                            <p className="text-xs text-ds-text-placeholder">Details</p>
                            <p className="whitespace-pre-wrap text-sm text-ds-text-secondary">
                                {selectedReport.details}
                            </p>
                        </div>

                        {selectedReport.screenshotUrl && (
                            <div>
                                <p className="mb-1 text-xs text-ds-text-placeholder">Screenshot</p>
                                <a
                                    href={selectedReport.screenshotUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-ds-text-brand underline"
                                >
                                    View screenshot
                                </a>
                            </div>
                        )}

                        <div>
                            <p className="text-xs text-ds-text-placeholder">Reported At</p>
                            <p className="text-sm text-ds-text-secondary">
                                {new Date(selectedReport.createdAt).toLocaleString("en-NG")}
                            </p>
                        </div>

                        <hr className="border-ds-border-base" />

                        {/* Admin Actions */}
                        <div>
                            <p className="mb-2 text-sm font-semibold text-ds-text-primary">Update Status</p>
                            <Select
                                value={selectedReport.status}
                                onChange={(val) => handleStatusChange(selectedReport.id, val)}
                                style={{ width: 180 }}
                                options={BUG_REPORT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                                loading={updating}
                            />
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-semibold text-ds-text-primary">Admin Notes</p>
                            <Input.TextArea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={3}
                                placeholder="Add internal notes about this report..."
                            />
                            <button
                                onClick={handleSaveNotes}
                                disabled={updating}
                                className="mt-2 rounded-ds-sm bg-ds-brand-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-ds-brand-primary-hover disabled:opacity-60"
                            >
                                {updating ? "Saving..." : "Save Notes"}
                            </button>
                        </div>

                        {selectedReport.resolvedAt && (
                            <div className="rounded-ds-sm bg-ds-status-success-bg p-3">
                                <p className="text-xs text-ds-status-success">
                                    Resolved on {new Date(selectedReport.resolvedAt).toLocaleString("en-NG")}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
