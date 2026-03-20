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

export { sendVerifyEmail } from '@/lib/emails/VerifyEmail';
export { sendResetPasswordEmail } from '@/lib/emails/ResetPassword';
export { sendWelcomeEmail } from '@/lib/emails/WelcomeEmail';
export { sendOrderConfirmationEmail } from '@/lib/emails/OrderConfirmation';
export { sendOrderStatusUpdateEmail } from '@/lib/emails/OrderStatusUpdate';
export { sendVendorApprovalEmail } from '@/lib/emails/VendorApproval';
export { sendAvailabilityRequestEmail } from '@/lib/emails/AvailabilityRequest';
export { sendAvailabilityResponseEmail } from '@/lib/emails/AvailabilityResponse';
export { sendWithdrawalRequestEmail } from '@/lib/emails/WithdrawalRequest';
export { sendLowStockAlertEmail } from '@/lib/emails/LowStockAlert';
