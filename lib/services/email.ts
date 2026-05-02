import * as React from 'react';
import { Resend } from 'resend';
import { env, featureFlags } from '@/lib/config';
import { createEmailDeliveryLog, updateEmailDeliveryLog } from '@/lib/services/emailDeliveryLog';

let resend: Resend | null = null;
try {
  if (env.resendApiKey && featureFlags.enableEmail) resend = new Resend(env.resendApiKey);
} catch (err) {
  console.error('[Email Service] Failed to initialize Resend client:', err);
  resend = null;
}

const APP_NAME = 'MyHarvestHub';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
  tags,
}: SendEmailOptions): Promise<SendEmailResult> {
  const recipientList = Array.isArray(to) ? to : [to];
  const toField = recipientList.join(',');
  const maxAttempts = env.emailRetryAttempts;
  const baseDelayMs = env.emailRetryBaseDelayMs;

  const deliveryLog = await createEmailDeliveryLog({
    to: toField,
    subject,
    maxAttempts,
  });

  try {
    if (!featureFlags.enableEmail) {
      return { success: false, error: 'Email delivery disabled by feature flag' };
    }

    if (!resend) {
      const msg = '[Email Service] RESEND_API_KEY not configured — skipping send in non-production.';
      console.warn(msg);
      await updateEmailDeliveryLog(deliveryLog.id, {
        status: 'FAILED',
        attempts: 1,
        lastError: 'Resend API key not configured',
      });
      return { success: false, error: 'Resend API key not configured' };
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const { data, error } = await resend.emails.send({
        from: `${APP_NAME} <${env.emailFrom}>`,
        to: recipientList,
        subject,
        react,
        replyTo,
        tags,
      });

      if (!error) {
        await updateEmailDeliveryLog(deliveryLog.id, {
          status: 'SENT',
          attempts: attempt,
          providerId: data?.id ?? null,
          nextRetryAt: null,
          lastError: null,
        });
        return { success: true, id: data?.id };
      }

      const isLastAttempt = attempt === maxAttempts;
      const nextDelayMs = baseDelayMs * 2 ** (attempt - 1);
      const nextRetryAt = isLastAttempt ? null : new Date(Date.now() + nextDelayMs);
      console.error(`[Email Service] Failed to send email on attempt ${attempt}:`, error);

      await updateEmailDeliveryLog(deliveryLog.id, {
        status: isLastAttempt ? 'FAILED' : 'RETRYING',
        attempts: attempt,
        lastError: error.message,
        nextRetryAt,
      });

      if (!isLastAttempt) {
        await new Promise((resolve) => {
          setTimeout(resolve, nextDelayMs);
        });
      }
    }

    return { success: false, error: 'Failed to send email after retries' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[Email Service] Exception:', message);
    await updateEmailDeliveryLog(deliveryLog.id, {
      status: 'FAILED',
      attempts: deliveryLog.attempts + 1,
      lastError: message,
    });
    return { success: false, error: message };
  }
}

// ── Convenience wrappers for each email type ─────────────────────────

const getAppUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'https://harvesthub.ng';

export async function sendVerifyEmail(to: string, firstName: string, verificationToken: string) {
  const { VerifyEmail } = await import('@/lib/emails/VerifyEmail');
  const appUrl = getAppUrl();
  const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

  return sendEmail({
    to,
    subject: 'Verify your MyHarvestHub email',
    react: React.createElement(VerifyEmail, { firstName, verificationUrl }),
    tags: [{ name: 'category', value: 'verify-email' }],
  });
}

export async function sendResetPasswordEmail(to: string, firstName: string, resetToken: string) {
  const { ResetPassword } = await import('@/lib/emails/ResetPassword');
  const appUrl = getAppUrl();
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  return sendEmail({
    to,
    subject: 'Reset your MyHarvestHub password',
    react: React.createElement(ResetPassword, { firstName, resetUrl }),
    tags: [{ name: 'category', value: 'reset-password' }],
  });
}

type NotificationEmailDetail = {
  label: string;
  value: string;
};

export async function sendNotificationEmail(
  to: string,
  data: {
    firstName?: string;
    title: string;
    message: string;
    emailSubject?: string;
    link?: string | null;
    linkLabel?: string;
    details?: NotificationEmailDetail[];
    note?: string;
    type?: string;
  }
) {
  const { NotificationEmail } = await import('@/lib/emails/NotificationEmail');

  return sendEmail({
    to,
    subject: data.emailSubject || data.title,
    react: React.createElement(NotificationEmail, {
      firstName: data.firstName,
      title: data.title,
      message: data.message,
      link: data.link || undefined,
      linkLabel: data.linkLabel,
      details: data.details,
      note: data.note,
    }),
    tags: [{ name: 'category', value: 'notification' }, ...(data.type ? [{ name: 'type', value: data.type }] : [])],
  });
}

export async function sendWelcomeEmail(to: string, firstName: string, role: 'BUYER' | 'VENDOR') {
  const { WelcomeEmail } = await import('@/lib/emails/WelcomeEmail');

  return sendEmail({
    to,
    subject: `Welcome to MyHarvestHub${role === 'VENDOR' ? ' — Vendor Application Received' : ''}!`,
    react: React.createElement(WelcomeEmail, { firstName, role }),
    tags: [{ name: 'category', value: 'welcome' }],
  });
}

export async function sendOrderConfirmationEmail(to: string, data: any) {
  const { OrderConfirmation } = await import('@/lib/emails/OrderConfirmation');
  return sendEmail({
    to,
    subject: `Order ${data.orderNumber} confirmed — ₦${data.total.toLocaleString('en-NG')}`,
    react: React.createElement(OrderConfirmation, { ...data }),
    tags: [
      { name: 'category', value: 'order-confirmation' },
      { name: 'order', value: data.orderNumber },
    ],
  });
}

export async function sendOrderStatusUpdateEmail(to: string, data: any) {
  const { OrderStatusUpdate } = await import('@/lib/emails/OrderStatusUpdate');
  const statusLabels: Record<string, string> = {
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    READY_FOR_PICKUP: 'Ready for Pickup',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  };
  const cfg = statusLabels[String(data.status)] ?? 'Status update';

  return sendEmail({
    to,
    subject: `Order ${data.orderNumber} — ${cfg}`,
    react: React.createElement(OrderStatusUpdate, { ...data }),
    tags: [
      { name: 'category', value: 'order-status' },
      { name: 'order', value: data.orderNumber },
      { name: 'status', value: data.status },
    ],
  });
}

export async function sendVendorApprovalEmail(to: string, data: any) {
  const { VendorApproval } = await import('@/lib/emails/VendorApproval');

  return sendEmail({
    to,
    subject: data.approved
      ? `Your store "${data.storeName}" has been approved!`
      : `Update on your "${data.storeName}" application`,
    react: React.createElement(VendorApproval, { ...data }),
    tags: [
      { name: 'category', value: 'vendor-approval' },
      { name: 'approved', value: String(data.approved) },
    ],
  });
}

export async function sendAvailabilityRequestEmail(to: string, data: any) {
  const { AvailabilityRequest } = await import('@/lib/emails/AvailabilityRequest');

  return sendEmail({
    to,
    subject: `Availability check: "${data.productName}" × ${data.quantity}`,
    react: React.createElement(AvailabilityRequest, { ...data }),
    tags: [
      { name: 'category', value: 'availability-request' },
      { name: 'requestId', value: data.requestId },
    ],
  });
}

export async function sendAvailabilityResponseEmail(to: string, data: any) {
  const { AvailabilityResponse } = await import('@/lib/emails/AvailabilityResponse');

  return sendEmail({
    to,
    subject: data.available
      ? `"${data.productName}" is available from ${data.vendorName}!`
      : `"${data.productName}" — vendor response`,
    react: React.createElement(AvailabilityResponse, { ...data }),
    tags: [{ name: 'category', value: 'availability-response' }],
  });
}

export async function sendWithdrawalRequestEmail(to: string, data: any) {
  const { WithdrawalRequest } = await import('@/lib/emails/WithdrawalRequest');

  return sendEmail({
    to,
    subject: `Withdrawal ${data.status.toLowerCase()}: ₦${data.amount.toLocaleString('en-NG')}`,
    react: React.createElement(WithdrawalRequest, { ...data }),
    tags: [
      { name: 'category', value: 'withdrawal' },
      { name: 'status', value: data.status },
      { name: 'reference', value: data.reference },
    ],
  });
}

export async function sendLowStockAlertEmail(to: string, data: any) {
  const { LowStockAlert } = await import('@/lib/emails/LowStockAlert');
  const count = data.products.length;

  return sendEmail({
    to,
    subject: `Low stock alert: ${count} product${count > 1 ? 's' : ''} need attention`,
    react: React.createElement(LowStockAlert, { ...data }),
    tags: [{ name: 'category', value: 'low-stock' }],
  });
}
