import { Metadata } from "next";
import Link from "next/link";
import {
  Megaphone,
  LayoutPanelTop,
  ScanLine,
  Square,
  FileText,
  CreditCard,
  CheckCircle2,
  Rocket,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Mail,
} from "lucide-react";
import { getPublicContentBySlug } from "@/lib/data/publicContent";
import { advertisingConfig } from "@/lib/config/siteContent";

export const metadata: Metadata = {
  title: advertisingConfig.metadata.title,
  description: advertisingConfig.metadata.description,
};

const placementIcons: Record<string, typeof LayoutPanelTop> = {
  TOP: LayoutPanelTop,
  HERO: ScanLine,
  SIDEBAR: Square,
};

const stepIcons = [FileText, CreditCard, CheckCircle2, Rocket];

export default async function AdvertiseLandingPage() {
  const publicContent = await getPublicContentBySlug("advertise");
  const hasAdminContent = Boolean(
    publicContent && publicContent.status === "PUBLISHED" && publicContent.body
  );
  const adminContent = hasAdminContent ? publicContent! : null;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <section className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-ds-text-brand">
          {advertisingConfig.hero.eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-bold text-ds-text-primary sm:text-5xl">
          {advertisingConfig.hero.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ds-text-secondary">
          {advertisingConfig.hero.subtitle}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={advertisingConfig.routes.apply}
            className="inline-flex items-center justify-center gap-2 rounded-ds-md bg-ds-brand-primary px-6 py-3 font-semibold text-white hover:bg-ds-brand-primary-hover dark:bg-ds-brand-primary dark:hover:bg-ds-brand-primary"
          >
            <Megaphone className="h-5 w-5" />
            {advertisingConfig.cta.primaryLabel}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-ds-md border border-ds-border-base px-6 py-3 font-semibold text-ds-text-primary hover:bg-ds-surface-sunken"
          >
            <Mail className="h-5 w-5" />
            {advertisingConfig.cta.secondaryLabel}
          </Link>
        </div>
      </section>

      {/* Narrative (admin-editable) */}
      <section className="mx-auto mt-16 max-w-4xl">
        {adminContent ? (
          <>
            <h2 className="mb-4 text-2xl font-semibold text-ds-text-primary">
              {adminContent.title}
            </h2>
            <div
              className="prose max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: adminContent.body }}
            />
          </>
        ) : (
          <>
            <h2 className="mb-4 text-2xl font-semibold text-ds-text-primary">
              {advertisingConfig.narrativeHeading}
            </h2>
            <p className="text-ds-text-secondary">
              MyHarvestHub is a trusted faith-based marketplace connecting buyers with quality
              vendors across Lagos and beyond. Sponsoring a banner places your brand in front of an
              engaged community that values shared trust, faith, and local commerce. Whether you are
              promoting a product, an event, a service, or an announcement, our curated placements
              are designed to help you reach the right audience with clarity and impact.
            </p>
          </>
        )}
      </section>

      {/* Placements */}
      <section className="mx-auto mt-16 max-w-5xl">
        <h2 className="text-2xl font-semibold text-ds-text-primary">
          {advertisingConfig.placementsHeading}
        </h2>
        <p className="mt-2 text-ds-text-secondary">{advertisingConfig.placementsSubtitle}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {advertisingConfig.placements.map((placement) => {
            const Icon = placementIcons[placement.position] ?? LayoutPanelTop;
            return (
              <div
                key={placement.position}
                className="flex flex-col rounded-ds-md border border-ds-border-base bg-ds-surface-base p-6"
              >
                <Icon className="mb-4 h-8 w-8 text-ds-text-brand" />
                <h3 className="font-semibold text-ds-text-primary">{placement.title}</h3>
                <p className="mt-2 flex-1 text-sm text-ds-text-secondary">
                  {placement.description}
                </p>
                <dl className="mt-4 space-y-1 rounded-ds-md bg-ds-surface-muted p-3 text-xs text-ds-text-secondary">
                  <div className="flex justify-between">
                    <dt>Dimensions</dt>
                    <dd className="text-ds-text-primary">{placement.dimensions}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Aspect ratio</dt>
                    <dd className="text-ds-text-primary">{placement.ratio}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="mb-8 text-2xl font-semibold text-ds-text-primary">
          {advertisingConfig.stepsHeading}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {advertisingConfig.steps.map((step, index) => {
            const Icon = stepIcons[index] ?? Rocket;
            return (
              <div key={step.title} className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-ds-md bg-ds-brand-subtle text-ds-text-brand">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-ds-text-primary">{step.title}</h3>
                  <p className="mt-1 text-sm text-ds-text-secondary">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Policies */}
      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="mb-8 text-2xl font-semibold text-ds-text-primary">
          {advertisingConfig.policiesHeading}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {advertisingConfig.policies.map((policy) => (
            <div
              key={policy.title}
              className="rounded-ds-md border border-ds-border-base bg-ds-surface-base p-5"
            >
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-ds-text-brand" />
                <h3 className="font-semibold text-ds-text-primary">{policy.title}</h3>
              </div>
              <p className="text-sm text-ds-text-secondary">{policy.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-6 text-2xl font-semibold text-ds-text-primary">
          {advertisingConfig.faqsHeading}
        </h2>
        <div className="space-y-3">
          {advertisingConfig.faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-ds-md border border-ds-border-base bg-ds-surface-base p-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-ds-text-primary">
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 flex-shrink-0 text-ds-text-brand" />
                  {faq.question}
                </span>
              </summary>
              <p className="mt-3 text-sm text-ds-text-secondary">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto mt-16 max-w-4xl rounded-ds-md bg-ds-brand-surface p-8 text-center">
        <h2 className="text-2xl font-semibold text-ds-text-primary">
          {advertisingConfig.cta.heading}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-ds-text-secondary">
          {advertisingConfig.cta.description}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={advertisingConfig.routes.apply}
            className="inline-flex items-center justify-center gap-2 rounded-ds-md bg-ds-brand-primary px-6 py-3 font-semibold text-white hover:bg-ds-brand-primary-hover dark:bg-ds-brand-primary dark:hover:bg-ds-brand-primary"
          >
            {advertisingConfig.cta.primaryLabel}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href={advertisingConfig.routes.simpleApply}
            className="inline-flex items-center justify-center gap-2 rounded-ds-md border border-ds-border-base px-6 py-3 font-semibold text-ds-text-primary hover:bg-ds-surface-sunken"
          >
            Quick application
          </Link>
        </div>
        <p className="mt-4 text-sm text-ds-text-secondary">
          Curious how advertising works?{" "}
          <Link href="/blog" className="font-medium text-ds-text-brand hover:underline">
            Read our blog
          </Link>
          .
        </p>
      </section>
    </div>
  );
}