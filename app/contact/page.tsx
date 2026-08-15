import { Metadata } from "next";
import { Mail, Phone, MapPin, Clock, Bug } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us | MyHarvestHub",
  description: "Get in touch with MyHarvestHub. We're here to help with any questions or concerns.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-ds-text-primary">Contact Us</h1>
        <p className="mx-auto max-w-2xl text-lg text-ds-text-secondary">
          Have questions? We&apos;re here to help! Reach out to us through any of the channels
          below.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contact Information */}
        <div>
          <h2 className="mb-6 text-2xl font-bold text-ds-text-primary">Get in Touch</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-md bg-ds-brand-subtle">
                <Mail className="h-6 w-6 text-ds-text-brand" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-ds-text-primary">Email</h3>
                <a
                  href="mailto:support@myharvesthub.org"
                  className="text-ds-text-brand hover:underline"
                >
                  support@myharvesthub.org
                </a>
                <p className="mt-1 text-sm text-ds-text-secondary">
                  For general inquiries and support
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-md bg-ds-brand-subtle">
                <Phone className="h-6 w-6 text-ds-text-brand" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-ds-text-primary">Phone</h3>
                <a href="tel:+2347012037766" className="text-ds-text-brand hover:underline">
                  +234 701 203 7766
                </a>
                <p className="mt-1 text-sm text-ds-text-secondary">
                  Monday - Friday, 9am - 5pm WAT
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-md bg-ds-brand-subtle">
                <MapPin className="h-6 w-6 text-ds-text-brand" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-ds-text-primary">Address</h3>
                <p className="text-ds-text-secondary">Lekki, Lagos, Nigeria</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-md bg-ds-brand-subtle">
                <Clock className="h-6 w-6 text-ds-text-brand" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-ds-text-primary">Business Hours</h3>
                <p className="text-ds-text-secondary">
                  Monday - Friday: 9:00 AM - 6:00 PM
                  <br />
                  Saturday: 10:00 AM - 4:00 PM
                  <br />
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>

          {/* Campus Locations */}
          <div className="mt-8 rounded-ds-md bg-ds-brand-surface p-6 dark:bg-ds-brand-subtle">
            <h3 className="mb-4 font-semibold text-ds-text-primary">Our Locations</h3>
            <div className="space-y-2 text-sm text-ds-text-secondary">
              <p>📍 Lekki (Headquarters)</p>
              <p>📍 Lekki</p>
              <p>📍 Victoria Island</p>
              <p>📍 Ikeja</p>
              <p>📍 Festac</p>
              <p>📍 Ajah</p>
            </div>
          </div>
        </div>

        {/* Report a problem / bug */}
        <div className="rounded-ds-md bg-ds-surface-base p-8 shadow-ds-sm dark:bg-ds-surface-base">
          <div className="flex h-12 w-12 items-center justify-center rounded-ds-md bg-ds-brand-subtle">
            <Bug className="h-6 w-6 text-ds-text-brand" />
          </div>
          <h2 className="mb-3 mt-4 text-2xl font-bold text-ds-text-primary">Report a Problem</h2>
          <p className="mb-6 text-ds-text-secondary">
            Spotted a bug or something not working as expected? Let us know through the bug report
            form — you can attach screenshots and we&apos;ll get back to you.
          </p>
          <Link
            href="/bug-report"
            className="inline-flex items-center rounded-ds-md bg-ds-brand-primary px-6 py-3 font-semibold text-white hover:bg-ds-brand-primary-hover dark:bg-ds-brand-primary dark:hover:bg-ds-brand-primary"
          >
            Report a Bug
          </Link>
          <p className="mt-6 text-sm text-ds-text-secondary">
            For account or order issues, email{" "}
            <a href="mailto:support@myharvesthub.org" className="text-ds-text-brand hover:underline">
              support@myharvesthub.org
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
