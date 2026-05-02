import { Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./EmailLayout";

interface NotificationEmailDetail {
  label: string;
  value: string;
}

interface NotificationEmailProps {
  firstName?: string;
  title: string;
  message: string;
  link?: string;
  linkLabel?: string;
  details?: NotificationEmailDetail[];
  note?: string;
}

export function NotificationEmail({
  firstName,
  title,
  message,
  link,
  linkLabel = "Open MyHarvestHub",
  details,
  note,
}: NotificationEmailProps) {
  const hasDetails = Boolean(details && details.length > 0);

  return (
    <EmailLayout previewText={title} heading={title}>
      <Text style={styles.paragraph}>Hi {firstName || "there"},</Text>
      <Text style={styles.paragraph}>{message}</Text>

      {hasDetails ? (
        <Section style={{ margin: "20px 0" }}>
          <Text style={{ ...styles.paragraph, fontWeight: 600, margin: "0 0 8px" }}>Details</Text>
          <table style={styles.table}>
            <tbody>
              {details!.map((detail) => (
                <tr key={detail.label} style={styles.tableRow}>
                  <td style={styles.tableCellLabel}>{detail.label}</td>
                  <td style={styles.tableCellValue}>{detail.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      ) : null}

      {note ? (
        <Section
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            padding: "12px 16px",
            margin: "16px 0",
          }}
        >
          <Text style={{ ...styles.muted, margin: 0 }}>{note}</Text>
        </Section>
      ) : null}

      {link ? (
        <Section style={{ textAlign: "center", margin: "24px 0" }}>
          <Link href={link} style={styles.button}>
            {linkLabel}
          </Link>
        </Section>
      ) : null}
    </EmailLayout>
  );
}
