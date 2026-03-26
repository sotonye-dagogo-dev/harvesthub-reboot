import { Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./EmailLayout";

interface ResetPasswordProps {
  firstName: string;
  resetUrl: string;
}

export function ResetPassword({ firstName, resetUrl }: ResetPasswordProps) {
  return (
    <EmailLayout previewText="Reset your MyHarvestHub password" heading="Reset Your Password">
      <Text style={styles.paragraph}>Hi {firstName},</Text>
      <Text style={styles.paragraph}>
        We received a request to reset the password for your MyHarvestHub account. Click the button
        below to set a new password.
      </Text>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={resetUrl} style={styles.button}>
          Reset Password
        </Link>
      </Section>

      <Text style={styles.muted}>
        This link expires in 1 hour. If you didn&apos;t request a password reset, you can safely
        ignore this email — your password will not change.
      </Text>

      <Text style={styles.muted}>If the button doesn&apos;t work, copy and paste this URL:</Text>
      <Text style={{ ...styles.muted, wordBreak: "break-all" }}>{resetUrl}</Text>
    </EmailLayout>
  );
}
