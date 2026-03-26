import { Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./EmailLayout";

interface VendorApprovalProps {
  firstName: string;
  storeName: string;
  approved: boolean;
  rejectionReason?: string;
}

export function VendorApproval({
  firstName,
  storeName,
  approved,
  rejectionReason,
}: VendorApprovalProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://harvesthub.ng";

  return (
    <EmailLayout
      previewText={
        approved
          ? `Your store "${storeName}" has been approved!`
          : `Update on your store "${storeName}" application`
      }
      heading={approved ? "Store Approved! 🎉" : "Application Update"}
    >
      <Text style={styles.paragraph}>Hi {firstName},</Text>

      {approved ? (
        <>
          <Text style={styles.paragraph}>
            Great news! Your store <strong>{storeName}</strong> has been approved and is now live on
            MyHarvestHub.
          </Text>
          <Text style={styles.paragraph}>
            You can now start listing your products and accepting orders from buyers across the
            platform.
          </Text>
          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Link href={`${appUrl}/vendor/dashboard`} style={styles.button}>
              Go to Dashboard
            </Link>
          </Section>
          <Text style={styles.muted}>
            Tip: Add your first product, set up your store banner, and share your store link with
            customers to start getting orders.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.paragraph}>
            We&apos;ve reviewed your application for <strong>{storeName}</strong>, and unfortunately
            it wasn&apos;t approved at this time.
          </Text>
          {rejectionReason && (
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
                <strong>Reason:</strong> {rejectionReason}
              </Text>
            </Section>
          )}
          <Text style={styles.paragraph}>
            You can update your store information and resubmit your application. If you have
            questions, please contact our support team.
          </Text>
          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Link href={`${appUrl}/vendor/store-settings`} style={styles.buttonSecondary}>
              Update Store Info
            </Link>
          </Section>
        </>
      )}
    </EmailLayout>
  );
}
