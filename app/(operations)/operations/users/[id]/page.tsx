"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import type { User } from "@/lib/types";
import { StatusTag, PageLoader } from "@/components/ui";
import { message, Descriptions } from "antd";
import { Button, Card } from "@/components/ui";
import { openActionConfirm, ActionConfirmBuilder, ActionConfirmPresets } from "@/components/ui";
import {
  ArrowLeft,
  User as UserIcon,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Mail,
  Phone,
  ChevronDown,
} from "lucide-react";
import { UserRole } from "@/lib/constants";

export default function OperationsUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${id}`);
      if (!res.ok) throw new Error("User not found");
      const data = await res.json();
      setProfileUser(data.user);
    } catch {
      message.error("Failed to load user");
      router.push("/operations/users");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (currentUser.role !== "ADMIN") {
      router.replace("/");
      return;
    }
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
      router.push("/operations/users");
    } catch {
      message.error("Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return <PageLoader minHeight="min-h-[400px]" />;
  }

  if (!profileUser) return null;

  const isSelf = currentUser?.id === profileUser.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/operations/users")}
            className="rounded-ds-md p-2 text-ds-text-tertiary hover:bg-ds-surface-sunken"
            aria-label="Back to users"
            title="Back to users"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-ds-text-primary flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-ds-text-brand" />
              {profileUser.firstName} {profileUser.lastName}
            </h1>
            <p className="text-sm text-ds-text-tertiary">{profileUser.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusTag domain="role" status={profileUser.role} />
          <StatusTag domain="user" status={profileUser.status ?? "ACTIVE"} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Details */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-base font-semibold text-ds-text-primary">User Information</h2>
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
                <StatusTag domain="user" status={profileUser.status ?? "ACTIVE"} />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        {/* Admin Actions */}
        {!isSelf && (
          <div className="space-y-4">
            <Card>
              <h2 className="mb-4 text-base font-semibold text-ds-text-primary">Admin Actions</h2>
              <div className="space-y-3">
                <div>
                  <label htmlFor="user-role" className="mb-1 block text-xs font-medium text-ds-text-tertiary">
                    Change Role
                  </label>
                  <div className="relative">
                    <select
                      id="user-role"
                      value={profileUser.role}
                      onChange={(event) =>
                        openActionConfirm(
                          new ActionConfirmBuilder()
                            .title("Change user role")
                            .message(
                              `Update role for ${profileUser.firstName} ${profileUser.lastName} to ${event.target.value}?`
                            )
                            .confirmText("Change Role")
                            .build(),
                          () => updateUser({ role: event.target.value as UserRole })
                        )
                      }
                      className="w-full appearance-none rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-sm text-ds-text-primary"
                      disabled={actionLoading}
                    >
                      {Object.values(UserRole).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-ds-text-tertiary" />
                  </div>
                </div>

                {(profileUser.status ?? "ACTIVE") === "ACTIVE" ? (
                  <Button
                    variant="outline"
                    className="w-full border-ds-status-warning/30 text-ds-status-warning-text hover:bg-ds-status-warning-bg"
                    onClick={() =>
                      openActionConfirm(ActionConfirmPresets.suspend("account"), () =>
                        updateUser({ status: "INACTIVE" })
                      )
                    }
                    disabled={actionLoading}
                  >
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Deactivate Account
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() =>
                      openActionConfirm(ActionConfirmPresets.activate("account"), () =>
                        updateUser({ status: "ACTIVE" })
                      )
                    }
                    disabled={actionLoading}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Activate Account
                  </Button>
                )}

                {(profileUser.status ?? "ACTIVE") !== "BANNED" ? (
                  <Button
                    variant="outline"
                    className="w-full border-ds-status-error/30 text-ds-status-error-text hover:bg-ds-status-error-bg"
                    onClick={() =>
                      openActionConfirm(
                        new ActionConfirmBuilder()
                          .title("Ban user")
                          .message("Ban this user?")
                          .confirmText("Ban")
                          .danger()
                          .build(),
                        () => updateUser({ status: "BANNED" })
                      )
                    }
                    disabled={actionLoading}
                  >
                    Ban User
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      openActionConfirm(
                        new ActionConfirmBuilder()
                          .title("Unban user")
                          .message("Unban this user?")
                          .confirmText("Unban")
                          .build(),
                        () => updateUser({ status: "ACTIVE" })
                      )
                    }
                    disabled={actionLoading}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Unban User
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full border-ds-status-error text-ds-status-error-text hover:bg-ds-status-error-bg"
                  onClick={() =>
                    openActionConfirm(
                      ActionConfirmPresets.delete("account"),
                      deleteUser
                    )
                  }
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

    </div>
  );
}
