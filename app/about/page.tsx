import { Metadata } from "next";
import Link from "next/link";
import { getPublicContentBySlug } from "@/lib/data/publicContent";
import {
  Mail,
  MapPin,
  Phone,
  Heart,
  ShieldCheck,
  Users,
  Sparkles,
  HandCoins,
  Gift,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "MyHarvestHub.org is a revolutionary faith-based e-marketplace connecting members of Christian worship centers with vendors within their communities.",
};

export default async function AboutPage() {
  const publicContent = await getPublicContentBySlug("about");

  if (publicContent && publicContent.status === "PUBLISHED") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-4 text-4xl font-bold text-ds-text-primary">{publicContent.title}</h1>
          <div
            className="prose max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: publicContent.body }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-4xl font-bold text-ds-text-primary">About MyHarvestHub</h1>

        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-lg leading-relaxed text-ds-text-secondary">
              MyHarvestHub.org is a revolutionary faith-based e-marketplace designed to connect
              members of Christian worship centers with vendors within their communities. This
              platform seeks to create a unique environment where shared faith fosters trust,
              collaboration, and affordable commerce.
            </p>
          </section>

          {/* Mission */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-ds-text-primary">Our Mission</h2>
            <p className="text-ds-text-secondary">
              By reducing vendor commissions, leveraging corporate advertising, and offering
              innovative incentives like coupon vouchers, MyHarvestHub.org aims to empower Christian
              vendors, increase buyer engagement, and build stronger faith-based communities.
            </p>
          </section>

          {/* Key Pillars */}
          <section>
            <h2 className="mb-6 text-2xl font-semibold text-ds-text-primary">What We Stand For</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-ds-md border border-ds-border-base p-5">
                <Heart className="mb-3 h-8 w-8 text-ds-text-brand" />
                <h3 className="mb-1 font-semibold text-ds-text-primary">Faith-Driven Trust</h3>
                <p className="text-sm text-ds-text-secondary">
                  A marketplace rooted in shared Christian values where trust is the foundation of
                  every transaction.
                </p>
              </div>
              <div className="rounded-ds-md border border-ds-border-base p-5">
                <HandCoins className="mb-3 h-8 w-8 text-ds-text-brand" />
                <h3 className="mb-1 font-semibold text-ds-text-primary">Low Commissions</h3>
                <p className="text-sm text-ds-text-secondary">
                  Reduced vendor commissions so sellers keep more of what they earn, making commerce
                  affordable for all.
                </p>
              </div>
              <div className="rounded-ds-md border border-ds-border-base p-5">
                <Users className="mb-3 h-8 w-8 text-ds-text-brand" />
                <h3 className="mb-1 font-semibold text-ds-text-primary">Community Commerce</h3>
                <p className="text-sm text-ds-text-secondary">
                  Connecting church members with vendors in their communities to build stronger,
                  self-sustaining ecosystems.
                </p>
              </div>
              <div className="rounded-ds-md border border-ds-border-base p-5">
                <Gift className="mb-3 h-8 w-8 text-ds-text-brand" />
                <h3 className="mb-1 font-semibold text-ds-text-primary">Innovative Incentives</h3>
                <p className="text-sm text-ds-text-secondary">
                  Coupon vouchers and rewards that increase buyer engagement and bring value to
                  every purchase.
                </p>
              </div>
              <div className="rounded-ds-md border border-ds-border-base p-5">
                <Sparkles className="mb-3 h-8 w-8 text-ds-text-brand" />
                <h3 className="mb-1 font-semibold text-ds-text-primary">Corporate Advertising</h3>
                <p className="text-sm text-ds-text-secondary">
                  Leveraging corporate ad partnerships to keep costs low for vendors while
                  sustaining the platform.
                </p>
              </div>
              <div className="rounded-ds-md border border-ds-border-base p-5">
                <ShieldCheck className="mb-3 h-8 w-8 text-ds-text-brand" />
                <h3 className="mb-1 font-semibold text-ds-text-primary">Vendor Empowerment</h3>
                <p className="text-sm text-ds-text-secondary">
                  Tools and support that empower Christian vendors to grow their businesses and
                  reach more customers.
                </p>
              </div>
            </div>
          </section>

          {/* For Buyers & Vendors */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-ds-text-primary">Who We Serve</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-ds-md border border-ds-border-base p-6">
                <h3 className="mb-2 font-semibold text-ds-text-primary">For Buyers</h3>
                <p className="text-sm text-ds-text-secondary">
                  Browse quality products from trusted vendors in your church community. Enjoy
                  flexible pickup at church services, home delivery, coupon vouchers, and the
                  confidence of buying from people who share your faith.
                </p>
              </div>
              <div className="rounded-ds-md border border-ds-border-base p-6">
                <h3 className="mb-2 font-semibold text-ds-text-primary">For Vendors</h3>
                <p className="text-sm text-ds-text-secondary">
                  Set up your digital storefront with low commissions, reach buyers across church
                  campuses, and grow your business with the support of a community that trusts and
                  values your work.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="rounded-ds-md bg-ds-brand-surface p-6">
            <h2 className="mb-4 text-2xl font-semibold text-ds-text-primary">Get in Touch</h2>
            <div className="space-y-3 text-ds-text-secondary">
              <p className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-ds-text-brand" />
                Lekki, Lagos, Nigeria
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-ds-text-brand" />
                <a href="tel:+2347012037766" className="hover:text-ds-text-brand">
                  +234 701 203 7766
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-ds-text-brand" />
                <a href="mailto:support@myharvesthub.org" className="hover:text-ds-text-brand">
                  support@myharvesthub.org
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
              Join MyHarvestHub Today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
