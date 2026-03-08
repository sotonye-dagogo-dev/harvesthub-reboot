import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './EmailLayout';
import { sendEmail } from '@/lib/services/email';

interface AvailabilityResponseProps {
  buyerFirstName: string;
  productName: string;
  vendorName: string;
  available: boolean;
  quantity: number;
  estimatedPrice?: number;
  vendorMessage?: string;
}

function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

export function AvailabilityResponse({
  buyerFirstName,
  productName,
  vendorName,
  available,
  quantity,
  estimatedPrice,
  vendorMessage,
}: AvailabilityResponseProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://harvesthub.ng';

  return (
    <EmailLayout
      previewText={
        available
          ? `"${productName}" is available from ${vendorName}!`
          : `"${productName}" is not available from ${vendorName}`
      }
      heading="Availability Response"
    >
      <Text style={styles.paragraph}>Hi {buyerFirstName},</Text>
      <Text style={styles.paragraph}>
        <strong>{vendorName}</strong> has responded to your availability check for{' '}
        <strong>{productName}</strong>.
      </Text>

      <Section style={{ textAlign: 'center', margin: '16px 0' }}>
        {available ? (
          <Text style={styles.badge('#22c55e', '#dcfce7')}>✓ Available</Text>
        ) : (
          <Text style={styles.badge('#ef4444', '#fee2e2')}>✗ Not Available</Text>
        )}
      </Section>

      {available && (
        <table style={styles.table}>
          <tbody>
            <tr style={styles.tableRow}>
              <td style={styles.tableCellLabel}>Quantity</td>
              <td style={styles.tableCellValue}>{quantity} available</td>
            </tr>
            {estimatedPrice && (
              <tr style={styles.tableRow}>
                <td style={styles.tableCellLabel}>Price</td>
                <td style={styles.tableCellValue}>{formatNgn(estimatedPrice)}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {vendorMessage && (
        <Section
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            padding: '12px 16px',
            margin: '16px 0',
          }}
        >
          <Text style={{ ...styles.muted, margin: 0 }}>
            <strong>From {vendorName}:</strong> {vendorMessage}
          </Text>
        </Section>
      )}

      {available ? (
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Link href={`${appUrl}/products`} style={styles.button}>
            Order Now
          </Link>
        </Section>
      ) : (
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Link href={`${appUrl}/products`} style={styles.buttonSecondary}>
            Browse Alternatives
          </Link>
        </Section>
      )}
    </EmailLayout>
  );
}

export async function sendAvailabilityResponseEmail(
  to: string,
  data: AvailabilityResponseProps,
) {
  return sendEmail({
    to,
    subject: data.available
      ? `"${data.productName}" is available from ${data.vendorName}!`
      : `"${data.productName}" — vendor response`,
    react: <AvailabilityResponse {...data} />,
    tags: [{ name: 'category', value: 'availability-response' }],
  });
}
