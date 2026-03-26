"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button, Card, Input as CustomInput } from "@/components/ui";
import { AddressForm } from "@/components/features";
import { mockAddresses } from "@/lib/data/mockData";
import { Tabs, Upload, message, Badge } from "antd";
import { User, Mail, Phone, MapPin, Lock, Upload as UploadIcon } from "lucide-react";
import Image from "next/image";

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);

  const userAddresses = mockAddresses.filter((a: any) => a.userId === user?.id);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    whatsappNumber: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        whatsappNumber: user.whatsappNumber || "",
      });
    }
  }, [user]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSaveProfile = () => {
    message.success("Profile updated successfully");
    setEditMode(false);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      message.error("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      message.error("Password must be at least 8 characters");
      return;
    }

    message.success("Password changed successfully");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
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
            </div>

            <div className="mt-6 flex gap-3">
              {editMode ? (
                <>
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>
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
                  {userAddresses.map((address: any) => (
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

              <Button onClick={handleChangePassword}>Change Password</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
