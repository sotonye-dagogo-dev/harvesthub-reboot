import { Metadata } from "next";
import Link from "next/link";
import { Search, Package, CreditCard, MapPin, Shield, HeadphonesIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Help Center | HarvestHub",
  description: "Find answers to common questions and get help with your HarvestHub experience.",
};

export default function HelpCenterPage() {
  const helpTopics = [
    {
      icon: Package,
      title: "Orders & Delivery",
      description: "Track orders, delivery options, and pickup instructions",
      link: "/help/orders",
    },
    {
      icon: CreditCard,
      title: "Payments & Wallet",
      description: "Payment methods, wallet deposits, and refunds",
      link: "/help/payments",
    },
    {
      icon: MapPin,
      title: "Locations & Pickup",
      description: "Church pickup locations and delivery zones",
      link: "/help/locations",
    },
    {
      icon: Shield,
      title: "Account & Security",
      description: "Account settings, password reset, and privacy",
      link: "/help/account",
    },
    {
      icon: Search,
      title: "Products & Vendors",
      description: "Finding products, vendor verification, and reviews",
      link: "/help/products",
    },
    {
      icon: HeadphonesIcon,
      title: "Contact Support",
      description: "Get in touch with our support team",
      link: "/contact",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Help Center</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Find answers to your questions and get support for your HarvestHub experience
        </p>
      </div>

      {/* Search Bar */}
      <div className="mx-auto mb-12 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Help Topics Grid */}
      <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {helpTopics.map((topic) => {
          const Icon = topic.icon;
          return (
            <Link
              key={topic.title}
              href={topic.link}
              className="group rounded-lg border border-gray-200 p-6 transition-all hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:hover:border-purple-700"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 transition-colors group-hover:bg-purple-200 dark:bg-purple-900 dark:group-hover:bg-purple-800">
                <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                {topic.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{topic.description}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="rounded-lg bg-purple-50 p-8 dark:bg-purple-900/20">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Quick Links</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/faqs"
            className="flex items-center gap-3 text-purple-600 hover:underline dark:text-purple-400"
          >
            → Frequently Asked Questions
          </Link>
          <Link
            href="/terms"
            className="flex items-center gap-3 text-purple-600 hover:underline dark:text-purple-400"
          >
            → Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="flex items-center gap-3 text-purple-600 hover:underline dark:text-purple-400"
          >
            → Privacy Policy
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-3 text-purple-600 hover:underline dark:text-purple-400"
          >
            → Contact Support
          </Link>
        </div>
      </div>

      {/* Still Need Help */}
      <div className="mt-12 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Still Need Help?</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Our support team is here to assist you
        </p>
        <Link
          href="/contact"
          className="inline-block rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
