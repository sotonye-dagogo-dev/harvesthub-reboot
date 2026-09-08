export type EmailTemplateDefinition = {
  key: string;
  label: string;
  description: string;
  defaultSubject: string;
  defaultBody: string;
  variables: string[];
};

export const DEFAULT_EMAIL_TEMPLATES: Record<string, EmailTemplateDefinition> = {
  "order-confirmation": {
    key: "order-confirmation",
    label: "Order Confirmation",
    description: "Sent to buyer when an order is placed. Includes order summary with variants.",
    defaultSubject: "Order {{orderNumber}} confirmed — {{total}}",
    defaultBody:
      "Hi {{firstName}},\n\nYour order {{orderNumber}} has been placed successfully with {{vendorName}}.\n\nItems:\n{{itemsSummary}}\n\nTotal: {{total}}\nDelivery: {{deliveryMethod}}\n\nView your order: {{orderUrl}}\n\nThank you for shopping with MyHarvestHub!",
    variables: ["firstName", "orderNumber", "vendorName", "itemsSummary", "total", "deliveryMethod", "orderUrl"],
  },
  "order-status-update": {
    key: "order-status-update",
    label: "Order Status Update",
    description: "Sent when order status changes (confirmed, shipped, delivered, etc.)",
    defaultSubject: "Order {{orderNumber}} — {{status}}",
    defaultBody: "Hi {{firstName}},\n\nYour order {{orderNumber}} is now {{status}}.\n\n{{message}}\n\nView order: {{orderUrl}}",
    variables: ["firstName", "orderNumber", "status", "message", "orderUrl"],
  },
  "bug-resolved": {
    key: "bug-resolved",
    label: "Bug Report Resolved",
    description: "Sent to reporter when their bug report is marked resolved.",
    defaultSubject: "Your report “{{title}}” has been resolved",
    defaultBody:
      "Hi {{reporterName}},\n\nThank you for reporting “{{title}}”. Our team has resolved the issue.\n\nSummary: {{adminNotes}}\n\nIf you still experience this, reply to this email or submit a new report at {{appUrl}}/bug-report.\n\n— MyHarvestHub Support",
    variables: ["reporterName", "title", "adminNotes", "appUrl"],
  },
  "verify-email": {
    key: "verify-email",
    label: "Verify Email",
    description: "Email verification link after signup or email change.",
    defaultSubject: "Verify your MyHarvestHub email",
    defaultBody: "Hi {{firstName}},\n\nPlease verify your email by visiting: {{verificationUrl}}\n\nThis link expires in 24 hours.",
    variables: ["firstName", "verificationUrl"],
  },
  "reset-password": {
    key: "reset-password",
    label: "Reset Password",
    description: "Password reset link.",
    defaultSubject: "Reset your MyHarvestHub password",
    defaultBody: "Hi {{firstName}},\n\nReset your password here: {{resetUrl}}\n\nIf you did not request this, ignore this email.",
    variables: ["firstName", "resetUrl"],
  },
  "welcome": {
    key: "welcome",
    label: "Welcome",
    description: "Welcome email after successful verification.",
    defaultSubject: "Welcome to MyHarvestHub{{vendorSuffix}}!",
    defaultBody: "Hi {{firstName}},\n\nWelcome to MyHarvestHub! We're glad you're here.",
    variables: ["firstName", "vendorSuffix"],
  },
};

export function renderTemplateString(template: string, vars: Record<string, string>): string {
  return template.replace(/{{(\w+)}}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{{${k}}}`));
}

export async function fetchEmailTemplateNonBlocking(key: string): Promise<{ subject: string; body: string } | null> {
  if (typeof fetch === "undefined") return null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`/api/config/email-templates?key=${encodeURIComponent(key)}`, { cache: "no-store", signal: controller.signal }).finally(() => clearTimeout(t));
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as { template?: { subject: string; body: string } } | null;
    if (data?.template?.subject && data?.template?.body) return data.template;
    return null;
  } catch {
    return null;
  }
}
