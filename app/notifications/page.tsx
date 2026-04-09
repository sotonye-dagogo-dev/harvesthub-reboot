import { Metadata } from "next";
import { NotificationInboxPageClient } from "./NotificationInboxPageClient";

export const metadata: Metadata = {
  title: "Notifications - MyHarvestHub",
  description: "View and manage your notification inbox",
};

export default function NotificationsPage() {
  return <NotificationInboxPageClient />;
}
