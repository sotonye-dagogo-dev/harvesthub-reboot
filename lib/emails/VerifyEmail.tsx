import { Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./EmailLayout";

interface VerifyEmailProps {
  firstName: string;
  verificationUrl: string;
}

export function VerifyEmail({ firstName, verificationUrl }: VerifyEmailProps) {
  return (
    <EmailLayout previewText="Verify your MyHarvestHub account" heading="Verify Your Email">
      <Text style={styles.paragraph}>Hi {firstName},</Text>
      <Text style={styles.paragraph}>
        Thanks for signing up for MyHarvestHub! Please verify your email address by clicking the
        button below.
      </Text>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={verificationUrl} style={styles.button}>
          Verify Email Address
        </Link>
      </Section>

      <Text style={styles.muted}>
        This link expires in 24 hours. If you didn&apos;t create a MyHarvestHub account, you can
        safely ignore this email.
      </Text>

      <Text style={styles.muted}>
        If the button doesn&apos;t work, copy and paste this URL into your browser:
      </Text>
      <Text style={{ ...styles.muted, wordBreak: "break-all" }}>{verificationUrl}</Text>
    </EmailLayout>
  );
}
