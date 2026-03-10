import { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

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

        {/* Contact Form */}
        <div className="rounded-ds-md bg-ds-surface-base p-8 shadow-ds-sm dark:bg-ds-surface-base">
          <h2 className="mb-6 text-2xl font-bold text-ds-text-primary">Send a Message</h2>
          <form className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-ds-text-secondary"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full rounded-ds-md border border-ds-border-base px-4 py-2 focus:border-ds-border-focus focus:ring-2 focus:ring-ds-focus-ring/30 dark:text-ds-text-primary"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-ds-text-secondary"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full rounded-ds-md border border-ds-border-base px-4 py-2 focus:border-ds-border-focus focus:ring-2 focus:ring-ds-focus-ring/30 dark:text-ds-text-primary"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="subject"
                className="mb-1 block text-sm font-medium text-ds-text-secondary"
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                className="w-full rounded-ds-md border border-ds-border-base px-4 py-2 focus:border-ds-border-focus focus:ring-2 focus:ring-ds-focus-ring/30 dark:text-ds-text-primary"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-1 block text-sm font-medium text-ds-text-secondary"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full rounded-ds-md border border-ds-border-base px-4 py-2 focus:border-ds-border-focus focus:ring-2 focus:ring-ds-focus-ring/30 dark:text-ds-text-primary"
                placeholder="Tell us more about your inquiry..."
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-ds-md bg-ds-brand-primary px-6 py-3 font-semibold text-white hover:bg-ds-brand-primary-hover dark:bg-ds-brand-primary dark:hover:bg-ds-brand-primary"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
