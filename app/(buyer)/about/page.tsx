import { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about HarvestHub - Your trusted marketplace connecting buyers with quality vendors across Lagos and beyond.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-4xl font-bold text-ds-text-primary">About HarvestHub</h1>

        <div className="space-y-8">
          {/* Mission Section */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-ds-text-primary">
              Our Mission
            </h2>
            <p className="text-ds-text-secondary">
              HarvestHub is dedicated to creating a trusted e-commerce ecosystem that empowers
              vendors and delights customers. We connect quality vendors with buyers across Lagos
              and Nigeria, providing a platform that combines community trust with modern
              technology.
            </p>
          </section>

          {/* What We Do */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-ds-text-primary">
              What We Do
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-ds-md border border-ds-border-base p-6">
                <h3 className="mb-2 font-semibold text-ds-text-primary">For Buyers</h3>
                <p className="text-sm text-ds-text-secondary"> Browse quality products from verified vendors, enjoy flexible pickup and delivery options, and shop with confidence using our integrated wallet system. </p> </div> <div className="rounded-ds-md border border-ds-border-base p-6">
                <h3 className="mb-2 font-semibold text-ds-text-primary">For Vendors</h3>
                <p className="text-sm text-ds-text-secondary">
                  Establish your digital storefront, reach customers across Lagos, manage inventory,
                  track sales, and grow your business with our comprehensive vendor tools.
                </p>
              </div>
            </div>
          </section>

          {/* Our Values */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-ds-text-primary">
              Our Values
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-ds-text-brand">✓</span>
                <div>
                  <strong className="text-ds-text-primary">Trust & Integrity:</strong>
                  <span className="text-ds-text-secondary">
                    {" "}
                    We verify vendors and ensure quality standards
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-ds-text-brand">✓</span>
                <div>
                  <strong className="text-ds-text-primary">Community First:</strong>
                  <span className="text-ds-text-secondary">
                    {" "}
                    Supporting local businesses and church-affiliated vendors
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-ds-text-brand">✓</span>
                <div>
                  <strong className="text-ds-text-primary">Innovation:</strong>
                  <span className="text-ds-text-secondary">
                    {" "}
                    Leveraging technology to create seamless shopping experiences
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-ds-text-brand">✓</span>
                <div>
                  <strong className="text-ds-text-primary">Excellence:</strong>
                  <span className="text-ds-text-secondary">
                    {" "}
                    Commitment to quality in products, service, and user experience
                  </span>
                </div>
              </li>
            </ul>
          </section>

          {/* Contact Section */}
          <section className="rounded-ds-md bg-ds-brand-surface p-6">
            <h2 className="mb-4 text-2xl font-semibold text-ds-text-primary">
              Get in Touch
            </h2>
            <div className="space-y-3 text-ds-text-secondary">
              <p className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-ds-text-brand" />
                Oregun, Ikeja, Lagos, Nigeria
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-ds-text-brand" />
                <a href="tel:+2348012345678" className="hover:text-ds-text-brand">
                  +234 801 234 5678
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-ds-text-brand" />
                <a href="mailto:support@harvesthub.ng" className="hover:text-ds-text-brand">
                  support@harvesthub.ng
                </a>
              </p>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/signup"
              className="inline-block rounded-ds-md bg-ds-brand-primary px-8 py-3 font-semibold text-white hover:bg-ds-brand-primary-hover dark:bg-ds-brand-primary dark:hover:bg-ds-brand-primary"
            >
              Join HarvestHub Today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
