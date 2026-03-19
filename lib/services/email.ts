import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.RESEND_API_KEY?.toString();
let resend: Resend | null = null;
try {
  if (RESEND_API_KEY) resend = new Resend(RESEND_API_KEY);
} catch (err) {
  console.error('[Email Service] Failed to initialize Resend client:', err);
  resend = null;
}

const EMAIL_FROM = process.env.NEXT_PUBLIC_EMAIL_FROM || 'noreply@myharvesthub.ng';
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
  try {
    if (!resend) {
      const msg = '[Email Service] RESEND_API_KEY not configured — skipping send in non-production.';
      console.warn(msg);
      return { success: false, error: 'Resend API key not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${EMAIL_FROM}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      replyTo,
      tags,
    });

    if (error) {
      console.error('[Email Service] Failed to send email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[Email Service] Exception:', message);
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
