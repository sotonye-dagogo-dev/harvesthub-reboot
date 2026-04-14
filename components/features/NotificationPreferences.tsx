"use client";

import { useEffect, useState } from "react";
import { Button, Card, Switch, Tooltip, message } from "antd";
import { Lock, Info } from "lucide-react";
import { SectionLoader } from "@/components/ui";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { useNotifications } from "@/lib/contexts/NotificationContext";

type EditablePreferences = {
  orderUpdates: boolean;
  vendorMessages: boolean;
  promotions: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
};

type PreferenceApiResponse = {
  success?: boolean;
  note?: string;
  editable?: EditablePreferences;
  preferences?: {
    orderUpdates?: boolean;
    vendorMessages?: boolean;
    promotions?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
  };
};

const SMS_NOTIFICATIONS_AVAILABLE = false;

type EditableControl = {
  key: keyof EditablePreferences;
  title: string;
  description: string;
  disabled?: boolean;
  disabledReason?: string;
};

const DEFAULT_EDITABLE: EditablePreferences = {
  orderUpdates: true,
  vendorMessages: true,
  promotions: false,
  pushNotifications: true,
  smsNotifications: false,
};

const EDITABLE_CONTROLS: EditableControl[] = [
  {
    key: "orderUpdates",
    title: "Order and payment updates",
    description: "In-app and push updates for order/payment lifecycle events.",
  },
  {
    key: "vendorMessages",
    title: "Vendor messages",
    description: "Messages and operational updates from vendors.",
  },
  {
    key: "promotions",
    title: "Promotions and new products",
    description: "Marketing announcements and new listing highlights.",
  },
  {
    key: "pushNotifications",
    title: "Browser push notifications",
    description: "Allow this browser to receive push notifications.",
  },
  {
    key: "smsNotifications",
    title: "SMS notifications",
    description: "SMS delivery is temporarily unavailable while this channel is being completed.",
    disabled: !SMS_NOTIFICATIONS_AVAILABLE,
    disabledReason: "SMS notifications are coming soon and cannot be enabled yet.",
  },
];

function normalizeEditable(payload?: PreferenceApiResponse): EditablePreferences {
  const toBoolean = (value: unknown, fallback = false) =>
    typeof value === "boolean" ? value : fallback;

  if (payload?.editable) {
    return {
      orderUpdates: toBoolean(payload.editable.orderUpdates, true),
      vendorMessages: toBoolean(payload.editable.vendorMessages, true),
      promotions: toBoolean(payload.editable.promotions, false),
      pushNotifications: toBoolean(payload.editable.pushNotifications, true),
      smsNotifications: SMS_NOTIFICATIONS_AVAILABLE
        ? toBoolean(payload.editable.smsNotifications, false)
        : false,
    };
  }

  if (payload?.preferences) {
    return {
      orderUpdates: toBoolean(payload.preferences.orderUpdates, true),
      vendorMessages: toBoolean(payload.preferences.vendorMessages, true),
      promotions: toBoolean(payload.preferences.promotions, false),
      pushNotifications: toBoolean(payload.preferences.pushNotifications, true),
      smsNotifications: SMS_NOTIFICATIONS_AVAILABLE
        ? toBoolean(payload.preferences.smsNotifications, false)
        : false,
    };
  }

  return {
    ...DEFAULT_EDITABLE,
    smsNotifications: SMS_NOTIFICATIONS_AVAILABLE ? DEFAULT_EDITABLE.smsNotifications : false,
  };
}

