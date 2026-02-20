"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import type { User } from "@/lib/types";
import { message, Spin, Tag, Descriptions, Modal } from "antd";
import { Button, Card } from "@/components/ui";
import { ArrowLeft, User as UserIcon, ShieldCheck, ShieldOff, Trash2, Mail, Phone } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
    BUYER: "blue",
    VENDOR: "purple",
    ADMIN: "red",
};

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "green",
    INACTIVE: "default",
    BANNED: "red",
};

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user: currentUser, isLoading: authLoading } = useAuth();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch(`/api/users/${id}`);
            if (!res.ok) throw new Error("User not found");
            const data = await res.json();
            setProfileUser(data.user);
        } catch {
            message.error("Failed to load user");
            router.push("/admin/users");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (authLoading) return;
        if (!currentUser) { router.replace("/login"); return; }
        if (currentUser.role !== "ADMIN") { router.replace("/"); return; }
        fetchUser();
    }, [currentUser, authLoading, router, fetchUser]);

    const updateUser = async (updates: Partial<User>) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Update failed");
            message.success("User updated successfully");
            setProfileUser(data.user);
        } catch (err) {
            message.error(err instanceof Error ? err.message : "Action failed");
        } finally {
            setActionLoading(false);
        }
    };

    const deleteUser = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            message.success("User deleted");
            router.push("/admin/users");
        } catch {
            message.error("Failed to delete user");
        } finally {
            setActionLoading(false);
            setDeleteModal(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    if (!profileUser) return null;

    const isSelf = currentUser?.id === profileUser.id;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/admin/users")}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Back to users"
                        title="Back to users"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-purple-600" />
                            {profileUser.firstName} {profileUser.lastName}
                        </h1>
                        <p className="text-sm text-gray-500">{profileUser.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Tag color={ROLE_COLORS[profileUser.role]}>{profileUser.role}</Tag>
                    <Tag color={STATUS_COLORS[profileUser.status ?? "ACTIVE"]}>
                        {profileUser.status ?? "ACTIVE"}
                    </Tag>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* User Details */}
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                            User Information
                        </h2>
                        <Descriptions column={2} size="small">
                            <Descriptions.Item label="Full Name">
                                {profileUser.firstName} {profileUser.lastName}
                            </Descriptions.Item>
                            <Descriptions.Item label="Role">{profileUser.role}</Descriptions.Item>
                            <Descriptions.Item label="Email">
                                <span className="flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5" />
                                    {profileUser.email}
                                </span>
                            </Descriptions.Item>
                            {profileUser.phoneNumber && (
                                <Descriptions.Item label="Phone">
                                    <span className="flex items-center gap-1">
                                        <Phone className="h-3.5 w-3.5" />
                                        {profileUser.phoneNumber}
                                    </span>
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Joined">
                                {new Date(profileUser.createdAt).toLocaleDateString("en-NG", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={STATUS_COLORS[profileUser.status ?? "ACTIVE"]}>
                                    {profileUser.status ?? "ACTIVE"}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </div>

                {/* Admin Actions */}
                {!isSelf && (
                    <div className="space-y-4">
                        <Card>
                            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                                Admin Actions
                            </h2>
                            <div className="space-y-3">
                                {(profileUser.status ?? "ACTIVE") === "ACTIVE" ? (
                                    <Button
                                        variant="outline"
                                        className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                                        onClick={() => updateUser({ status: "INACTIVE" })}
                                        disabled={actionLoading}
                                    >
                                        <ShieldOff className="mr-2 h-4 w-4" />
                                        Deactivate Account
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        onClick={() => updateUser({ status: "ACTIVE" })}
                                        disabled={actionLoading}
                                    >
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Activate Account
                                    </Button>
                                )}

                                {(profileUser.status ?? "ACTIVE") !== "BANNED" ? (
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={() => updateUser({ status: "BANNED" })}
                                        disabled={actionLoading}
                                    >
                                        Ban User
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => updateUser({ status: "ACTIVE" })}
                                        disabled={actionLoading}
                                    >
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Unban User
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    className="w-full border-red-600 text-red-600 hover:bg-red-50"
                                    onClick={() => setDeleteModal(true)}
                                    disabled={actionLoading}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Account
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Delete Confirmation */}
            <Modal
                title="Delete User Account"
                open={deleteModal}
                onCancel={() => setDeleteModal(false)}
                onOk={deleteUser}
                okText="Delete Permanently"
                okButtonProps={{ danger: true, loading: actionLoading }}
            >
                <p className="text-gray-700">
                    Are you absolutely sure you want to permanently delete{" "}
                    <strong>{profileUser.firstName} {profileUser.lastName}</strong>? This action cannot be
                    undone and all related data will be lost.
                </p>
            </Modal>
        </div>
    );
}
