/**
 * Notification Settings Page
 * Allows users to configure notification preferences
 */

"use client";

import { PageLoader } from "@/components/ui";
import { useState, useEffect, useCallback } from "react";
import { Card, Switch, Button } from "antd";
import { Bell, Mail, MessageSquare, Package, DollarSign, AlertTriangle } from "lucide-react";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { Sidebar } from "@/components/layout";
import { useToast } from "@/lib/contexts/ToastContext";

interface NotificationPreferences {
  orderConfirmed: boolean;
  orderReady: boolean;
  orderDelivered: boolean;
  orderCancelled: boolean;
  paymentSuccess: boolean;
  paymentFailed: boolean;
  deliveryUpdates: boolean;
  vendorMessages: boolean;
  lowStock: boolean;
  newProducts: boolean;
  promotions: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

export default function NotificationSettingsPage() {
  const { user, isLoading } = useAuth();
  const { enablePushNotifications, getBrowserPushPermission } = useNotifications();
  const toast = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    orderConfirmed: true,
    orderReady: true,
    orderDelivered: true,
    orderCancelled: true,
    paymentSuccess: true,
    paymentFailed: true,
    deliveryUpdates: true,
    vendorMessages: true,
    lowStock: true,
    newProducts: false,
    promotions: false,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });
  const [isFetchingPreferences, setIsFetchingPreferences] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [browserPushPermission, setBrowserPushPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");

  const fetchPreferences = useCallback(async () => {
    setIsFetchingPreferences(true);
    try {
      const res = await fetch("/api/notifications/preferences");
      const data = await res.json();

      if (data.success) {
        const permission = getBrowserPushPermission();
        const shouldForcePushOn = permission === "granted" && !data.preferences.pushNotifications;
        const nextPreferences = shouldForcePushOn
          ? { ...data.preferences, pushNotifications: true }
          : data.preferences;
        setPreferences(nextPreferences);
        setBrowserPushPermission(getBrowserPushPermission());

        if (shouldForcePushOn) {
          await fetch("/api/notifications/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nextPreferences),
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setIsFetchingPreferences(false);
    }
  }, [getBrowserPushPermission]);

  // Fetch preferences
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    setBrowserPushPermission(getBrowserPushPermission());
  }, [getBrowserPushPermission]);

  const savePreferences = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      const data = await res.json();

      if (data.success) {
        setPreferences(data.preferences);
        toast.success("Notification preferences saved");
      } else {
        toast.error(data.error || "Failed to save preferences");
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const enableBrowserPush = async () => {
    setEnablingPush(true);
    try {
      const enabled = await enablePushNotifications();
      const permission = getBrowserPushPermission();
      setBrowserPushPermission(permission);

      if (enabled) {
        setPreferences((prev) => ({ ...prev, pushNotifications: true }));
        toast.success("Browser push notifications enabled");
      } else if (permission === "denied") {
        setPreferences((prev) => ({ ...prev, pushNotifications: false }));
        toast.warning(
          "Browser notifications are blocked. Enable notifications in your browser settings to continue."
        );
      } else {
        setPreferences((prev) => ({ ...prev, pushNotifications: false }));
        toast.error("Unable to enable browser push notifications");
      }
    } catch (error) {
      console.error("Failed to enable browser push notifications:", error);
      toast.error("Unable to enable browser push notifications");
    } finally {
      setEnablingPush(false);
    }
  };

  const pushPermissionLabel =
    browserPushPermission === "granted"
      ? "Allowed"
      : browserPushPermission === "denied"
        ? "Blocked"
        : browserPushPermission === "default"
          ? "Not set"
          : "Unsupported";

  if (isLoading || isFetchingPreferences) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center text-ds-text-secondary">Please log in to manage notification settings</p>
      </div>
    );
  }

  const useDashboardLayout = user.role === "ADMIN" || user.role === "VENDOR";
  const sidebarType = user.role === "ADMIN" ? "admin" : "vendor";

  const settingsContent = (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ds-text-primary mb-2">Notification Settings</h1>
        <p className="text-ds-text-secondary">
          Manage how you receive notifications about your orders, payments, and account activity
        </p>
      </div>

      <div className="space-y-6">
        {/* Order Notifications */}
        <Card title="Order Notifications" className="shadow-ds-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-ds-text-brand" />
                <div>
                  <div className="font-medium text-ds-text-primary">Order Confirmed</div>
                  <div className="text-sm text-ds-text-secondary">
                    Get notified when your order is confirmed
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.orderConfirmed}
                onChange={(checked) => updatePreference("orderConfirmed", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-ds-status-info-text" />
                <div>
                  <div className="font-medium text-ds-text-primary">Order Ready</div>
                  <div className="text-sm text-ds-text-secondary">
                    Get notified when your order is ready for pickup
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.orderReady}
                onChange={(checked) => updatePreference("orderReady", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-ds-status-success-text" />
                <div>
                  <div className="font-medium text-ds-text-primary">Order Delivered</div>
                  <div className="text-sm text-ds-text-secondary">
                    Get notified when your order is delivered
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.orderDelivered}
                onChange={(checked) => updatePreference("orderDelivered", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-ds-status-error-text" />
                <div>
                  <div className="font-medium text-ds-text-primary">Order Cancelled</div>
                  <div className="text-sm text-ds-text-secondary">
                    Get notified when an order is cancelled
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.orderCancelled}
                onChange={(checked) => updatePreference("orderCancelled", checked)}
              />
            </div>
          </div>
        </Card>

        {/* Payment Notifications */}
        <Card title="Payment Notifications" className="shadow-ds-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-ds-status-success-text" />
                <div>
                  <div className="font-medium text-ds-text-primary">Payment Success</div>
                  <div className="text-sm text-ds-text-secondary">
                    Get notified when a payment is successful
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.paymentSuccess}
                onChange={(checked) => updatePreference("paymentSuccess", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-ds-status-error-text" />
                <div>
                  <div className="font-medium text-ds-text-primary">Payment Failed</div>
                  <div className="text-sm text-ds-text-secondary">
                    Get notified when a payment fails
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.paymentFailed}
                onChange={(checked) => updatePreference("paymentFailed", checked)}
              />
            </div>
          </div>
        </Card>

        {/* Delivery & Vendor Notifications */}
        <Card title="Delivery & Vendor Notifications" className="shadow-ds-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-ds-status-info-text" />
                <div>
                  <div className="font-medium text-ds-text-primary">Delivery Updates</div>
                  <div className="text-sm text-ds-text-secondary">
                    Get real-time updates on your delivery status
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.deliveryUpdates}
                onChange={(checked) => updatePreference("deliveryUpdates", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-ds-text-brand" />
                <div>
                  <div className="font-medium text-ds-text-primary">Vendor Messages</div>
                  <div className="text-sm text-ds-text-secondary">
                    Get notified when vendors send you messages
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.vendorMessages}
                onChange={(checked) => updatePreference("vendorMessages", checked)}
              />
            </div>
          </div>
        </Card>

        {/* Stock & Promotional Notifications */}
        <Card title="Stock & Promotional Notifications" className="shadow-ds-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-ds-status-warning-text" />
                <div>
                  <div className="font-medium text-ds-text-primary">Low Stock Alerts</div>
                  <div className="text-sm text-ds-text-secondary">
                    Get notified when items on your wishlist are low in stock
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.lowStock}
                onChange={(checked) => updatePreference("lowStock", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-ds-text-brand" />
                <div>
                  <div className="font-medium text-ds-text-primary">New Products</div>
                  <div className="text-sm text-ds-text-secondary">
                    Get notified about new products from vendors you follow
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.newProducts}
                onChange={(checked) => updatePreference("newProducts", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-ds-status-success-text" />
                <div>
                  <div className="font-medium text-ds-text-primary">Promotions</div>
                  <div className="text-sm text-ds-text-secondary">
                    Get notified about special offers and promotions
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.promotions}
                onChange={(checked) => updatePreference("promotions", checked)}
              />
            </div>
          </div>
        </Card>

        {/* Email & SMS Notifications */}
        <Card title="Email & SMS Notifications" className="shadow-ds-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-ds-status-info-text" />
                <div>
                  <div className="font-medium text-ds-text-primary">Email Notifications</div>
                  <div className="text-sm text-ds-text-secondary">
                    Receive important notifications via email
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.emailNotifications}
                onChange={(checked) => updatePreference("emailNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-ds-status-success-text" />
                <div>
                  <div className="font-medium text-ds-text-primary">SMS Notifications</div>
                  <div className="text-sm text-ds-text-secondary">
                    Receive critical notifications via SMS
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.smsNotifications}
                onChange={(checked) => updatePreference("smsNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-ds-text-brand" />
                <div>
                  <div className="font-medium text-ds-text-primary">Browser Push Notifications</div>
                  <div className="text-sm text-ds-text-secondary">
                    Enable this browser to receive web push notifications
                  </div>
                  <div className="text-xs text-ds-text-tertiary">
                    Browser permission: {pushPermissionLabel}
                  </div>
                </div>
              </div>
              <Button
                onClick={enableBrowserPush}
                loading={enablingPush}
                disabled={browserPushPermission === "unsupported"}
              >
                {browserPushPermission === "granted" ? "Push Enabled" : "Enable Push"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button onClick={fetchPreferences} disabled={saving}>
            Reset
          </Button>
          <Button type="primary" onClick={savePreferences} loading={saving}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );

  if (!useDashboardLayout) {
    return settingsContent;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar type={sidebarType} />
        <main className="flex-1 overflow-y-auto bg-ds-surface-sunken p-6 pb-20 dark:bg-ds-surface-sunken md:pb-6">
          {settingsContent}
        </main>
      </div>
    </div>
  );
}