export function NotificationPreferences() {
  const [editable, setEditable] = useState<EditablePreferences>(DEFAULT_EDITABLE);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(
    "Critical order/payment/delivery emails remain enforced for account safety."
  );
  const { enablePushNotifications, disablePushNotifications, getBrowserPushPermission } =
    useNotifications();

  const fetchPreferences = async (): Promise<PreferenceApiResponse> => {
    const res = await fetch("/api/notifications/preferences");
    const data = (await res.json()) as PreferenceApiResponse;

    if (!res.ok || !data.success) {
      const details =
        typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Unknown error";
      throw new Error(
        `Failed to fetch notification preferences (status ${res.status}): ${details}`
      );
    }
    return data;
  };

  const { data, isLoading, isRefreshing, error, refresh } = useSmartResource(fetchPreferences, {
    key: "notification-preferences-resource",
    refreshIntervalMs: 5 * 60_000,
    staleTimeMs: 90_000,
  });

  useEffect(() => {
    if (!data) return;
    setEditable(normalizeEditable(data));
    if (data.note) {
      setNotice(data.note);
    }
  }, [data]);

  const updateEditable = (key: keyof EditablePreferences, value: boolean) => {
    if (key === "smsNotifications" && !SMS_NOTIFICATIONS_AVAILABLE) {
      return;
    }
    setEditable((current) => ({ ...current, [key]: value }));
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const requestedPushState = editable.pushNotifications;
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editable: {
            ...editable,
            smsNotifications: SMS_NOTIFICATIONS_AVAILABLE ? editable.smsNotifications : false,
          },
        }),
      });
      const payload = (await res.json()) as PreferenceApiResponse;
      if (!res.ok || !payload.success) {
        throw new Error("Save failed");
      }
      setEditable(normalizeEditable(payload));
      if (payload.note) {
        setNotice(payload.note);
      }

      if (requestedPushState) {
        const pushEnabled = await enablePushNotifications();
        if (!pushEnabled) {
          const permission = getBrowserPushPermission();
          if (permission === "denied") {
            message.warning(
              "Push permission is blocked in your browser settings. In-app notifications will still appear."
            );
          } else {
            message.warning(
              "Push notifications could not be enabled on this browser. In-app notifications will still appear."
            );
          }
        }
      } else {
        const pushDisabled = await disablePushNotifications();
        if (!pushDisabled) {
          message.warning(
            "Preferences saved, but this browser subscription could not be removed completely."
          );
        }
      }

      message.success("Notification preferences saved");
      await refresh(true);
    } catch (saveError) {
      console.error("Failed to save notification preferences:", saveError);
      message.error("Failed to save notification preferences");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <SectionLoader size="lg" className="py-12" />;
  }

  return (
    <div className="space-y-6">
      {isRefreshing ? (
        <p className="text-xs text-ds-text-tertiary">Refreshing notification preferences...</p>
      ) : null}
      {error ? <p className="text-xs text-ds-status-error-text">{error}</p> : null}

      <Card title="Editable Preferences" className="shadow-ds-sm">
        <div className="space-y-4">
          {EDITABLE_CONTROLS.map((control) => (
            <div
              key={control.key}
              className="flex items-center justify-between border-b border-ds-border-base pb-4 last:border-b-0 last:pb-0"
            >
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-ds-text-primary">{control.title}</h4>
                  {control.disabledReason ? (
                    <Tooltip title={control.disabledReason}>
                      <Info className="h-4 w-4 text-ds-text-tertiary" />
                    </Tooltip>
                  ) : null}
                </div>
                <p className="text-sm text-ds-text-secondary">{control.description}</p>
                {control.disabledReason ? (
                  <p className="mt-1 text-xs text-ds-text-tertiary">{control.disabledReason}</p>
                ) : null}
              </div>
              <Switch
                checked={editable[control.key]}
                disabled={control.disabled}
                onChange={(checked) => updateEditable(control.key, checked)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Enforced Safety Rules" className="shadow-ds-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-ds-border-base pb-4">
            <div className="pr-4">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-ds-text-primary">
                  Critical order/payment/delivery email alerts
                </h4>
                <Tooltip title="This control is enforced for account safety and cannot be disabled.">
                  <Info className="h-4 w-4 text-ds-text-tertiary" />
                </Tooltip>
              </div>
              <p className="text-sm text-ds-text-secondary">{notice}</p>
            </div>
            <div className="flex items-center gap-2 text-ds-text-tertiary">
              <Lock className="h-4 w-4" />
              <Switch checked disabled />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button onClick={() => refresh(true)} disabled={saving}>
          Reset
        </Button>
        <Button type="primary" onClick={savePreferences} loading={saving}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
