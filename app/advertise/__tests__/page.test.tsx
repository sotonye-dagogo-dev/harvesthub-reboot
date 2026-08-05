import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdvertiseLandingPage from '@/app/advertise/page';
import { advertisingConfig } from '@/lib/config/siteContent';

const getPublicContentBySlugMock = vi.fn();

vi.mock('@/lib/data/publicContent', () => ({
  getPublicContentBySlug: (...args: unknown[]) => getPublicContentBySlugMock(...args),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AdvertiseLandingPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getPublicContentBySlugMock.mockReset();
  });

  it('renders the hero with config copy and an apply CTA targeting the apply route', async () => {
    getPublicContentBySlugMock.mockResolvedValue(null);
    const page = await AdvertiseLandingPage();
    render(page);

    expect(screen.getByText(advertisingConfig.hero.title)).toBeInTheDocument();
    expect(screen.getByText(advertisingConfig.hero.subtitle)).toBeInTheDocument();

    const applyLinks = screen.getAllByRole('link', {
      name: advertisingConfig.cta.primaryLabel,
    });
    expect(applyLinks.length).toBeGreaterThan(0);
    for (const applyLink of applyLinks) {
      expect(applyLink).toHaveAttribute('href', advertisingConfig.routes.apply);
    }
  });

  it('falls back to config narrative when no published admin content exists', async () => {
    getPublicContentBySlugMock.mockResolvedValue(null);
    const page = await AdvertiseLandingPage();
    render(page);

    expect(screen.getByText(advertisingConfig.narrativeHeading)).toBeInTheDocument();
    expect(
      screen.getByText(/MyHarvestHub is a trusted faith-based marketplace/i),
    ).toBeInTheDocument();
  });

  it('renders admin-authored published body as the narrative', async () => {
    getPublicContentBySlugMock.mockResolvedValue({
      id: 'adv-1',
      slug: 'advertise',
      title: 'Admin Narrative',
      body: '<p>Admin-managed sponsorship narrative</p>',
      metadata: null,
      status: 'PUBLISHED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const page = await AdvertiseLandingPage();
    render(page);

    expect(screen.getByText('Admin-managed sponsorship narrative')).toBeInTheDocument();
    expect(
      screen.queryByText(advertisingConfig.narrativeHeading),
    ).not.toBeInTheDocument();
  });

  it('renders placements, process steps, policies, and FAQ sections from config', async () => {
    getPublicContentBySlugMock.mockResolvedValue(null);
    const page = await AdvertiseLandingPage();
    render(page);

    expect(screen.getByText(advertisingConfig.placementsHeading)).toBeInTheDocument();
    for (const placement of advertisingConfig.placements) {
      expect(screen.getByText(placement.title)).toBeInTheDocument();
    }

    expect(screen.getByText(advertisingConfig.stepsHeading)).toBeInTheDocument();
    for (const step of advertisingConfig.steps) {
      expect(screen.getByText(step.title)).toBeInTheDocument();
    }

    expect(screen.getByText(advertisingConfig.policiesHeading)).toBeInTheDocument();
    for (const policy of advertisingConfig.policies) {
      expect(screen.getByText(policy.title)).toBeInTheDocument();
    }

    expect(screen.getByText(advertisingConfig.faqsHeading)).toBeInTheDocument();
    for (const faq of advertisingConfig.faqs) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
    }
  });

  it('provides a secondary quick-application CTA to the simple public route', async () => {
    getPublicContentBySlugMock.mockResolvedValue(null);
    const page = await AdvertiseLandingPage();
    render(page);

    const quickLink = screen.getByRole('link', { name: 'Quick application' });
    expect(quickLink).toHaveAttribute('href', advertisingConfig.routes.simpleApply);
  });
});
