export type LinkItem = {
  href: string;
  label: string;
};

export type HelpTopic = {
  slug: string;
  title: string;
  description: string;
  icon: "package" | "credit-card" | "map-pin" | "shield" | "search" | "headphones";
};

export const footerConfig = {
  about:
    "Your trusted marketplace connecting buyers with quality vendors across Lagos and beyond.",
  contact: {
    address: "Lekki, Lagos, Nigeria",
    phone: "+234 701 203 7766",
    email: "support@myharvesthub.org",
  },
  quickLinks: [
    { href: "/products", label: "Browse Products" },
    { href: "/vendors", label: "Find Vendors" },
    { href: "/signup", label: "Become a Vendor" },
    { href: "/about", label: "About Us" },
    { href: "/ad-application", label: "Apply to Advertise" },
  ] as LinkItem[],
  supportLinks: [
    { href: "/help", label: "Help Center" },
    { href: "/faqs", label: "FAQs" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/bug-report", label: "Report a Bug" },
  ] as LinkItem[],
  legalLinks: [
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
    { href: "/cookies", label: "Cookies" },
  ] as LinkItem[],
};

export const helpCenterConfig = {
  title: "Help Center",
  description: "Find answers to your questions and get support for your MyHarvestHub experience",
  topics: [
    {
      slug: "orders",
      title: "Orders & Delivery",
      description: "Track orders, delivery options, and pickup instructions",
      icon: "package",
    },
    {
      slug: "payments",
      title: "Payments & Wallet",
      description: "Payment methods, wallet deposits, and refunds",
      icon: "credit-card",
    },
    {
      slug: "locations",
      title: "Locations & Pickup",
      description: "Church pickup locations and delivery zones",
      icon: "map-pin",
    },
    {
      slug: "account",
      title: "Account & Security",
      description: "Account settings, password reset, and privacy",
      icon: "shield",
    },
    {
      slug: "products",
      title: "Products & Vendors",
      description: "Finding products, vendor verification, and reviews",
      icon: "search",
    },
    {
      slug: "contact",
      title: "Contact Support",
      description: "Get in touch with our support team",
      icon: "headphones",
    },
  ] as HelpTopic[],
  quickLinks: [
    { href: "/faqs", label: "Frequently Asked Questions" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/contact", label: "Contact Support" },
  ] as LinkItem[],
};
