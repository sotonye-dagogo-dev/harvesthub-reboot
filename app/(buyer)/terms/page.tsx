import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | HarvestHub",
  description: "HarvestHub Terms of Service - Guidelines for using our platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold text-ds-text-primary">Terms of Service</h1>
        <p className="mb-8 text-sm text-ds-text-secondary">
          Last updated: February 1, 2026
        </p>

        <div className="prose dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              1. Acceptance of Terms
            </h2>
            <p className="text-ds-text-secondary">
              By accessing and using HarvestHub, you accept and agree to be bound by these Terms of
              Service. If you do not agree, please do not use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              2. User Accounts
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">
              Account Registration
            </h3>
            <ul className="list-disc space-y-2 pl-6 text-ds-text-secondary">
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must be at least 13 years old to create an account</li>
              <li>One person may only create one account</li>
            </ul>

            <h3 className="mb-2 mt-4 text-xl font-semibold text-ds-text-primary">
              Account Termination
            </h3>
            <p className="text-ds-text-secondary">
              We reserve the right to suspend or terminate accounts that violate these terms or
              engage in fraudulent activity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              3. Buyer Responsibilities
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-ds-text-secondary">
              <li>Provide accurate delivery information</li>
              <li>Make payment for confirmed orders</li>
              <li>Inspect products upon delivery</li>
              <li>Leave honest reviews</li>
              <li>Report issues within 24 hours of delivery</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              4. Vendor Responsibilities
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-ds-text-secondary">
              <li>Provide accurate product descriptions and images</li>
              <li>Honor listed prices and availability</li>
              <li>Fulfill orders promptly</li>
              <li>Maintain product quality standards</li>
              <li>Respond to customer inquiries</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              5. Orders and Payments
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">
              Order Process
            </h3>
            <ul className="list-disc space-y-2 pl-6 text-ds-text-secondary">
              <li>Orders are confirmed upon payment</li>
              <li>Prices are in Nigerian Naira (NGN)</li>
              <li>Product availability is subject to change</li>
              <li>We reserve the right to cancel fraudulent orders</li>
            </ul>

            <h3 className="mb-2 mt-4 text-xl font-semibold text-ds-text-primary">
              Payment Methods
            </h3>
            <ul className="list-disc space-y-2 pl-6 text-ds-text-secondary">
              <li>Wallet balance</li>
              <li>Debit/Credit cards</li>
              <li>Bank transfer</li>
              <li>USSD</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              6. Delivery and Pickup
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">Delivery</h3>
            <p className="mb-4 text-ds-text-secondary">
              Delivery fees vary by location. Estimated delivery times are provided but not
              guaranteed.
            </p>

            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">
              Church Pickup
            </h3>
            <p className="text-ds-text-secondary">
              Products can be picked up at designated church services. Uncollected items may be
              returned to vendors after 7 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              7. Returns and Refunds
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-ds-text-secondary">
              <li>Buyers may cancel orders before processing</li>
              <li>Returns accepted for defective or misrepresented products</li>
              <li>Refunds processed to wallet within 5-7 business days</li>
              <li>Return shipping costs may apply</li>
              <li>Perishable items are non-returnable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              8. Wallet System
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-ds-text-secondary">
              <li>Minimum deposit: ₦100</li>
              <li>Withdrawal requests processed within 3-5 business days</li>
              <li>Transaction fees may apply</li>
              <li>Unused wallet balance does not expire</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              9. Prohibited Activities
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-ds-text-secondary">
              <li>Selling counterfeit or illegal products</li>
              <li>Fraudulent transactions or payment chargebacks</li>
              <li>Harassment or abusive behavior</li>
              <li>Spamming or unauthorized marketing</li>
              <li>Manipulating reviews or ratings</li>
              <li>Sharing account credentials</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              10. Intellectual Property
            </h2>
            <p className="text-ds-text-secondary">
              All content on HarvestHub, including logos, designs, and text, is protected by
              copyright and trademark laws. Users retain rights to their content but grant us a
              license to use it on the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              11. Limitation of Liability
            </h2>
            <p className="text-ds-text-secondary">
              HarvestHub acts as a marketplace platform connecting buyers and vendors. We are not
              responsible for product quality, vendor actions, or delivery issues beyond our direct
              control. Our liability is limited to the amount paid for the affected transaction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              12. Dispute Resolution
            </h2>
            <p className="text-ds-text-secondary">
              For disputes, contact our support team. We will mediate fairly between buyers and
              vendors. If resolution cannot be reached, disputes will be governed by Nigerian law
              and handled in Lagos courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              13. Changes to Terms
            </h2>
            <p className="text-ds-text-secondary">
              We may update these terms at any time. Significant changes will be communicated via
              email or platform notification. Continued use after changes indicates acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              14. Contact Information
            </h2>
            <ul className="space-y-1 text-ds-text-secondary">
              <li>Email: support@harvesthub.ng</li>
              <li>Phone: +234 801 234 5678</li>
              <li>Address: Harvesters International Christian Centre, Oregun, Lagos, Nigeria</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 border-t border-ds-border-base pt-8">
          <p className="text-center text-ds-text-secondary">
            <Link href="/privacy" className="text-ds-text-brand hover:underline">
              Read our Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
