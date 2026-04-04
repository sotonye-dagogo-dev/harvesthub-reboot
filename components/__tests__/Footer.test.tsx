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
  it('shows a public Apply to Advertise CTA link', () => {
    render(<Footer />);

    const applyLink = screen.getByRole('link', { name: /Apply to Advertise/i });
    expect(applyLink).toBeInTheDocument();
    expect(applyLink).toHaveAttribute('href', '/ad-application');
  });
});
