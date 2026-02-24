/**
 * Notification Preferences Component
 *
 * Features:
 * - Toggle notification types on/off
 * - Choose delivery methods (in-app, email, push)
 * - Set quiet hours
 * - Configure notification frequency
 */

"use client";

import { SectionLoader } from "@/components/ui";
import { useState, useEffect } from "react";
import { Card, Switch, Button, message, TimePicker } from "antd";
import { Bell, Mail, Smartphone, Clock } from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import type { NotificationType } from "@/lib/types";

interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

const defaultPreferences: NotificationPreference[] = [
  { type: "ORDER_CONFIRMED", enabled: true, inApp: true, email: true, push: true },
  { type: "ORDER_READY", enabled: true, inApp: true, email: true, push: true },
  { type: "ORDER_DELIVERED", enabled: true, inApp: true, email: true, push: false },
  { type: "ORDER_CANCELLED", enabled: true, inApp: true, email: true, push: true },
  { type: "PAYMENT_SUCCESS", enabled: true, inApp: true, email: true, push: false },
  { type: "PAYMENT_FAILED", enabled: true, inApp: true, email: true, push: true },
  { type: "DELIVERY_UPDATE", enabled: true, inApp: true, email: false, push: true },
  { type: "VENDOR_MESSAGE", enabled: true, inApp: true, email: false, push: false },
  { type: "LOW_STOCK", enabled: true, inApp: true, email: true, push: false },
  { type: "NEW_PRODUCT", enabled: false, inApp: true, email: false, push: false },
  { type: "PROMOTION", enabled: false, inApp: true, email: false, push: false },
];

const notificationLabels: Record<NotificationType, { title: string; description: string }> = {
  ORDER_CONFIRMED: {
    title: "Order Confirmed",
    description: "When your order is confirmed by the vendor" },
  ORDER_READY: {
    title: "Order Ready",
    description: "When your order is ready for pickup or delivery" },
  ORDER_DELIVERED: {
    title: "Order Delivered",
    description: "When your order has been delivered" },
  ORDER_CANCELLED: {
    title: "Order Cancelled",
    description: "When an order is cancelled" },
  PAYMENT_SUCCESS: {
    title: "Payment Success",
    description: "When a payment is successfully processed" },
  PAYMENT_FAILED: {
    title: "Payment Failed",
    description: "When a payment fails" },
  DELIVERY_UPDATE: {
    title: "Delivery Updates",
    description: "Updates about your delivery status" },
  VENDOR_MESSAGE: {
    title: "Vendor Messages",
    description: "Messages from vendors about your orders" },
  LOW_STOCK: {
    title: "Low Stock Alerts",
    description: "When products in your wishlist are running low" },
  NEW_PRODUCT: {
    title: "New Products",
    description: "When vendors you follow add new products" },
  PROMOTION: {
    title: "Promotions & Offers",
    description: "Special offers and promotional deals" } };

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(defaultPreferences);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState<Dayjs | null>(dayjs("22:00", "HH:mm"));
  const [quietHoursEnd, setQuietHoursEnd] = useState<Dayjs | null>(dayjs("08:00", "HH:mm"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/preferences");
      const data = await res.json();

      if (data.success && data.preferences) {
        setPreferences(data.preferences.notificationTypes || defaultPreferences);
        setQuietHoursEnabled(data.preferences.quietHoursEnabled || false);
        if (data.preferences.quietHoursStart) {
          setQuietHoursStart(dayjs(data.preferences.quietHoursStart, "HH:mm"));
        }
        if (data.preferences.quietHoursEnd) {
          setQuietHoursEnd(dayjs(data.preferences.quietHoursEnd, "HH:mm"));
        }
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationTypes: preferences,
          quietHoursEnabled,
          quietHoursStart: quietHoursStart?.format("HH:mm"),
          quietHoursEnd: quietHoursEnd?.format("HH:mm") }) });

      if (res.ok) {
        message.success("Preferences saved successfully");
      } else {
        message.error("Failed to save preferences");
      }
    } catch (error) {
      console.error("Save error:", error);
      message.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (
    type: NotificationType,
    field: keyof NotificationPreference,
    value: boolean
  ) => {
    setPreferences((prev) =>
      prev.map((pref) => (pref.type === type ? { ...pref, [field]: value } : pref))
    );
  };

  if (loading) {
    return (
      <SectionLoader size="lg" className="py-12" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Types */}
      <Card title="Notification Types" className="shadow-ds-sm">
        <div className="space-y-4">
          {preferences.map((pref) => {
            const info = notificationLabels[pref.type];
            return (
              <div key={pref.type} className="border-b last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-ds-text-primary">{info.title}</h4>
                    <p className="text-sm text-ds-text-secondary">{info.description}</p>
                  </div>
                  <Switch
                    checked={pref.enabled}
                    onChange={(checked) => togglePreference(pref.type, "enabled", checked)}
                  />
                </div>

                {pref.enabled && (
                  <div className="flex gap-4 ml-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Bell size={16} className="text-ds-brand-primary-light" />
                      <span>In-App</span>
                      <Switch
                        size="small"
                        checked={pref.inApp}
                        onChange={(checked) => togglePreference(pref.type, "inApp", checked)}
                      />
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <Mail size={16} className="text-ds-status-info" />
                      <span>Email</span>
                      <Switch
                        size="small"
                        checked={pref.email}
                        onChange={(checked) => togglePreference(pref.type, "email", checked)}
                      />
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <Smartphone size={16} className="text-ds-status-success" />
                      <span>Push</span>
                      <Switch
                        size="small"
                        checked={pref.push}
                        onChange={(checked) => togglePreference(pref.type, "push", checked)}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card title="Quiet Hours" className="shadow-ds-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-ds-text-primary">Enable Quiet Hours</h4>
              <p className="text-sm text-ds-text-secondary">
                Mute notifications during specific hours
              </p>
            </div>
            <Switch checked={quietHoursEnabled} onChange={setQuietHoursEnabled} />
          </div>

          {quietHoursEnabled && (
            <div className="flex items-center gap-4 ml-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <TimePicker
                  value={quietHoursStart}
                  onChange={setQuietHoursStart}
                  format="HH:mm"
                  suffixIcon={<Clock size={16} />}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <TimePicker
                  value={quietHoursEnd}
                  onChange={setQuietHoursEnd}
                  format="HH:mm"
                  suffixIcon={<Clock size={16} />}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="primary" size="large" onClick={handleSave} loading={saving}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
