import { Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./EmailLayout";
import { sendEmail } from "@/lib/services/email";

type StatusType = "CONFIRMED" | "PROCESSING" | "READY" | "COMPLETED" | "CANCELLED" | "REFUNDED";

interface OrderStatusUpdateProps {
  firstName: string;
  orderNumber: string;
  status: StatusType;
  vendorName: string;
  note?: string;
}

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; description: string; color: string; bg: string }
> = {
  CONFIRMED: {
    label: "Confirmed",
    description: "The vendor has confirmed your order and will begin preparing it.",
    color: "#3b82f6",
    bg: "#dbeafe",
  },
  PROCESSING: {
    label: "Processing",
    description: "Your order is being prepared by the vendor.",
    color: "#f59e0b",
    bg: "#fef3c7",
  },
  READY: {
    label: "Ready",
    description: "Your order is ready for pickup / delivery!",
    color: "#22c55e",
    bg: "#dcfce7",
  },
  COMPLETED: {
    label: "Completed",
    description: "Your order has been delivered / picked up. Enjoy!",
    color: "#22c55e",
    bg: "#dcfce7",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "This order has been cancelled. If you were charged, a refund will be processed.",
    color: "#ef4444",
    bg: "#fee2e2",
  },
  REFUNDED: {
    label: "Refunded",
    description:
      "A refund has been issued for this order. It may take a few minutes to reflect in your wallet.",
    color: "#6b7280",
    bg: "#f3f4f6",
  },
};

export function OrderStatusUpdate({
  firstName,
  orderNumber,
  status,
  vendorName,
  note,
}: OrderStatusUpdateProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://harvesthub.ng";
  const cfg = STATUS_CONFIG[status];

  return (
    <EmailLayout previewText={`Order ${orderNumber} — ${cfg.label}`} heading="Order Update">
      <Text style={styles.paragraph}>Hi {firstName},</Text>

      <Section style={{ textAlign: "center", margin: "16px 0" }}>
        <Text style={styles.badge(cfg.color, cfg.bg)}>{cfg.label}</Text>
      </Section>

      <Text style={styles.paragraph}>{cfg.description}</Text>

      <table style={styles.table}>
        <tbody>
          <tr style={styles.tableRow}>
            <td style={styles.tableCellLabel}>Order</td>
            <td style={styles.tableCellValue}>{orderNumber}</td>
          </tr>
          <tr style={styles.tableRow}>
            <td style={styles.tableCellLabel}>Vendor</td>
            <td style={styles.tableCellValue}>{vendorName}</td>
          </tr>
        </tbody>
      </table>

      {note && (
        <Section
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            padding: "12px 16px",
            margin: "16px 0",
          }}
        >
          <Text style={{ ...styles.muted, margin: 0 }}>
            <strong>Note from vendor:</strong> {note}
          </Text>
        </Section>
      )}

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={`${appUrl}/orders`} style={styles.button}>
          View Order Details
        </Link>
      </Section>
    </EmailLayout>
  );
}

export async function sendOrderStatusUpdateEmail(to: string, data: OrderStatusUpdateProps) {
  const cfg = STATUS_CONFIG[data.status];
  return sendEmail({
    to,
    subject: `Order ${data.orderNumber} — ${cfg.label}`,
    react: <OrderStatusUpdate {...data} />,
    tags: [
      { name: "category", value: "order-status" },
      { name: "order", value: data.orderNumber },
      { name: "status", value: data.status },
    ],
  });
}
