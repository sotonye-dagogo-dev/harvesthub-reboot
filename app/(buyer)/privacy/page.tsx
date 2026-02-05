import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | HarvestHub",
  description: "HarvestHub Privacy Policy - Learn how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
          Last updated: February 1, 2026
        </p>

        <div className="prose dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              1. Introduction
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              HarvestHub (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our e-commerce marketplace platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              2. Information We Collect
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Personal Information
            </h3>
            <ul className="list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>Name, email address, and phone number</li>
              <li>Delivery addresses and location information</li>
              <li>Payment information (processed securely through payment providers)</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3 className="mb-2 mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Usage Information
            </h3>
            <ul className="list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>Browsing history and product views</li>
              <li>Search queries and filters</li>
              <li>Device information and IP address</li>
              <li>Transaction history and order details</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>Process and fulfill your orders</li>
              <li>Communicate about your orders and account</li>
              <li>Provide customer support</li>
              <li>Improve our services and user experience</li>
              <li>Send promotional offers (with your consent)</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              4. Information Sharing
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              We may share your information with:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>
                <strong>Vendors:</strong> To fulfill orders (name, delivery address, phone number)
              </li>
              <li>
                <strong>Payment Providers:</strong> To process transactions securely
              </li>
              <li>
                <strong>Service Providers:</strong> For hosting, analytics, and customer support
              </li>
              <li>
                <strong>Legal Authorities:</strong> When required by law or to protect our rights
              </li>
            </ul>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              We do NOT sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              5. Data Security
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Secure password hashing</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure payment processing through trusted providers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              6. Your Rights
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">You have the right to:</p>
            <ul className="list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
              <li>Withdraw consent for data processing</li>
            </ul>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              To exercise these rights, contact us at privacy@harvesthub.ng
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              7. Cookies and Tracking
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We use cookies and similar technologies to enhance your experience, analyze usage, and
              provide personalized content. You can manage cookie preferences in your browser
              settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              8. Data Retention
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We retain your data for as long as necessary to provide services, comply with legal
              obligations, resolve disputes, and enforce our agreements. Inactive accounts may be
              deleted after 2 years.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Our platform is not intended for children under 13. We do not knowingly collect data
              from children. If you believe a child has provided us with personal information,
              please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We may update this Privacy Policy periodically. We will notify you of significant
              changes via email or platform notification. Continued use after changes constitutes
              acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              11. Contact Us
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              For questions about this Privacy Policy, contact us:
            </p>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>Email: privacy@harvesthub.ng</li>
              <li>Phone: +234 801 234 5678</li>
              <li>Address: Harvesters International Christian Centre, Oregun, Lagos, Nigeria</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <p className="text-center text-gray-600 dark:text-gray-400">
            By using HarvestHub, you agree to this Privacy Policy.{" "}
            <Link href="/terms" className="text-purple-600 hover:underline dark:text-purple-400">
              Read our Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
