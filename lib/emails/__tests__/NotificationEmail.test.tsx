import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationEmail } from '@/lib/emails/NotificationEmail';

describe('NotificationEmail', () => {
  it('renders a branded details table and action button when structured metadata is present', () => {
    render(
      <NotificationEmail
        firstName="Grace"
        title="Wallet Deposit Successful"
        message="Your wallet has been credited successfully."
        link="/wallet"
        linkLabel="View Wallet"
        details={[
          { label: 'Amount', value: '₦5,000' },
          { label: 'Reference', value: 'PAY-123' },
        ]}
        note="This update is non-blocking and will not delay other app activity."
      />
    );

    expect(screen.getByRole('heading', { name: /wallet deposit successful/i })).toBeInTheDocument();
    expect(screen.getByText(/hi grace/i)).toBeInTheDocument();
    expect(screen.getByText(/your wallet has been credited successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/details/i)).toBeInTheDocument();
    expect(screen.getByText(/amount/i)).toBeInTheDocument();
    expect(screen.getByText(/reference/i)).toBeInTheDocument();
    expect(screen.getByText(/pay-123/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view wallet/i })).toBeInTheDocument();
    expect(screen.getByText(/non-blocking/i)).toBeInTheDocument();
  });
});
