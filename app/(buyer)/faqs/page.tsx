import { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQs | MyHarvestHub",
  description:
    "Frequently asked questions about using MyHarvestHub.org — a faith-driven e-commerce marketplace.",
};

export default function FAQsPage() {
  const faqs = [
    {
      category: "About the Platform",
      questions: [
        {
          q: "What is MyHarvestHub.org?",
          a: "MyHarvestHub.org is a faith-driven e-commerce marketplace that connects Christian entrepreneurs, service providers, and buyers. Our goal is to empower Christian businesses by offering a low-commission platform where buyers can access affordable, high-quality goods and services while building a community of trust and faith.",
        },
        {
          q: "Is MyHarvestHub.org owned or operated by Harvesters International Christian Center?",
          a: "No. MyHarvestHub.org is independent and not owned, operated, or managed by Harvesters International Christian Center or any other church organization. While we are inspired by Christian values, we are a separate commercial entity.",
        },
        {
          q: "Who can use the platform?",
          a: "Anyone can browse and purchase products or services. However, we are especially designed to support Christian entrepreneurs, worship centers, and buyers looking to support faith-driven businesses.",
        },
      ],
    },
    {
      category: "Buyers",
      questions: [
        {
          q: "How do I confirm the authenticity of a product before purchasing?",
          a: "Buyers must carefully review product descriptions, images, and Seller ratings. Communication with the Seller is encouraged before making payment, as all purchases are final under our no-refund policy.",
        },
        {
          q: "Does MyHarvestHub.org offer refunds or returns?",
          a: "No. MyHarvestHub.org is a strictly no-refund marketplace, except where refunds are legally required under Nigerian consumer protection laws. Buyers are responsible for confirming authenticity and suitability before payment.",
        },
        {
          q: "Who handles product delivery and logistics?",
          a: "Delivery arrangements are strictly between Buyers and Sellers. MyHarvestHub.org is not responsible for logistics, shipping delays, or damaged goods.",
        },
        {
          q: "Are there buyer protections?",
          a: "Buyers are protected by the ability to report fraudulent Sellers. Fraudulent Sellers will have their stores closed, accounts terminated, and may be reported to authorities. However, the Platform itself does not issue refunds or intervene in disputes.",
        },
      ],
    },
    {
      category: "Sellers & Vendors",
      questions: [
        {
          q: "How do Sellers benefit from MyHarvestHub.org?",
          a: "We offer low commission rates compared to mainstream platforms, enabling Sellers to provide the best prices and discounts to buyers. We also provide faith-based visibility, targeted advertising, and community trust.",
        },
        {
          q: "What are Sellers' responsibilities?",
          a: "Sellers are responsible for: providing accurate product descriptions, pricing, and images; ensuring all products/services are authentic and lawful; and handling delivery and logistics directly with Buyers.",
        },
        {
          q: "What happens if a Seller is found to be fraudulent?",
          a: "Fraudulent Sellers will have their accounts permanently terminated, their stores closed without compensation, and be reported to law enforcement authorities for prosecution.",
        },
        {
          q: "Can churches or worship centers sell or advertise on the platform?",
          a: "Yes. Worship centers can sell items (e.g., books, CDs, merchandise) and promote events through advertising placements.",
        },
      ],
    },
    {
      category: "Advertisers & Corporate Brands",
      questions: [
        {
          q: "Can corporate brands advertise on MyHarvestHub.org?",
          a: "Yes. Corporate brands can advertise products and services to our Christian community. Advertisers are responsible for ensuring compliance with Nigerian advertising and intellectual property laws.",
        },
        {
          q: "Does the platform provide discounts through advertisers?",
          a: "Yes. We partner with corporate advertisers to introduce discount coupons for our users, making high-quality goods and services more accessible.",
        },
        {
          q: "Is MyHarvestHub.org responsible for third-party advertisements?",
          a: "No. Advertisers are solely responsible for their ads. MyHarvestHub.org disclaims all liability for misleading, unlawful, or inaccurate advertisements.",
        },
      ],
    },
    {
      category: "Platform Policies & Data",
      questions: [
        {
          q: "Can pricing or subscription fees change?",
          a: "Yes. MyHarvestHub.org reserves the right to modify product pricing, subscription fees, and membership tiers at any time without notice.",
        },
        {
          q: "How does MyHarvestHub.org use customer data?",
          a: "We reserve the right to collect, use, and analyze user data for operational, commercial, promotional, and religious purposes, including targeted advertising. By using the Platform, Users consent to these practices.",
        },
        {
          q: "Does the platform promote religious content?",
          a: "Yes. As a faith-driven marketplace, we reserve the right to display Christian religious content, promotions, and event advertisements to all Users, including Buyers, Sellers, and Advertisers.",
        },
        {
          q: "Is MyHarvestHub.org involved in disputes between Buyers and Sellers?",
          a: "No. Disputes must be resolved directly between Buyers and Sellers. The Platform does not mediate or intervene but may take enforcement actions against fraudulent activity.",
        },
      ],
    },
    {
      category: "Technical & General",
      questions: [
        {
          q: "How do I create an account?",
          a: 'Simply click on "Sign Up" at MyHarvestHub.org, provide your basic details, and choose whether you are registering as a Buyer, Seller, or Advertiser.',
        },
        {
          q: "Can MyHarvestHub.org suspend or terminate my account?",
          a: "Yes. We reserve the right to suspend, restrict, or terminate any account that violates our Terms & Conditions, engages in fraud, or breaches Nigerian law.",
        },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-ds-text-primary">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-ds-text-secondary">
          Quick answers to common questions about using MyHarvestHub
        </p>
      </div>

      <div className="mx-auto max-w-4xl space-y-12">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="mb-6 text-2xl font-bold text-ds-text-primary">
              {section.category}
            </h2>
            <div className="space-y-4">
              {section.questions.map((faq, index) => (
                <details
                  key={index}
                  className="group rounded-ds-md border border-ds-border-base p-4"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-semibold text-ds-text-primary">
                    <span>{faq.q}</span>
                    <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 text-ds-text-secondary">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Numbers */}
      <div className="mx-auto mt-12 max-w-4xl rounded-ds-md border border-ds-border-base bg-ds-surface-raised p-6 dark:bg-ds-surface-sunken">
        <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">Need More Help?</h2>
        <p className="mb-4 text-sm text-ds-text-secondary">
          Reach out to our team directly:
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <p className="text-sm text-ds-text-secondary">
            <span className="font-medium text-ds-text-primary">Olaiton:</span>{" "}
            <a href="tel:+2347088789113" className="text-ds-text-brand hover:underline">+234 708 878 9113</a>
          </p>
          <p className="text-sm text-ds-text-secondary">
            <span className="font-medium text-ds-text-primary">James:</span>{" "}
            <a href="tel:+2348089609875" className="text-ds-text-brand hover:underline">+234 808 960 9875</a>
          </p>
          <p className="text-sm text-ds-text-secondary">
            <span className="font-medium text-ds-text-primary">Niyi:</span>{" "}
            <a href="tel:+2348062291994" className="text-ds-text-brand hover:underline">+234 806 229 1994</a>
          </p>
          <p className="text-sm text-ds-text-secondary">
            <span className="font-medium text-ds-text-primary">Ose:</span>{" "}
            <a href="tel:+2348096944444" className="text-ds-text-brand hover:underline">+234 809 694 4444</a>
          </p>
        </div>
      </div>

      <div className="mt-16 rounded-ds-md bg-ds-brand-surface p-8 text-center dark:bg-ds-brand-subtle">
        <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
          Didn&apos;t find your answer?
        </h2>
        <p className="mb-6 text-ds-text-secondary">
          Our support team is ready to help you with any questions
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/contact"
            className="rounded-ds-md bg-ds-brand-primary px-6 py-3 font-semibold text-white hover:bg-ds-brand-primary-hover dark:bg-ds-brand-primary dark:hover:bg-ds-brand-primary"
          >
            Contact Support
          </Link>
          <Link
            href="/help"
            className="rounded-ds-md border-2 border-ds-border-brand px-6 py-3 font-semibold text-ds-text-brand hover:bg-ds-brand-surface dark:border-ds-border-focus dark:text-ds-brand-primary-light dark:hover:bg-ds-brand-subtle"
          >
            Visit Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
