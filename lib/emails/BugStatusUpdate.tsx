import * as React from "react";
import { Text, Link } from "@react-email/components";
import { EmailLayout, styles } from "./EmailLayout";

interface Props {
  reporterName?: string;
  title: string;
  prevStatus: string;
  nextStatus: string;
  adminNotes?: string | null;
  appUrl: string;
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

function label(status: string): string {
  return STATUS_LABELS[status.toUpperCase()] ?? status;
}

export function BugStatusUpdate({ reporterName, title, prevStatus, nextStatus, adminNotes, appUrl }: Props) {
  const isResolved = nextStatus.toUpperCase() === "RESOLVED";
  return (
    <EmailLayout
      previewText={`Update on your report "${title}" — now ${label(nextStatus)}`}
      heading={isResolved ? "Issue Resolved" : "Report Update"}
    >
      <Text style={styles.paragraph}>Hi {reporterName || "there"},</Text>
      <Text style={styles.paragraph}>
        An update on your report <strong>“{title}”</strong>: its status changed from{" "}
        <strong>{label(prevStatus)}</strong> to <strong>{label(nextStatus)}</strong>.
      </Text>
      {isResolved ? (
        <Text style={styles.paragraph}>
          Our team has marked this issue as resolved. Thank you for helping us improve MyHarvestHub!
        </Text>
      ) : (
        <Text style={styles.paragraph}>
          Our team is working on your report. You&apos;ll receive another update when the status changes.
        </Text>
      )}
      {adminNotes ? (
        <Text style={{ ...styles.paragraph, backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px" }}>
          <strong>Note from our team:</strong> {adminNotes}
        </Text>
      ) : null}
      <Text style={styles.paragraph}>
        If you have more details or this issue persists, reply to this email or submit a new report at{" "}
        <Link href={`${appUrl}/bug-report`} style={{ color: styles.purplePrimary }}>
          MyHarvestHub Bug Report
        </Link>
        .
      </Text>
      <Text style={styles.muted}>— MyHarvestHub Support</Text>
    </EmailLayout>
  );
}
