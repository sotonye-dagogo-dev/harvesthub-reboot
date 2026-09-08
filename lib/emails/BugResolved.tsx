import * as React from "react";
import { Text, Link } from "@react-email/components";
import { EmailLayout, styles } from "./EmailLayout";

interface Props {
  reporterName?: string;
  title: string;
  adminNotes?: string | null;
  appUrl: string;
}

export function BugResolved({ reporterName, title, adminNotes, appUrl }: Props) {
  return (
    <EmailLayout previewText={`Your report "${title}" has been resolved`} heading="Issue Resolved">
      <Text style={styles.paragraph}>Hi {reporterName || "there"},</Text>
      <Text style={styles.paragraph}>
        Thank you for reporting <strong>“{title}”</strong>. Our team has resolved the issue.
      </Text>
      {adminNotes ? (
        <Text style={{ ...styles.paragraph, backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px" }}>
          <strong>Resolution note:</strong> {adminNotes}
        </Text>
      ) : null}
      <Text style={styles.paragraph}>
        If you still experience this issue, please reply to this email or submit a new report at{" "}
        <Link href={`${appUrl}/bug-report`} style={{ color: styles.purplePrimary }}>
          MyHarvestHub Bug Report
        </Link>
        .
      </Text>
      <Text style={styles.muted}>— MyHarvestHub Support</Text>
    </EmailLayout>
  );
}
