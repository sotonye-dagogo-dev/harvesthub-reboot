import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

const purplePrimary = "#9333ea";
const purpleDark = "#7e22ce";
const grayText = "#6b7280";
const grayBorder = "#e5e7eb";

interface EmailLayoutProps {
  previewText: string;
  heading: string;
  children: React.ReactNode;
}

export function EmailLayout({ previewText, heading, children }: EmailLayoutProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://harvesthub.ng";

  return (
    <>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Link href={appUrl} style={{ textDecoration: "none" }}>
              <Text style={logoTextStyle}>MyHarvestHub</Text>
            </Link>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            <Heading style={headingStyle}>{heading}</Heading>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              © {new Date().getFullYear()} MyHarvestHub. All rights reserved.
            </Text>
            <Text style={footerTextStyle}>
              <Link href={`${appUrl}/help`} style={footerLinkStyle}>
                Help
              </Link>
              {" · "}
              <Link href={`${appUrl}/privacy`} style={footerLinkStyle}>
                Privacy
              </Link>
              {" · "}
              <Link href={`${appUrl}/terms`} style={footerLinkStyle}>
                Terms
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </>
  );
}

// ── Shared style tokens exported for template use ─────────────────

export const styles = {
  purplePrimary,
  purpleDark,
  grayText,
  grayBorder,
  paragraph: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#374151",
    margin: "16px 0",
  } as React.CSSProperties,
  button: {
    display: "inline-block",
    backgroundColor: purplePrimary,
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    textAlign: "center" as const,
    padding: "12px 32px",
    borderRadius: "8px",
  } as React.CSSProperties,
  buttonSecondary: {
    display: "inline-block",
    backgroundColor: "#ffffff",
    color: purplePrimary,
    fontSize: "14px",
    fontWeight: 600,
    textDecoration: "none",
    textAlign: "center" as const,
    padding: "10px 24px",
    borderRadius: "8px",
    border: `2px solid ${purplePrimary}`,
  } as React.CSSProperties,
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    margin: "16px 0",
  } as React.CSSProperties,
  tableRow: {
    borderBottom: `1px solid ${grayBorder}`,
  } as React.CSSProperties,
  tableCellLabel: {
    padding: "8px 0",
    fontSize: "14px",
    color: grayText,
    width: "40%",
  } as React.CSSProperties,
  tableCellValue: {
    padding: "8px 0",
    fontSize: "14px",
    color: "#111827",
    fontWeight: 600,
  } as React.CSSProperties,
  badge: (color: string, bg: string) =>
    ({
      display: "inline-block",
      fontSize: "12px",
      fontWeight: 600,
      color,
      backgroundColor: bg,
      padding: "4px 10px",
      borderRadius: "9999px",
    }) as React.CSSProperties,
  muted: {
    fontSize: "13px",
    color: grayText,
    margin: "8px 0",
  } as React.CSSProperties,
};

// ── Internal styles ───────────────────────────────────────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "24px 16px",
};

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "24px 0 16px",
};

const logoTextStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: purplePrimary,
  margin: 0,
};

const contentStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "32px 24px",
  border: `1px solid ${grayBorder}`,
};

const headingStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 16px",
};

const hrStyle: React.CSSProperties = {
  border: "none",
  borderTop: `1px solid ${grayBorder}`,
  margin: "24px 0 16px",
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "0 0 16px",
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "4px 0",
};

const footerLinkStyle: React.CSSProperties = {
  color: "#9ca3af",
  textDecoration: "underline",
};
