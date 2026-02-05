import { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | HarvestHub",
  description: "Get in touch with HarvestHub. We're here to help with any questions or concerns.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Contact Us</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Have questions? We&apos;re here to help! Reach out to us through any of the channels below.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contact Information */}
        <div>
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Get in Touch</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">Email</h3>
                <a
                  href="mailto:support@harvesthub.ng"
                  className="text-purple-600 hover:underline dark:text-purple-400"
                >
                  support@harvesthub.ng
                </a>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  For general inquiries and support
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">Phone</h3>
                <a
                  href="tel:+2348012345678"
                  className="text-purple-600 hover:underline dark:text-purple-400"
                >
                  +234 801 234 5678
                </a>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Monday - Friday, 9am - 5pm WAT
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">Address</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Harvesters International Christian Centre
                  <br />
                  Oregun, Ikeja
                  <br />
                  Lagos, Nigeria
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">Business Hours</h3>
                <p className="text-gray-600 dark:text-gray-400">
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
          <div className="mt-8 rounded-lg bg-purple-50 p-6 dark:bg-purple-900/20">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Our Locations</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>📍 Oregun (Headquarters)</p>
              <p>📍 Lekki</p>
              <p>📍 Victoria Island</p>
              <p>📍 Ikeja</p>
              <p>📍 Festac</p>
              <p>📍 Ajah</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-gray-900">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Send a Message</h2>
          <form className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="subject"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Tell us more about your inquiry..."
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
