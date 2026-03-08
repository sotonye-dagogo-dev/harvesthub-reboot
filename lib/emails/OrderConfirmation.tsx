import { Column, Link, Row, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./EmailLayout";
import { sendEmail } from "@/lib/services/email";

interface OrderItemData {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationProps {
  firstName: string;
  orderNumber: string;
  items: OrderItemData[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryMethod: "PICKUP" | "DELIVERY";
  pickupService?: string;
  deliveryAddress?: string;
  vendorName: string;
}

function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

export function OrderConfirmation({
  firstName,
  orderNumber,
  items,
  subtotal,
  deliveryFee,
  total,
  deliveryMethod,
  pickupService,
  deliveryAddress,
  vendorName,
}: OrderConfirmationProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://harvesthub.ng";

  return (
    <EmailLayout
      previewText={`Order ${orderNumber} confirmed — ${formatNgn(total)}`}
      heading="Order Confirmed!"
    >
      <Text style={styles.paragraph}>Hi {firstName},</Text>
      <Text style={styles.paragraph}>
        Your order has been placed successfully. The vendor <strong>{vendorName}</strong> will begin
        processing it shortly.
      </Text>

      {/* Order info */}
      <table style={styles.table}>
        <tbody>
          <tr style={styles.tableRow}>
            <td style={styles.tableCellLabel}>Order Number</td>
            <td style={styles.tableCellValue}>{orderNumber}</td>
          </tr>
          <tr style={styles.tableRow}>
            <td style={styles.tableCellLabel}>
              {deliveryMethod === "PICKUP" ? "Pickup" : "Delivery"}
            </td>
            <td style={styles.tableCellValue}>
              {deliveryMethod === "PICKUP"
                ? pickupService || "Church Pickup"
                : deliveryAddress || "Home Delivery"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items */}
      <Section style={{ margin: "16px 0" }}>
        <Text style={{ ...styles.paragraph, fontWeight: 600, margin: "0 0 8px" }}>Items</Text>
        {items.map((item, i) => (
          <Row key={i} style={{ marginBottom: "4px" }}>
            <Column style={{ fontSize: "14px", color: "#374151" }}>
              {item.name} × {item.quantity}
            </Column>
            <Column style={{ fontSize: "14px", color: "#374151", textAlign: "right" }}>
              {formatNgn(item.price * item.quantity)}
            </Column>
          </Row>
        ))}
      </Section>

      {/* Totals */}
      <table style={{ ...styles.table, marginTop: "8px" }}>
        <tbody>
          <tr style={styles.tableRow}>
            <td style={styles.tableCellLabel}>Subtotal</td>
            <td style={{ ...styles.tableCellValue, textAlign: "right" }}>{formatNgn(subtotal)}</td>
          </tr>
          <tr style={styles.tableRow}>
            <td style={styles.tableCellLabel}>Delivery Fee</td>
            <td style={{ ...styles.tableCellValue, textAlign: "right" }}>
              {deliveryFee > 0 ? formatNgn(deliveryFee) : "Free"}
            </td>
          </tr>
          <tr>
            <td style={{ ...styles.tableCellLabel, fontWeight: 700, color: "#111827" }}>Total</td>
            <td
              style={{
                ...styles.tableCellValue,
                textAlign: "right",
                fontSize: "16px",
                color: styles.purplePrimary,
              }}
            >
              {formatNgn(total)}
            </td>
          </tr>
        </tbody>
      </table>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={`${appUrl}/orders`} style={styles.button}>
          View Order
        </Link>
      </Section>

      <Text style={styles.muted}>
        You&apos;ll receive an update when the vendor begins processing your order.
      </Text>
    </EmailLayout>
  );
}

export async function sendOrderConfirmationEmail(
  to: string,
  data: Omit<OrderConfirmationProps, "firstName"> & { firstName: string }
) {
  return sendEmail({
    to,
    subject: `Order ${data.orderNumber} confirmed — ${formatNgn(data.total)}`,
    react: <OrderConfirmation {...data} />,
    tags: [
      { name: "category", value: "order-confirmation" },
      { name: "order", value: data.orderNumber },
    ],
  });
}
