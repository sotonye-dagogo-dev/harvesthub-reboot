import { Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./EmailLayout";

interface WelcomeEmailProps {
  firstName: string;
  role: "BUYER" | "VENDOR";
}

export function WelcomeEmail({ firstName, role }: WelcomeEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://harvesthub.ng";
  const dashboardUrl = role === "VENDOR" ? `${appUrl}/vendor/dashboard` : appUrl;

  return (
    <EmailLayout
      previewText="Welcome to MyHarvestHub!"
      heading={`Welcome to MyHarvestHub${role === "VENDOR" ? " 🏪" : ""}`}
    >
      <Text style={styles.paragraph}>Hi {firstName},</Text>
      <Text style={styles.paragraph}>
        Your email has been verified and your account is all set!
        {role === "VENDOR"
          ? " Your vendor application is being reviewed by our team. We'll notify you once it's approved."
          : " Start exploring amazing products from trusted vendors in your community."}
      </Text>

      {role === "BUYER" && (
        <>
          <Text style={styles.paragraph}>Here&apos;s what you can do:</Text>
          <Text style={styles.paragraph}>
            • Browse products from verified vendors{"\n"}• Add funds to your wallet for quick
            checkout{"\n"}• Choose pickup at church or home delivery{"\n"}• Track your orders in
            real-time
          </Text>
        </>
      )}

      {role === "VENDOR" && (
        <>
          <Text style={styles.paragraph}>Once approved, you&apos;ll be able to:</Text>
          <Text style={styles.paragraph}>
            • List your products on the marketplace{"\n"}• Manage orders and inventory{"\n"}• Accept
            wallet payments & bank transfers{"\n"}• View analytics and grow your store
          </Text>
        </>
      )}

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={dashboardUrl} style={styles.button}>
          {role === "VENDOR" ? "Go to Dashboard" : "Start Shopping"}
        </Link>
      </Section>

      <Text style={styles.muted}>
        Need help? Reply to this email or visit our{" "}
        <Link href={`${appUrl}/help`} style={{ color: styles.purplePrimary }}>
          Help Center
        </Link>
        .
      </Text>
    </EmailLayout>
  );
}
