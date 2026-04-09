import { Metadata } from "next";
import { NotificationPreferencesPageClient } from "../NotificationPreferencesPageClient";

export const metadata: Metadata = {
  title: "Notification Preferences - MyHarvestHub",
  description: "Manage your notification settings",
};

export default function NotificationSettingsPage() {
  return <NotificationPreferencesPageClient />;
}
