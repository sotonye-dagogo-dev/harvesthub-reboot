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
        <h1 className="mb-6 text-4xl font-bold text-gray-900 dark:text-white">About HarvestHub</h1>

        <div className="space-y-8">
          {/* Mission Section */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Our Mission
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              HarvestHub is dedicated to creating a trusted e-commerce ecosystem that empowers
              vendors and delights customers. We connect quality vendors with buyers across Lagos
              and Nigeria, providing a platform that combines community trust with modern
              technology.
            </p>
          </section>

          {/* What We Do */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              What We Do
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800">
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">For Buyers</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Browse quality products from verified vendors, enjoy flexible pickup and delivery
                  options, and shop with confidence using our integrated wallet system.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800">
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">For Vendors</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Establish your digital storefront, reach customers across Lagos, manage inventory,
                  track sales, and grow your business with our comprehensive vendor tools.
                </p>
              </div>
            </div>
          </section>

          {/* Our Values */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Our Values
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-purple-600 dark:text-purple-400">✓</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Trust & Integrity:</strong>
                  <span className="text-gray-600 dark:text-gray-400">
                    {" "}
                    We verify vendors and ensure quality standards
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 dark:text-purple-400">✓</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Community First:</strong>
                  <span className="text-gray-600 dark:text-gray-400">
                    {" "}
                    Supporting local businesses and church-affiliated vendors
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 dark:text-purple-400">✓</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Innovation:</strong>
                  <span className="text-gray-600 dark:text-gray-400">
                    {" "}
                    Leveraging technology to create seamless shopping experiences
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 dark:text-purple-400">✓</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Excellence:</strong>
                  <span className="text-gray-600 dark:text-gray-400">
                    {" "}
                    Commitment to quality in products, service, and user experience
                  </span>
                </div>
              </li>
            </ul>
          </section>

          {/* Contact Section */}
          <section className="rounded-lg bg-purple-50 p-6 dark:bg-purple-950/20">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Get in Touch
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Oregun, Ikeja, Lagos, Nigeria
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <a href="tel:+2348012345678" className="hover:text-purple-600">
                  +234 801 234 5678
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <a href="mailto:support@harvesthub.ng" className="hover:text-purple-600">
                  support@harvesthub.ng
                </a>
              </p>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/signup"
              className="inline-block rounded-lg bg-purple-600 px-8 py-3 font-semibold text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              Join HarvestHub Today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
