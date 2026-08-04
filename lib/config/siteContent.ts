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
    { href: "/advertise", label: "Advertise With Us" },
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

export type AdvertisingPlacement = "TOP" | "HERO" | "SIDEBAR";

export type AdvertisingConfig = {
  metadata: {
    title: string;
    description: string;
  };
  routes: {
    landing: string;
    apply: string;
    simpleApply: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  narrativeHeading: string;
  placementsHeading: string;
  placementsSubtitle: string;
  placements: {
    position: AdvertisingPlacement;
    title: string;
    description: string;
    dimensions: string;
    ratio: string;
  }[];
  stepsHeading: string;
  steps: {
    title: string;
    description: string;
  }[];
  policiesHeading: string;
  policies: {
    title: string;
    description: string;
  }[];
  faqsHeading: string;
  faqs: {
    question: string;
    answer: string;
  }[];
  cta: {
    heading: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
  };
};

export const advertisingConfig: AdvertisingConfig = {
  metadata: {
    title: "Advertise & Sponsor With MyHarvestHub",
    description:
      "Reach a trusted faith-based marketplace across Lagos. Promote your brand, product, event, or announcement with sponsored banners on MyHarvestHub.",
  },
  routes: {
    landing: "/advertise",
    apply: "/advertise/apply",
    simpleApply: "/ad-application",
  },
  hero: {
    eyebrow: "MyHarvestHub Sponsors & Ads",
    title: "Put your brand in front of a trusted community",
    subtitle:
      "Sponsor curated banner placements on MyHarvestHub and connect with buyers and vendors who share your values. Flexible top, hero, and sidebar placements with transparent, admin-managed pricing.",
  },
  narrativeHeading: "Why advertise on MyHarvestHub",
  placementsHeading: "Choose your placement",
  placementsSubtitle:
    "Select from three sponsored banner positions. Final inventory availability is confirmed by our operations team after review.",
  placements: [
    {
      position: "TOP",
      title: "Top Strip",
      description:
        "A slim, full-width banner at the top of every page. Ideal for broad top-of-funnel awareness and brand announcements.",
      dimensions: "Approx. 1024 x 160px",
      ratio: "6.4:1 landscape",
    },
    {
      position: "HERO",
      title: "Hero Spotlight",
      description:
        "A prominent featured banner in the homepage hero carousel. Great for high-impact campaigns, events, and product launches.",
      dimensions: "Approx. 1024 x 410px",
      ratio: "2.5:1 landscape",
    },
    {
      position: "SIDEBAR",
      title: "Sidebar",
      description:
        "Compact square tiles in the homepage sidebar rail. Perfect for targeted offers, community notices, and QR-driven calls to action.",
      dimensions: "Approx. 1:1 square",
      ratio: "1:1 square",
    },
  ],
  stepsHeading: "How it works",
  steps: [
    {
      title: "1. Apply",
      description:
        "Submit an application with your campaign details, preferred placement, schedule, and payment method. No account signup is required.",
    },
    {
      title: "2. Pay securely",
      description:
        "Pay via card, USSD, or bank transfer. Card and USSD payments are processed securely through Paystack; bank transfers require a proof-of-payment upload.",
    },
    {
      title: "3. Review & approval",
      description:
        "Our operations team reviews your creative and confirms pricing and available inventory before your banner is scheduled.",
    },
    {
      title: "4. Live on the platform",
      description:
        "Once approved, your sponsored banner runs at the scheduled time and placement, reaching the MyHarvestHub community.",
    },
  ],
  policiesHeading: "Policies & requirements",
  policies: [
    {
      title: "Appropriate content",
      description:
        "All creative must comply with platform standards. Ads promoting prohibited, misleading, or unsafe goods or services may be rejected.",
    },
    {
      title: "Approval is discretionary",
      description:
        "Every application is reviewed on a case-by-case basis. Submission of payment does not guarantee placement; rejected campaigns are handled per our refund policy.",
    },
    {
      title: "Image requirements",
      description:
        "Follow the recommended dimensions and aspect ratio for your chosen placement to avoid cropping. Upload a clear, high-resolution creative.",
    },
    {
      title: "Scheduling & inventory",
      description:
        "Final placement depends on approved inventory and your preferred schedule. Our team confirms the exact run window after review.",
    },
  ],
  faqsHeading: "Frequently asked questions",
  faqs: [
    {
      question: "Do I need an account to advertise?",
      answer:
        "No. Both application routes are open to the public and do not require you to sign in before submitting.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "You can pay by card, USSD, or bank transfer. Card and USSD are processed securely via Paystack; if you choose bank transfer, upload a clear proof of payment.",
    },
    {
      question: "What happens after I submit?",
      answer:
        "Our operations team reviews your application and creative. Once approved, we schedule your banner for the confirmed placement and run window.",
    },
    {
      question: "How is pricing calculated?",
      answer:
        "Pricing is based on the admin-managed advertising rates and your selected duration type and value. You can see an estimated amount while completing the application.",
    },
    {
      question: "What if my application is rejected?",
      answer:
        "Rejected campaigns are handled per our refund policy. Our team will get in touch to confirm next steps and timing.",
    },
  ],
  cta: {
    heading: "Ready to reach your community?",
    description:
      "Apply today and our team will guide you through placement, pricing, and scheduling.",
    primaryLabel: "Apply to Advertise",
    secondaryLabel: "Contact us",
  },
};
