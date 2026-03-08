import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | MyHarvestHub",
  description: "MyHarvestHub.org Terms & Conditions of Use — binding agreement governing use of the platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold text-ds-text-primary">Terms &amp; Conditions of Use</h1>
        <p className="mb-2 text-sm text-ds-text-secondary">
          Effective Date: 3rd September 2025
        </p>
        <p className="mb-2 text-sm text-ds-text-secondary">
          Platform: MyHarvestHub.org
        </p>
        <p className="mb-8 text-sm text-ds-text-secondary">
          Jurisdiction: Lagos State, Federal Republic of Nigeria
        </p>

        <div className="prose dark:prose-invert max-w-none">
          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              1. General Provisions
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">1.1 Binding Agreement</h3>
            <p className="mb-4 text-ds-text-secondary">
              By accessing, registering, or using the MyHarvestHub.org website, mobile application, or any affiliated platform (collectively, the &quot;Platform&quot;), all users—including but not limited to Buyers, Sellers, Advertisers, Corporate Brands, Service Providers, and general visitors (collectively, &quot;Users&quot;)—agree to be legally bound by these Terms and Conditions (&quot;Terms&quot;).
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">1.2 Right to Amend</h3>
            <p className="mb-4 text-ds-text-secondary">
              The Operators of MyHarvestHub.org (&quot;Operators&quot;) expressly reserve the right, at their sole discretion, to amend, revise, modify, or replace these Terms, in whole or in part, at any time without prior notice. Continued use of the Platform after such modifications constitutes acceptance of the revised Terms.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">1.3 Definitions</h3>
            <ul className="list-disc space-y-2 pl-6 text-ds-text-secondary">
              <li><strong>&quot;Buyer&quot;</strong> means any User who purchases goods, products, or services through the Platform.</li>
              <li><strong>&quot;Seller&quot;</strong> means any User, vendor, or merchant offering goods or services for sale on the Platform.</li>
              <li><strong>&quot;User&quot;</strong> means any individual, entity, or organization accessing or using the Platform.</li>
              <li><strong>&quot;Corporate Brand&quot;</strong> means a business entity that uses the Platform for advertising or brand promotion.</li>
              <li><strong>&quot;Advertiser&quot;</strong> means any User or Corporate Brand posting promotional content on the Platform.</li>
              <li><strong>&quot;Service Provider&quot;</strong> means any third party providing auxiliary services, including payment processors, delivery companies, or IT vendors.</li>
              <li><strong>&quot;Third-Party Links&quot;</strong> means external websites, platforms, or applications accessible through the Platform.</li>
              <li><strong>&quot;Operators&quot;</strong> means the owners, directors, managers, staff, agents, contractors, and affiliates responsible for managing and maintaining the Platform.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              2. Liability &amp; Indemnification
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">2.1 Disclaimer of Liability</h3>
            <p className="mb-2 text-ds-text-secondary">
              The Platform and its Operators shall not be liable for, and expressly disclaim any responsibility in relation to:
            </p>
            <ul className="mb-4 list-[lower-alpha] space-y-1 pl-6 text-ds-text-secondary">
              <li>Transactional disputes between Buyers and Sellers.</li>
              <li>Authenticity, quality, legality, or safety of goods or services offered.</li>
              <li>Errors in pricing, promotions, or product descriptions.</li>
              <li>Product handling, delivery, shipping, or logistics.</li>
              <li>Misleading, false, or unlawful advertisements.</li>
              <li>The content, functionality, or reliability of Third-Party Links or services.</li>
            </ul>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">2.2 Indemnity by Users</h3>
            <p className="mb-2 text-ds-text-secondary">
              Each User agrees to indemnify, defend, and hold harmless the Platform and its Operators against all claims, losses, damages, liabilities, penalties, costs, or expenses (including reasonable legal fees) arising out of:
            </p>
            <ul className="list-[lower-alpha] space-y-1 pl-6 text-ds-text-secondary">
              <li>The User&apos;s use of the Platform.</li>
              <li>Breach of these Terms.</li>
              <li>Misrepresentation or fraudulent activity.</li>
              <li>Violation of applicable laws, regulations, or third-party rights.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              3. Buyers&apos; Obligations
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">3.1 Purchase Confirmation</h3>
            <p className="mb-4 text-ds-text-secondary">
              Buyers shall confirm the authenticity and suitability of all goods or services prior to making payment.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">3.2 No Refund Policy</h3>
            <p className="mb-4 text-ds-text-secondary">
              All sales are final. Refunds are strictly prohibited, except where mandated under applicable Nigerian consumer protection law.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">3.3 Due Diligence</h3>
            <p className="text-ds-text-secondary">
              Buyers bear full responsibility for reviewing product descriptions, Seller credibility, and transaction details before purchase.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              4. Sellers&apos; Obligations
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">4.1 Accuracy of Listings</h3>
            <p className="mb-4 text-ds-text-secondary">
              Sellers must ensure that all product listings, descriptions, pricing, and images are truthful, accurate, and not misleading.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">4.2 Authenticity of Goods</h3>
            <p className="mb-4 text-ds-text-secondary">
              Sellers warrant that all goods or services offered are genuine, lawful, and not counterfeit or fraudulent.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">4.3 Responsibility for Logistics</h3>
            <p className="mb-4 text-ds-text-secondary">
              Sellers are solely responsible for arranging and managing product delivery and logistics with Buyers.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">4.4 Consequences of Fraud</h3>
            <p className="mb-2 text-ds-text-secondary">
              Sellers engaging in fraud, counterfeit sales, or unlawful practices shall:
            </p>
            <ul className="list-[lower-alpha] space-y-1 pl-6 text-ds-text-secondary">
              <li>Have their accounts terminated without compensation.</li>
              <li>Have their stores permanently closed.</li>
              <li>Be reported to law enforcement authorities and prosecuted to the fullest extent of Nigerian law.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              5. Corporate Advertisers &amp; Service Providers
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">5.1 Compliance with Laws</h3>
            <p className="mb-4 text-ds-text-secondary">
              Corporate Brands and Advertisers shall ensure that all content complies with Nigerian advertising, consumer protection, and intellectual property laws.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">5.2 Disclaimer of Liability</h3>
            <p className="mb-4 text-ds-text-secondary">
              The Platform and its Operators disclaim all liability for misleading, false, or unlawful advertisements posted by Corporate Brands or Advertisers.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">5.3 Independent Service Providers</h3>
            <p className="text-ds-text-secondary">
              All Service Providers operate under independent agreements. The Platform assumes no responsibility for their acts, omissions, or services rendered.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              6. Third-Party Links
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">6.1 Access to External Sites</h3>
            <p className="mb-4 text-ds-text-secondary">
              The Platform may contain links to third-party websites or applications. Such links are provided for convenience only.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">6.2 No Endorsement</h3>
            <p className="text-ds-text-secondary">
              The Platform does not endorse, control, or assume any responsibility for the content, policies, or practices of third-party services.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              7. Pricing, Subscriptions, &amp; Free Users
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">7.1 Changes to Pricing</h3>
            <p className="mb-4 text-ds-text-secondary">
              The Platform reserves the right to alter, increase, or reduce product prices, subscription fees, or service charges at any time, without prior notice.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">7.2 Membership Tiers</h3>
            <p className="mb-4 text-ds-text-secondary">
              The Platform may introduce, modify, or discontinue free and paid membership categories at its discretion.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">7.3 Acceptance of Changes</h3>
            <p className="text-ds-text-secondary">
              Users accept and agree to all such changes as a condition of continued use of the Platform.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              8. Intellectual Property &amp; Content
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">8.1 Platform Ownership</h3>
            <p className="mb-4 text-ds-text-secondary">
              All content on the Platform, including trademarks, logos, design, software, and text, are the exclusive property of MyHarvestHub.org and may not be reproduced or used without prior written consent.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">8.2 Seller Content</h3>
            <p className="mb-4 text-ds-text-secondary">
              Sellers retain ownership of their product images and materials but grant the Platform a perpetual, royalty-free license to display, reproduce, and promote such content.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">8.3 Right to Remove Content</h3>
            <p className="text-ds-text-secondary">
              The Platform reserves the right to remove, modify, or restrict access to any user-uploaded content at its sole discretion.
            </p>
          </section>

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              9. Dispute Resolution
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">9.1 User-to-User Disputes</h3>
            <p className="mb-4 text-ds-text-secondary">
              All disputes between Buyers and Sellers must be resolved directly by the parties involved.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">9.2 Non-Involvement of Platform</h3>
            <p className="mb-4 text-ds-text-secondary">
              The Platform shall not mediate, intervene, or assume any responsibility in disputes between Users.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">9.3 Jurisdiction &amp; Governing Law</h3>
            <p className="text-ds-text-secondary">
              These Terms shall be governed by and construed under the laws of Lagos State, Federal Republic of Nigeria. Any disputes shall be submitted to the exclusive jurisdiction of the courts in Lagos State.
            </p>
          </section>

          {/* Section 10 */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              10. Termination &amp; Enforcement
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">10.1 Right to Terminate</h3>
            <p className="mb-4 text-ds-text-secondary">
              The Platform reserves the right to suspend or terminate any User account at its sole discretion, without notice, for violation of these Terms or applicable law.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">10.2 Fraudulent Activity</h3>
            <p className="text-ds-text-secondary">
              Fraudulent Users will be permanently banned, reported to relevant authorities, and subject to prosecution.
            </p>
          </section>

          {/* Section 11 */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              11. Data &amp; Privacy
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">11.1 Collection and Use of Data</h3>
            <p className="mb-4 text-ds-text-secondary">
              The Platform reserves the right to collect, store, analyze, use, and share user data for operational, commercial, marketing, religious, or promotional purposes.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">11.2 Consent to Data Usage</h3>
            <p className="text-ds-text-secondary">
              By using the Platform, Users expressly consent to the unrestricted use of their data by the Operators.
            </p>
          </section>

          {/* Section 12 */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">
              12. Final Provisions
            </h2>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">12.1 Severability</h3>
            <p className="mb-4 text-ds-text-secondary">
              If any provision of these Terms is found invalid or unenforceable, the remaining provisions shall remain in full force and effect.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">12.2 Entire Agreement</h3>
            <p className="mb-4 text-ds-text-secondary">
              These Terms constitute the entire agreement between Users and the Platform and supersede any prior agreements, whether written or oral.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">12.3 Reservation of Rights</h3>
            <p className="text-ds-text-secondary">
              The Platform reserves all rights not expressly granted herein.
            </p>
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
