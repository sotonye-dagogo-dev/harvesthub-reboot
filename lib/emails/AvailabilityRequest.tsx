import { Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./EmailLayout";

interface AvailabilityRequestProps {
  vendorFirstName: string;
  buyerName: string;
  productName: string;
  quantity: number;
  message?: string;
  requestId: string;
}

export function AvailabilityRequest({
  vendorFirstName,
  buyerName,
  productName,
  quantity,
  message,
  requestId,
}: AvailabilityRequestProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://myharvesthub.org";

  return (
    <EmailLayout
      previewText={`${buyerName} wants to check availability for "${productName}"`}
      heading="Availability Check"
    >
      <Text style={styles.paragraph}>Hi {vendorFirstName},</Text>
      <Text style={styles.paragraph}>
        A buyer is interested in one of your products and wants to confirm availability before
        ordering.
      </Text>

      <table style={styles.table}>
        <tbody>
          <tr style={styles.tableRow}>
            <td style={styles.tableCellLabel}>Buyer</td>
            <td style={styles.tableCellValue}>{buyerName}</td>
          </tr>
          <tr style={styles.tableRow}>
            <td style={styles.tableCellLabel}>Product</td>
            <td style={styles.tableCellValue}>{productName}</td>
          </tr>
          <tr style={styles.tableRow}>
            <td style={styles.tableCellLabel}>Quantity</td>
            <td style={styles.tableCellValue}>{quantity}</td>
          </tr>
        </tbody>
      </table>

      {message && (
        <Section
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            padding: "12px 16px",
            margin: "16px 0",
          }}
        >
          <Text style={{ ...styles.muted, margin: 0 }}>
            <strong>Buyer&apos;s message:</strong> {message}
          </Text>
        </Section>
      )}

      <Text style={styles.paragraph}>
        Please respond as soon as possible to let the buyer know if this product is available.
      </Text>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={`${appUrl}/vendor/orders?availability=${requestId}`} style={styles.button}>
          Respond Now
        </Link>
      </Section>

      <Text style={styles.muted}>
        Quick responses lead to higher conversion rates and better store ratings.
      </Text>
    </EmailLayout>
  );
}
