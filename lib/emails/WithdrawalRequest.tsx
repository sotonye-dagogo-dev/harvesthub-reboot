import { Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./EmailLayout";

type WithdrawalStatus = "SUBMITTED" | "PROCESSING" | "COMPLETED" | "FAILED";

interface WithdrawalRequestProps {
  firstName: string;
  amount: number;
  status: WithdrawalStatus;
  reference: string;
  bankName?: string;
  accountNumber?: string;
  failureReason?: string;
}

function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

const STATUS_CONFIG: Record<
  WithdrawalStatus,
  { label: string; color: string; bg: string; description: string }
> = {
  SUBMITTED: {
    label: "Submitted",
    color: "#3b82f6",
    bg: "#dbeafe",
    description: "Your withdrawal request has been submitted and is pending review.",
  },
  PROCESSING: {
    label: "Processing",
    color: "#f59e0b",
    bg: "#fef3c7",
    description: "Your withdrawal is being processed. Funds will be transferred shortly.",
  },
  COMPLETED: {
    label: "Completed",
    color: "#22c55e",
    bg: "#dcfce7",
    description:
      "Your withdrawal has been completed! The funds have been sent to your bank account.",
  },
  FAILED: {
    label: "Failed",
    color: "#ef4444",
    bg: "#fee2e2",
    description:
      "Your withdrawal could not be processed. The amount has been returned to your wallet.",
  },
};

export function WithdrawalRequest({
  firstName,
  amount,
  status,
  reference,
  bankName,
  accountNumber,
  failureReason,
}: WithdrawalRequestProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://harvesthub.ng";
  const cfg = STATUS_CONFIG[status];

  return (
    <EmailLayout
      previewText={`Withdrawal ${cfg.label.toLowerCase()}: ${formatNgn(amount)}`}
      heading="Withdrawal Update"
    >
      <Text style={styles.paragraph}>Hi {firstName},</Text>

      <Section style={{ textAlign: "center", margin: "16px 0" }}>
        <Text style={styles.badge(cfg.color, cfg.bg)}>{cfg.label}</Text>
      </Section>

      <Text style={styles.paragraph}>{cfg.description}</Text>

      <table style={styles.table}>
        <tbody>
          <tr style={styles.tableRow}>
            <td style={styles.tableCellLabel}>Amount</td>
            <td style={{ ...styles.tableCellValue, color: styles.purplePrimary }}>
              {formatNgn(amount)}
            </td>
          </tr>
          <tr style={styles.tableRow}>
            <td style={styles.tableCellLabel}>Reference</td>
            <td style={styles.tableCellValue}>{reference}</td>
          </tr>
          {bankName && (
            <tr style={styles.tableRow}>
              <td style={styles.tableCellLabel}>Bank</td>
              <td style={styles.tableCellValue}>{bankName}</td>
            </tr>
          )}
          {accountNumber && (
            <tr style={styles.tableRow}>
              <td style={styles.tableCellLabel}>Account</td>
              <td style={styles.tableCellValue}>****{accountNumber.slice(-4)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {status === "FAILED" && failureReason && (
        <Section
          style={{
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            padding: "12px 16px",
            margin: "16px 0",
            borderLeft: "4px solid #ef4444",
          }}
        >
          <Text style={{ ...styles.muted, color: "#991b1b", margin: 0 }}>
            <strong>Reason:</strong> {failureReason}
          </Text>
        </Section>
      )}

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={`${appUrl}/wallet`} style={styles.button}>
          View Wallet
        </Link>
      </Section>
    </EmailLayout>
  );
}
