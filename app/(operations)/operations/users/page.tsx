"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, Button, Badge, EmptyState } from "@/components/ui";
import { openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import type { User } from "@/lib/types";
import { Users, Search, Eye, Ban, CheckCircle, Trash2 } from "lucide-react";

import { StatusTag } from "@/components/ui";
import { Input, Select, Table, message, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { UserRole } from "@/lib/constants";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { emitDataMutated } from "@/lib/data-runtime/mutationBus";

export default function OperationsUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadUsersResource = useCallback(async (): Promise<User[]> => {
    const limit = 100;
    let page = 1;
    let totalPages = 1;
    const collected: User[] = [];

    while (page <= totalPages) {
      const res = await fetch(`/api/users?page=${page}&limit=${limit}`);
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const json = await res.json();
      const usersPayload = Array.isArray(json.users)
        ? json.users
        : Array.isArray(json.data)
          ? json.data
          : [];
      collected.push(...usersPayload);
      totalPages = Number(json?.pagination?.totalPages ?? 1);
      page += 1;
    }

    return collected;
  }, []);

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isRefreshing,
    error,
    mutate,
    refresh,
  } = useSmartResource(loadUsersResource, {
    key: "operations-users-resource",
    refreshIntervalMs: 90_000,
    staleTimeMs: 15_000,
  });

  const users = useMemo(() => usersData ?? [], [usersData]);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(query) ||
          u.lastName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.phoneNumber?.includes(query)
      );
    }

    if (roleFilter !== "ALL") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter((u) => u.isActive);
    } else if (statusFilter === "INACTIVE") {
      filtered = filtered.filter((u) => !u.isActive);
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [searchQuery, roleFilter, statusFilter, users]);

  const roleCounts = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((u) => u.role === UserRole.ADMIN).length,
      vendors: users.filter((u) => u.role === UserRole.VENDOR).length,
      buyers: users.filter((u) => u.role === UserRole.BUYER).length,
    }),
    [users]
  );

  if (user?.role !== "ADMIN") {
    router.push("/unauthorized");
    return null;
  }

  const handleToggleStatus = (targetUser: User) => {
    openActionConfirm(
      targetUser.isActive
        ? ActionConfirmPresets.suspend("user")
        : ActionConfirmPresets.activate("user"),
      async () => {
        try {
          const res = await fetch(`/api/users/${targetUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: targetUser.isActive ? "INACTIVE" : "ACTIVE",
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "Failed to update user status");

          const updatedStatus = targetUser.isActive ? "INACTIVE" : "ACTIVE";
          mutate((prev) =>
            (prev ?? []).map((item) =>
              item.id === targetUser.id
                ? { ...item, status: updatedStatus, isActive: updatedStatus === "ACTIVE" }
                : item
            )
          );
          message.success(`User ${targetUser.isActive ? "suspended" : "activated"} successfully`);
          emitDataMutated(["users", "operations-dashboard"]);
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Failed to update user status");
        }
      }
    );
  };

  const handleDelete = (userId: string) => {
    openActionConfirm(ActionConfirmPresets.delete("user"), async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to delete user");
        mutate((prev) => (prev ?? []).filter((item) => item.id !== userId));
        message.success("User deleted");
        emitDataMutated(["users", "operations-dashboard"]);
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Failed to delete user");
      }
    });
  };

  const columns = [
    {
      title: "User",
      key: "user",
      render: (_: unknown, record: User) => {
        const initials = `${record.firstName?.[0] ?? ""}${record.lastName?.[0] ?? ""}`.trim();

        return (
          <div className="flex items-center gap-3">
            <Avatar src={record.profilePicture || undefined} size={40} icon={<UserOutlined />}>
              {initials || undefined}
            </Avatar>
            <div>
              <p className="font-medium text-ds-text-primary">
                {record.firstName} {record.lastName}
              </p>
              <p className="text-xs text-ds-text-tertiary">{record.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      key: "phone",
      render: (phone: string) => <span className="text-sm">{phone || "N/A"}</span>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: UserRole) => <StatusTag domain="role" status={role} />,
      filters: Object.values(UserRole).map((r) => ({ text: r, value: r })),
      onFilter: (value: unknown, record: User) => record.role === value,
    },
    {
      title: "Verified",
      dataIndex: "emailVerified",
      key: "verified",
      render: (verified: boolean) =>
        verified ? (
          <StatusTag domain="user" status="ACTIVE" label="Verified" />
        ) : (
          <StatusTag domain="user" status="INACTIVE" label="Pending" color="orange" />
        ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: unknown, record: User) => (
        <Badge variant={record.isActive ? "success" : "danger"}>
          {record.isActive ? "Active" : "Suspended"}
        </Badge>
      ),
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string | Date) =>
        new Date(date).toLocaleDateString("en-NG", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      sorter: (a: User, b: User) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: User) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            title="View Profile"
            onClick={() => router.push(`/operations/users/${record.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(record)}
            title={record.isActive ? "Suspend" : "Activate"}
          >
            {record.isActive ? (
              <Ban className="h-4 w-4 text-ds-status-error" />
            ) : (
              <CheckCircle className="h-4 w-4 text-ds-status-success" />
            )}
          </Button>
          {record.role !== UserRole.ADMIN && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(record.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-ds-status-error" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">User Management</h1>
        <p className="mt-1 text-ds-text-secondary">
          Manage platform users and access control ({filteredUsers.length} users)
        </p>
        {isLoadingUsers ? (
          <p className="mt-1 text-xs text-ds-text-tertiary">Loading users...</p>
        ) : null}
        {isRefreshing ? (
          <p className="mt-1 text-xs text-ds-text-tertiary">Refreshing users...</p>
        ) : null}
        {error ? <p className="mt-1 text-xs text-ds-status-error-text">{error}</p> : null}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-ds-brand-surface dark:bg-ds-brand-subtle">
          <p className="text-sm text-ds-text-secondary">Total Users</p>
          <p className="text-2xl font-bold text-ds-text-brand">{roleCounts.total}</p>
        </Card>
        <Card className="bg-ds-status-info-bg dark:bg-ds-status-info-bg/20">
          <p className="text-sm text-ds-text-secondary">Vendors</p>
          <p className="text-2xl font-bold text-ds-status-info-text">{roleCounts.vendors}</p>
        </Card>
        <Card className="bg-ds-status-success-bg dark:bg-ds-status-success-bg/20">
          <p className="text-sm text-ds-text-secondary">Buyers</p>
          <p className="text-2xl font-bold text-ds-status-success-text">{roleCounts.buyers}</p>
        </Card>
        <Card className="bg-ds-status-warning-bg /20">
          <p className="text-sm text-ds-text-secondary">Admins</p>
          <p className="text-2xl font-bold text-ds-status-warning-text">{roleCounts.admins}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email or phone..."
              prefix={<Search className="h-4 w-4 text-ds-text-placeholder" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </div>
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            className="w-full sm:w-40"
            options={[
              { value: "ALL", label: "All Roles" },
              ...Object.values(UserRole).map((role) => ({
                value: role,
                label: role,
              })),
            ]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full sm:w-40"
            options={[
              { value: "ALL", label: "All Status" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Suspended" },
            ]}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={isRefreshing}
            onClick={() => void refresh(true)}
          >
            Refresh
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No users found"
          description="No users match your search criteria"
        />
      ) : (
        <Card>
          <Table
            dataSource={filteredUsers}
            columns={columns}
            rowKey="id"
            pagination={{ defaultPageSize: 10, showSizeChanger: true }}
            scroll={{ x: 900 }}
          />
        </Card>
      )}
    </div>
  );
}
