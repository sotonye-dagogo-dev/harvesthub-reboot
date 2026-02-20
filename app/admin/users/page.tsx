"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, Button, Badge, EmptyState } from "@/components/ui";
import { mockUsers } from "@/lib/data/mockData";
import type { User } from "@/lib/types";
import { Users, Search, Eye, Ban, CheckCircle, Trash2 } from "lucide-react";
import { Input, Select, Table, Modal, message, Tag, Avatar } from "antd";
import { useRouter } from "next/navigation";
import { UserRole } from "@/lib/constants";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredUsers = useMemo(() => {
    let filtered = [...mockUsers];

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
  }, [searchQuery, roleFilter, statusFilter]);

  const roleCounts = useMemo(
    () => ({
      total: mockUsers.length,
      admins: mockUsers.filter((u) => u.role === UserRole.ADMIN).length,
      vendors: mockUsers.filter((u) => u.role === UserRole.VENDOR).length,
      buyers: mockUsers.filter((u) => u.role === UserRole.BUYER).length,
    }),
    []
  );

  if (user?.role !== "ADMIN") {
    router.push("/unauthorized");
    return null;
  }

  const handleToggleStatus = (targetUser: User) => {
    message.success(`User ${targetUser.isActive ? "suspended" : "activated"} successfully`);
  };

  const handleDelete = (_userId: string) => {
    Modal.confirm({
      title: "Delete User",
      content:
        "Are you sure you want to permanently delete this user? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => message.success("User deleted"),
    });
  };

  const roleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "purple";
      case UserRole.VENDOR:
        return "blue";
      case UserRole.BUYER:
        return "green";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "User",
      key: "user",
      render: (_: unknown, record: User) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.profilePicture} size={40}>
            {record.firstName[0]}
            {record.lastName[0]}
          </Avatar>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {record.firstName} {record.lastName}
            </p>
            <p className="text-xs text-gray-500">{record.email}</p>
          </div>
        </div>
      ),
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
      render: (role: UserRole) => <Tag color={roleColor(role)}>{role}</Tag>,
      filters: Object.values(UserRole).map((r) => ({ text: r, value: r })),
      onFilter: (value: unknown, record: User) => record.role === value,
    },
    {
      title: "Verified",
      dataIndex: "emailVerified",
      key: "verified",
      render: (verified: boolean) =>
        verified ? <Tag color="green">Verified</Tag> : <Tag color="orange">Pending</Tag>,
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
          <Button variant="ghost" size="sm" title="View Profile">
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(record)}
            title={record.isActive ? "Suspend" : "Activate"}
          >
            {record.isActive ? (
              <Ban className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </Button>
          {record.role !== UserRole.ADMIN && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(record.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage platform users and access control ({filteredUsers.length} users)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-purple-50 dark:bg-purple-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
          <p className="text-2xl font-bold text-purple-600">{roleCounts.total}</p>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Vendors</p>
          <p className="text-2xl font-bold text-blue-600">{roleCounts.vendors}</p>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Buyers</p>
          <p className="text-2xl font-bold text-green-600">{roleCounts.buyers}</p>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
          <p className="text-2xl font-bold text-amber-600">{roleCounts.admins}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email or phone..."
              prefix={<Search className="h-4 w-4 text-gray-400" />}
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
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 900 }}
          />
        </Card>
      )}
    </div>
  );
}
