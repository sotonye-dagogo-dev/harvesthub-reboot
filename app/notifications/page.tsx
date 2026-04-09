/**
 * Notification Preferences Page
 * Buyer/Vendor can configure notification settings
 */

import { Metadata } from "next";
import { NotificationPreferencesPageClient } from "./NotificationPreferencesPageClient";

export const metadata: Metadata = {
  title: "Notification Preferences - MyHarvestHub",
  description: "Manage your notification settings",
};

export default function NotificationPreferencesPage() {
  return <NotificationPreferencesPageClient />;
}
