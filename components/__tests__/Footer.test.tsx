import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/Footer';
import type { ReactNode } from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Footer', () => {
  it('shows a public Advertise With Us link pointing to the landing page', () => {
    render(<Footer />);

    const advertiseLink = screen.getByRole('link', { name: /Advertise With Us/i });
    expect(advertiseLink).toBeInTheDocument();
    expect(advertiseLink).toHaveAttribute('href', '/advertise');
  });
});
