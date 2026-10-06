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
  "bug-status-update": {
    key: "bug-status-update",
    label: "Bug Report Status Update",
    description: "Sent when a bug report status changes (Open → In Progress → Resolved → Closed).",
    defaultSubject: "Update on your report “{{title}}” — now {{nextStatus}}",
    defaultBody:
      "Hi {{reporterName}},\n\nYour report “{{title}}” is now {{nextStatus}} (was {{prevStatus}}).\n\nNote: {{adminNotes}}\n\nView or reply at {{appUrl}}/bug-report\n\n— MyHarvestHub Support",
    variables: ["reporterName", "title", "prevStatus", "nextStatus", "adminNotes", "appUrl"],
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
  "SERVICE_REQUIREMENTS_REQUESTED": {
    key: "SERVICE_REQUIREMENTS_REQUESTED",
    label: "Service Requirements Requested",
    description: "Sent to the buyer when a paid service order needs requirements before work starts.",
    defaultSubject: "Requirements needed for order {{orderNumber}}",
    defaultBody:
      "Hi {{firstName}},\n\nYour service order {{orderNumber}} needs a few details from you before the vendor can start.\n\nSubmit your requirements here: {{link}}\n\n— MyHarvestHub",
    variables: ["firstName", "orderNumber", "link"],
  },
  "SERVICE_REQUIREMENTS_SUBMITTED": {
    key: "SERVICE_REQUIREMENTS_SUBMITTED",
    label: "Service Requirements Submitted",
    description: "Sent to the seller when the buyer submits the service requirements.",
    defaultSubject: "Requirements submitted for order {{orderNumber}}",
    defaultBody:
      "Hi {{firstName}},\n\nThe buyer submitted their requirements for order {{orderNumber}}. You can start work now.\n\nOpen the order: {{link}}\n\n— MyHarvestHub",
    variables: ["firstName", "orderNumber", "link"],
  },
  "SERVICE_DELIVERED": {
    key: "SERVICE_DELIVERED",
    label: "Service Delivered",
    description: "Sent to the buyer when the seller submits delivery — includes the approve & release CTA.",
    defaultSubject: "Order {{orderNumber}} delivered — review & release",
    defaultBody:
      "Hi {{firstName}},\n\nYour vendor delivered order {{orderNumber}}. Review the delivery and release the payment when you're happy with it.\n\nAccept & release: {{link}}\n\n— MyHarvestHub",
    variables: ["firstName", "orderNumber", "link"],
  },
  "SERVICE_RELEASED": {
    key: "SERVICE_RELEASED",
    label: "Service Settlement Released",
    description: "Sent to the seller when settlement for a service order is released.",
    defaultSubject: "Settlement released for order {{orderNumber}}",
    defaultBody:
      "Hi {{firstName}},\n\nSettlement for order {{orderNumber}} has been released to your wallet.\n\nView your wallet: {{link}}\n\n— MyHarvestHub",
    variables: ["firstName", "orderNumber", "net", "link"],
  },
  "SERVICE_REVISION_REQUESTED": {
    key: "SERVICE_REVISION_REQUESTED",
    label: "Service Revision Requested",
    description: "Sent to the seller when the buyer requests a revision in review.",
    defaultSubject: "Revision requested on order {{orderNumber}}",
    defaultBody:
      "Hi {{firstName}},\n\nThe buyer requested a revision on order {{orderNumber}}. Your deadline has been re-armed.\n\nOpen the order: {{link}}\n\n— MyHarvestHub",
    variables: ["firstName", "orderNumber", "link"],
  },
  "SERVICE_REQUIREMENTS_TIMEOUT": {
    key: "SERVICE_REQUIREMENTS_TIMEOUT",
    label: "Service Requirements Timeout",
    description: "Sent to the seller when a buyer never submits service requirements before the timeout.",
    defaultSubject: "Requirements timeout for order {{orderNumber}}",
    defaultBody:
      "Hi {{firstName}},\n\nThe buyer has not submitted requirements for order {{orderNumber}} within the allowed window. You may cancel without penalty.\n\nOpen the order: {{link}}\n\n— MyHarvestHub",
    variables: ["firstName", "orderNumber", "link"],
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
