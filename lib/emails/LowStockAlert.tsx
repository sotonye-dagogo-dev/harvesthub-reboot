import { Column, Link, Row, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./EmailLayout";

interface LowStockProduct {
  name: string;
  currentStock: number;
  threshold: number;
}

interface LowStockAlertProps {
  firstName: string;
  storeName: string;
  products: LowStockProduct[];
}

export function LowStockAlert({ firstName, storeName, products }: LowStockAlertProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://harvesthub.ng";

  return (
    <EmailLayout
      previewText={`Low stock alert: ${products.length} product${products.length > 1 ? "s" : ""} running low`}
      heading="Low Stock Alert ⚠️"
    >
      <Text style={styles.paragraph}>Hi {firstName},</Text>
      <Text style={styles.paragraph}>
        The following product{products.length > 1 ? "s" : ""} in your store{" "}
        <strong>{storeName}</strong> {products.length > 1 ? "are" : "is"} running low on stock:
      </Text>

      <Section
        style={{
          backgroundColor: "#fffbeb",
          borderRadius: "8px",
          padding: "16px",
          margin: "16px 0",
          border: "1px solid #fde68a",
        }}
      >
        {products.map((product, i) => (
          <Row key={i} style={{ marginBottom: i < products.length - 1 ? "8px" : 0 }}>
            <Column style={{ fontSize: "14px", color: "#374151" }}>{product.name}</Column>
            <Column style={{ fontSize: "14px", textAlign: "right" }}>
              <Text
                style={{
                  ...styles.badge(
                    product.currentStock === 0 ? "#ef4444" : "#f59e0b",
                    product.currentStock === 0 ? "#fee2e2" : "#fef3c7"
                  ),
                  margin: 0,
                }}
              >
                {product.currentStock === 0 ? "Out of stock" : `${product.currentStock} left`}
              </Text>
            </Column>
          </Row>
        ))}
      </Section>

      <Text style={styles.paragraph}>
        Keeping your inventory updated helps avoid missed orders and keeps customers happy.
      </Text>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={`${appUrl}/vendor/products`} style={styles.button}>
          Update Inventory
        </Link>
      </Section>

      <Text style={styles.muted}>
        You can adjust your low-stock thresholds in your store settings.
      </Text>
    </EmailLayout>
  );
}
