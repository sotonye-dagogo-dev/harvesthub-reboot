"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button, Card, Input as CustomInput } from "@/components/ui";
import { AddressForm } from "@/components/features";
import { Tabs, Upload, message, Badge } from "antd";
import { User, Mail, Phone, MapPin, Lock, Upload as UploadIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Address } from "@/lib/types";
import { CAMPUS_LOCATIONS, POSITION_OPTIONS, UserRole, VENDOR_CATEGORIES } from "@/lib/constants";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [loadingEmailStatus, setLoadingEmailStatus] = useState(false);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [emailChangeStatus, setEmailChangeStatus] = useState<{
    hasPendingEmailChange: boolean;
    pendingEmail: string | null;
    expiresAt: string | null;
  }>({
    hasPendingEmailChange: false,
    pendingEmail: null,
    expiresAt: null,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    whatsappNumber: "",
    category: "",
    campus: "",
    position: "",
    businessAddress: "",
  });

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    setFormData((prev) => ({
      ...prev,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      whatsappNumber: user.whatsappNumber || "",
    }));

    async function loadProfile() {
      try {
        const [profileRes, addressesRes] = await Promise.all([
          fetch(`/api/users/${user?.id}/profile`),
          fetch(`/api/users/${user?.id}/addresses`),
        ]);

        if (!mounted) return;

        if (profileRes.ok) {
          const data = await profileRes.json();
          const profile = data?.profile;

            if (profile) {
              setFormData((prev) => ({
                ...prev,
                firstName: profile.firstName || "",
                lastName: profile.lastName || "",
                email: profile.email || "",
                phoneNumber: profile.phoneNumber || "",
                whatsappNumber: profile?.vendorContext?.whatsappNumber || prev.whatsappNumber || "",
                category: profile?.vendorContext?.category || "",
                campus: profile?.vendorContext?.campus || "",
                position: profile?.vendorContext?.position || "",
                businessAddress: profile?.vendorContext?.businessAddress || "",
              }));
            }
        }

        if (addressesRes.ok) {
          const addressesData = await addressesRes.json();
          const addresses = Array.isArray(addressesData?.addresses)
            ? (addressesData.addresses as Address[])
            : [];
          setUserAddresses(addresses);
        } else {
          setUserAddresses([]);
        }
      } catch {
        // Keep local auth values as fallback.
        if (!mounted) return;
        setUserAddresses([]);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    async function loadEmailChangeStatus() {
      setLoadingEmailStatus(true);
      try {
        const res = await fetch("/api/users/me/change-email");
        if (!mounted) return;
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setEmailChangeStatus({
            hasPendingEmailChange: Boolean(data.data.hasPendingEmailChange),
            pendingEmail: typeof data.data.pendingEmail === "string" ? data.data.pendingEmail : null,
            expiresAt: typeof data.data.expiresAt === "string" ? data.data.expiresAt : null,
          });
          return;
        }
      } catch {
        // Keep default status if status fetch fails.
      } finally {
        if (mounted) {
          setLoadingEmailStatus(false);
        }
      }

      if (mounted) {
        setEmailChangeStatus({
          hasPendingEmailChange: false,
          pendingEmail: null,
          expiresAt: null,
        });
      }
    }

    loadEmailChangeStatus();

    return () => {
      mounted = false;
    };
  }, [user]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [emailData, setEmailData] = useState({
    newEmail: "",
    confirmEmail: "",
  });

  const handleSaveProfile = async () => {
    if (!user) return;

    setSavingProfile(true);
    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          whatsappNumber: formData.whatsappNumber.trim(),
          category: formData.category || undefined,
          campus: formData.campus || undefined,
          position: formData.position || undefined,
          businessAddress: formData.businessAddress.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      const updated = data.user;
      if (updated) {
        setFormData((prev) => ({
          ...prev,
          firstName: updated.firstName || prev.firstName,
          lastName: updated.lastName || prev.lastName,
          phoneNumber: updated.phoneNumber || prev.phoneNumber,
        }));
      }

      await refreshUser();
      message.success("Profile updated successfully");
      setEditMode(false);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Unable to update profile";
      message.error(errMessage);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      message.error("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      message.error("Password must be at least 8 characters");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`/api/users/${user.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      message.success(data.message || "Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Unable to change password";
      message.error(errMessage);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!emailData.newEmail || !emailData.confirmEmail) {
      message.error("Please fill in both email fields");
      return;
    }
    if (emailData.newEmail.trim().toLowerCase() !== emailData.confirmEmail.trim().toLowerCase()) {
      message.error("Email addresses do not match");
      return;
    }
    if (emailData.newEmail.trim().toLowerCase() === formData.email.trim().toLowerCase()) {
      message.error("New email must be different from your current email");
      return;
    }

    setSavingEmail(true);
    try {
      const res = await fetch("/api/users/me/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: emailData.newEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to start email change process");
      }
      message.success("Verification link sent to your new email address");
      setEmailChangeStatus({
        hasPendingEmailChange: true,
        pendingEmail:
          typeof data.data?.pendingEmail === "string" ? data.data.pendingEmail : emailData.newEmail.trim().toLowerCase(),
        expiresAt: null,
      });
      setEmailData({ newEmail: "", confirmEmail: "" });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Unable to request email change";
      message.error(errMessage);
    } finally {
      setSavingEmail(false);
    }
  };

  const tabs = [
    { key: "profile", label: "Profile Information" },
    { key: "addresses", label: "Addresses" },
    { key: "security", label: "Security" },
  ];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center text-ds-text-secondary">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ds-text-primary">My Profile</h1>
        <p className="mt-2 text-ds-text-secondary">Manage your account information</p>
        {user.role === "BUYER" && (
          <Link
            href="/become-vendor"
            className="mt-3 inline-flex items-center rounded-ds-md bg-ds-brand-subtle px-3 py-2 text-sm font-medium text-ds-text-brand hover:bg-ds-brand-surface"
          >
            Want to sell too? Register your store
          </Link>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(String(key))}
        items={tabs.map((tab) => ({ key: tab.key, label: tab.label }))}
      />

      <div className="mt-6">
        {activeTab === "profile" && (
          <Card>
            <div className="mb-6 flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-ds-full bg-ds-surface-disabled dark:bg-ds-surface-overlay">
                  {user.profilePicture ? (
                    <Image
                      src={user.profilePicture}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-ds-text-secondary dark:text-ds-text-placeholder">
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </div>
                  )}
                </div>
                <Upload
                  showUploadList={false}
                  beforeUpload={() => {
                    message.success("Profile picture updated");
                    return false;
                  }}
                >
                  <button
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-ds-full bg-ds-brand-primary text-white shadow-ds-lg hover:bg-ds-brand-primary-hover"
                    aria-label="Upload profile picture"
                  >
                    <UploadIcon className="h-4 w-4" />
                  </button>
                </Upload>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold text-ds-text-primary">
                    {formData.firstName} {formData.lastName}
                  </h2>
                  <Badge
                    count={user.role}
                    style={{
                      backgroundColor:
                        user.role === "ADMIN"
                          ? "#ef4444"
                          : user.role === "VENDOR"
                            ? "#3b82f6"
                            : "#10b981",
                    }}
                  />
                </div>
                <p className="text-ds-text-secondary">{formData.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                    First Name
                  </label>
                  <CustomInput
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!editMode}
                    prefix={<User className="h-4 w-4 text-ds-text-placeholder" />}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                    Last Name
                  </label>
                  <CustomInput
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!editMode}
                    prefix={<User className="h-4 w-4 text-ds-text-placeholder" />}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                  Email Address
                  <span className="ml-2 text-xs text-ds-text-tertiary">(Cannot be changed)</span>
                </label>
                <CustomInput
                  value={formData.email}
                  disabled={true}
                  prefix={<Mail className="h-4 w-4 text-ds-text-placeholder" />}
                  className="bg-ds-surface-sunken"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                    Phone Number
                  </label>
                  <CustomInput
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    disabled={!editMode}
                    prefix={<Phone className="h-4 w-4 text-ds-text-placeholder" />}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                    WhatsApp Number
                  </label>
                  <CustomInput
                    value={formData.whatsappNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsappNumber: e.target.value,
                      })
                    }
                    disabled={!editMode}
                    prefix={<Phone className="h-4 w-4 text-ds-text-placeholder" />}
                  />
                </div>
              </div>

              {user.role === UserRole.VENDOR ? (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                        Vendor Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        disabled={!editMode}
                        className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-sm text-ds-text-primary"
                      >
                        <option value="">Select category</option>
                        {VENDOR_CATEGORIES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                        Campus
                      </label>
                      <select
                        value={formData.campus}
                        onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                        disabled={!editMode}
                        className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-sm text-ds-text-primary"
                      >
                        <option value="">Select campus</option>
                        {CAMPUS_LOCATIONS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                        Church Position
                      </label>
                      <select
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        disabled={!editMode}
                        className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-sm text-ds-text-primary"
                      >
                        <option value="">Select position</option>
                        {POSITION_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                        Business Address
                      </label>
                      <CustomInput
                        value={formData.businessAddress}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            businessAddress: e.target.value,
                          })
                        }
                        disabled={!editMode}
                        prefix={<MapPin className="h-4 w-4 text-ds-text-placeholder" />}
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-6 flex gap-3">
              {editMode ? (
                <>
                  <Button onClick={handleSaveProfile} loading={savingProfile}>
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    disabled={savingProfile}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
              )}
            </div>
          </Card>
        )}

        {activeTab === "addresses" && (
          <div className="space-y-4">
            <Card>
              <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">Saved Addresses</h2>

              {userAddresses.length === 0 ? (
                <p className="text-ds-text-secondary">No saved addresses yet</p>
              ) : (
                <div className="space-y-3">
                  {userAddresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-start justify-between rounded-ds-md border border-ds-border-base p-4"
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-1 h-5 w-5 text-ds-text-placeholder" />
                        <div>
                          <div className="font-medium text-ds-text-primary">
                            {address.addressLine1}
                          </div>
                          <div className="text-sm text-ds-text-secondary">
                            {address.city}, {address.state}, Nigeria
                          </div>
                          {address.isDefault && (
                            <span className="mt-1 inline-block rounded-ds-xs bg-ds-brand-subtle px-2 py-1 text-xs text-ds-text-brand">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">Add New Address</h2>
              <AddressForm value={{}} onChange={() => {}} />
            </Card>
          </div>
        )}

        {activeTab === "security" && (
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">Change Password</h2>

            <div className="max-w-md space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                  Current Password
                </label>
                <CustomInput
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  prefix={<Lock className="h-4 w-4 text-ds-text-placeholder" />}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                  New Password
                </label>
                <CustomInput
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  prefix={<Lock className="h-4 w-4 text-ds-text-placeholder" />}
                />
                <p className="mt-1 text-xs text-ds-text-tertiary">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                  Confirm New Password
                </label>
                <CustomInput
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  prefix={<Lock className="h-4 w-4 text-ds-text-placeholder" />}
                />
              </div>

              <Button onClick={handleChangePassword} loading={savingPassword}>
                Change Password
              </Button>
            </div>

            <div className="mt-8 border-t border-ds-border-base pt-6">
              <h3 className="mb-2 text-lg font-semibold text-ds-text-primary">Change Email</h3>
              <p className="mb-4 text-sm text-ds-text-secondary">
                We&apos;ll send a verification link to your new email. You&apos;ll need to verify it to complete the change.
              </p>

              {loadingEmailStatus ? (
                <p className="mb-4 text-sm text-ds-text-secondary">Checking email-change status...</p>
              ) : null}

              {emailChangeStatus.hasPendingEmailChange && emailChangeStatus.pendingEmail ? (
                <div className="mb-4 rounded-ds-md border border-ds-border-base bg-ds-surface-raised p-3">
                  <p className="text-sm text-ds-text-primary">
                    Pending email change: <span className="font-semibold">{emailChangeStatus.pendingEmail}</span>
                  </p>
                  <p className="mt-1 text-xs text-ds-text-secondary">
                    {emailChangeStatus.expiresAt
                      ? `Verification link expires ${new Date(emailChangeStatus.expiresAt).toLocaleString()}.`
                      : "A verification link was sent. You can resend by submitting the same email again."}
                  </p>
                </div>
              ) : null}

              <div className="max-w-md space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                    Current Email
                  </label>
                  <CustomInput value={formData.email} disabled className="bg-ds-surface-sunken" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                    New Email
                  </label>
                  <CustomInput
                    type="email"
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData((prev) => ({ ...prev, newEmail: e.target.value }))}
                    prefix={<Mail className="h-4 w-4 text-ds-text-placeholder" />}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                    Confirm New Email
                  </label>
                  <CustomInput
                    type="email"
                    value={emailData.confirmEmail}
                    onChange={(e) => setEmailData((prev) => ({ ...prev, confirmEmail: e.target.value }))}
                    prefix={<Mail className="h-4 w-4 text-ds-text-placeholder" />}
                  />
                </div>

                <Button onClick={handleChangeEmail} loading={savingEmail}>
                  {emailChangeStatus.hasPendingEmailChange ? "Resend Verification Link" : "Send Verification Link"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
