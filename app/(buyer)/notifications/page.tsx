/**
 * Notification Preferences Page
 * Buyer/Vendor can configure notification settings
 */

import { Metadata } from "next";
import { NotificationPreferences } from "@/components/features/NotificationPreferences";

export const metadata: Metadata = {
  title: "Notification Preferences - HarvestHub",
  description: "Manage your notification settings",
};

export default function NotificationPreferencesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Notification Preferences
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Choose how you want to be notified about important updates
        </p>
      </div>

      <NotificationPreferences />
    </div>
  );
}
