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
  socialLinks: [
    { href: "https://www.instagram.com/myharvesthub?igsh=eTllY20wMjA0NHhj&utm_source=qr", label: "Instagram", icon: "instagram" as const },
    { href: "https://x.com/myharvesthub?s=21&t=KwO4wedcwGSnEO5ouE1o-w", label: "X (Twitter)", icon: "x" as const },
    { href: "https://www.tiktok.com/@myharvesthub?_r=1&_t=ZS-94Y4nZ0omjV", label: "TikTok", icon: "tiktok" as const },
  ],
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
    { href: "/blog", label: "Blog" },
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

/**
 * Hardcoded config-fallbacks for help-center sub-pages.
 * Used when no admin-published PublicContent (slug `help-{slug}`) exists.
 * Each entry provides concise, buyer + vendor directives, tips, and guides.
 */
export type HelpArticleFallback = {
  title: string;
  body: string;
};

export const helpArticleFallbacks: Record<string, HelpArticleFallback> = {
  orders: {
    title: "Orders & Delivery — Complete Guide",
    body: [
      "OVERVIEW",
      "MyHarvestHub organizes orders by vendor — one checkout can create separate orders per vendor, each with its own order number and tracking timeline. You can choose pickup at church services or home delivery.",
      "",
      "HOW TO ORDER (BUYERS)",
      "1) Browse products or vendor stores → Add to cart. If a product offers choices like size or color, pick them before adding. You can add the same product in different sizes as separate lines (e.g., Medium ×1, Large ×1) and adjust quantities in the cart.",
      "2) At checkout, confirm your delivery address and campus/pickup time, choose a delivery method and payment method. If you pay by bank transfer, you must upload a clear receipt before placing the order — the vendor will verify it and update the order.",
      "3) Apply a voucher code if you have one (may require a minimum order or expiry date). Review totals and place your order.",
      "4) Track progress in My Orders — open any order to see its timeline, delivery details, payment status and proof status. You'll receive email updates as the order moves forward.",
      "5) Need to reach the vendor? Use the WhatsApp button on the product or order — if you're not logged in, you'll be guided through sign-in and returned to continue.",
      "",
      "ORDER LIFECYCLE",
      "Pending → Confirmed (vendor accepted) → Processing → Ready for pickup or Out for delivery → Delivered. Orders can also be cancelled or refunded when appropriate; each change is recorded with a time and note you can see.",
      "",
      "FOR VENDORS — MANAGING ORDERS",
      "• Open your operations orders page and filter by status or date.",
      "• Confirm incoming orders after checking payment receipts — open the receipt image and mark Verify or Reject to continue.",
      "• Keep customers informed: update status to Confirmed, Ready for Pickup, Out for Delivery, or Delivered, and add a short note each time.",
      "",
      "TIPS",
      "• For pickup, choose the service that matches your campus (e.g., first or second Sunday service). Vendors list which services they support.",
      "• If an order stays pending after a wallet or card payment, check your wallet activity and order email confirmation before retrying.",
      "• Need help? Contact us via WhatsApp, submit a bug report, or see the Payments help page.",
      "",
      "TRY IT — SANDBOX",
      "• Preview: Add a T-shirt in size M and another in size L to your cart → go to Cart and adjust quantities per line → proceed to Checkout to see delivery options.",
      "• Vendor preview: Mark a test order as Confirmed, then Ready for Pickup — watch the buyer's timeline update.",
    ].join("\n"),
  },
  payments: {
    title: "Payments & Wallet — Methods, Receipts & Help",
    body: [
      "OVERVIEW",
      "You can pay with your wallet, card, or bank transfer with receipt upload. Wallet and card are processed online; bank transfer requires you to transfer externally and upload a receipt that the vendor confirms.",
      "",
      "BUYER GUIDE",
      "Wallet: top up in Wallet → Deposit using the secure payment popup (card or bank). Your balance updates once confirmed and a deposit record is saved.",
      "Card at checkout: pay through the same secure popup — keep it open until verification completes. If it stalls, check Wallet and My Orders before retrying.",
      "Bank transfer at checkout: transfer to the vendor account shown, then upload a clear receipt image (JPG, PNG, WebP or PDF, up to 5MB). The order moves forward only after the vendor verifies the receipt. Upload is required when this method is chosen.",
      "Refunds and withdrawals: refunds follow our refund window; wallet withdrawals settle after a short hold and you'll receive a notification and email.",
      "",
      "FOR VENDORS",
      "• Verify receipts in your orders page: open the receipt, check amount and reference, then mark Verify or Reject with a note.",
      "• Keep your bank details and store profile up to date so buyers know where to transfer.",
      "• Track earnings and fees in your dashboard overview.",
      "",
      "TROUBLESHOOTING",
      "• 'Receipt required' at checkout — attach your payment receipt and retry.",
      "• Amount does not match — the amount verified must match the order total before the order can be fulfilled.",
      "• No confirmation message after paying? Revisit My Orders and Wallet to confirm status.",
      "• Your order confirmation email lists the order number, vendor, totals, payment status and line items with size, quantity and price.",
      "",
      "TRY IT — SANDBOX",
      "• Buyer sandbox: Go to Wallet → Deposit → simulate a top-up → check balance and history. Then place a test order with Bank Transfer and upload a sample receipt.",
      "• Vendor sandbox: Open a pending proof order → view receipt → Verify → see order status advance.",
    ].join("\n"),
  },
  locations: {
    title: "Locations & Pickup — Campuses & How to Choose",
    body: [
      "OVERVIEW",
      "MyHarvestHub is campus-aware — your campus selected at signup, your saved addresses, and each order's delivery details all carry campus so fulfillment stays local. We serve Lekki, Ikeja, Gbagada, Yaba, Ilupeju, Abeokuta, Ibadan, Port Harcourt, Abuja, Ghana, London, Manchester, Houston, Toronto, Online and more.",
      "",
      "FOR BUYERS",
      "1) Choose a primary campus during signup. You can save multiple addresses later, each linked to a campus.",
      "2) At checkout, pick a delivery method:",
      "   • Pickup: select campus and pickup time (e.g., first or second Sunday service, midweek, or special event). Vendors show only the times they support.",
      "   • Delivery: choose delivery if the vendor offers it — a per-vendor fee applies.",
      "3) Your pickup or delivery details are saved on the order and in the confirmation email. Bring your order number when collecting.",
      "4) Moved campus? Update it in your profile — future orders will use the new campus; existing orders keep their original details.",
      "",
      "FOR VENDORS",
      "• In Store Settings, set whether you offer pickup, delivery, which services you support and your delivery zones. Changes apply to new checkouts immediately.",
      "• Keep business hours and pickup windows clear in your store description.",
      "• Enable delivery or a WhatsApp contact option if you serve multiple campuses.",
      "",
      "TIPS & FAQS",
      "• 'No pickup time available' means that vendor doesn't support the selected time — try another time or choose delivery.",
      "• Online campus is for orders without physical pickup — it works like any other campus for routing.",
      "",
      "TRY IT — SANDBOX",
      "• Add an address tagged to a different campus in Profile → Addresses → then check out to see the campus reflected at checkout.",
      "• Vendor: toggle pickup services in Store Settings and preview how checkout options change.",
    ].join("\n"),
  },
  account: {
    title: "Account & Security — Email, Password & Profile",
    body: [
      "OVERVIEW",
      "Accounts have roles: buyer, vendor, admin. Vendors complete business verification; all users verify email before accessing protected areas.",
      "",
      "SIGNUP & EMAIL VERIFICATION",
      "1) Complete signup in steps: choose role → personal details → (vendors) store details and verification documents → account security.",
      "2) After submitting, you'll receive a verification email with a link valid for 24 hours. Keep the signup confirmation visible until you see 'check your inbox'. If you don't receive it, use the resend form on the verification page.",
      "3) Open the link from the same browser when possible. The verification page will confirm automatically and guide you to sign in. If the link expired, enter the exact signup email on the verification page to request a new one.",
      "4) Sign in after verification. If you try before verifying, you'll be prompted to verify first.",
      "",
      "PASSWORD & SESSION",
      "• Forgot password: use Forgot Password to receive a reset link. If no account exists for that email, you'll see a clear message.",
      "• Change password: in Profile → Security, providing your current password.",
      "• Change email: in Profile → Security, enter a new email — we'll send a verification link to the new address. Once confirmed, you'll be asked to sign in again.",
      "• Stay secure: sign out when done on shared devices.",
      "",
      "PROFILE, ADDRESSES & VENDOR UPGRADE",
      "• Upload profile or store images via the provided uploader — wait for the progress to finish before leaving the page.",
      "• Manage addresses in Profile — you can mark a default and set a campus for each.",
      "• Buyers can become vendors via Register Your Store — same verification steps apply.",
      "",
      "PRIVACY & SAFETY",
      "• Protected pages require verification; vendor documents are reviewed before approval.",
      "",
      "TRY IT — SANDBOX",
      "• Create a test account → trigger verification → resend link → complete verification → change email in Profile → Security and observe the flow.",
      "• Try uploading a profile picture and watch the thumbnail progress indicator.",
    ].join("\n"),
  },
  products: {
    title: "Products & Vendors — Discovery, Listings & Reviews",
    body: [
      "OVERVIEW",
      "Products are organized by vendor and category. Vendors manage listings; buyers browse products and vendor stores. Verified badges highlight vendors who passed review.",
      "",
      "BUYING GUIDE",
      "1) Discover: search on Products, filter by category or campus, or browse a vendor storefront. Verified badges show trusted stores.",
      "2) Choices & options: some products offer sizes or colors (e.g., Fashion sizes M/L/XL). The product page shows the options; for buying multiple sizes add each size separately and adjust quantities in the cart (e.g., Medium ×1, Large ×1). Some products require a selection before you can add to cart; others add directly.",
      "3) Services: some listings are services — book via the service card and coordinate timing with the vendor.",
      "4) Reviews: only verified purchasers can leave reviews. Helpful votes highlight quality feedback; vendors can respond.",
      "5) Sponsored banners may appear on the homepage and are tracked for analytics — this helps us keep the marketplace fair.",
      "",
      "FOR VENDORS — LISTING & GROWTH",
      "• Create and edit listings in your products page: name, description, category, price, stock, images, choices (e.g., sizes), tags, and status. Use the image uploader — you'll see progress and confirmation messages without needing to refresh.",
      "• Publish marketing content in Marketing Content — submissions are reviewed and you can track their status.",
      "• Keep stock and pricing accurate; use clear photos; respond promptly to buyer requests.",
      "",
      "TRUST & POLICIES",
      "• Vendors submit ID and business documents for review — customers see approved stores first.",
      "• Report issues via Report a Bug or email support@myharvesthub.org.",
      "• Image and file uploads have size limits (about 5MB); you'll see clear messages if a file is too large or unsupported.",
      "",
      "TRY IT — SANDBOX",
      "• As a vendor: create a product with sizes → as a buyer: view the product → try adding different sizes to cart as separate lines → edit quantities in cart.",
      "• Try leaving a review after a completed order and voting on helpfulness.",
    ].join("\n"),
  },
  contact: {
    title: "Contact & Support — Channels & What to Include",
    body: [
      "OVERVIEW",
      "We keep support simple: clear contact channels and dedicated flows for bugs and account help.",
      "",
      "CHANNELS",
      "• Email: support@myharvesthub.org — for account, order, and payment help. We reply within one business day.",
      "• Phone: +234 701 203 7766 (Lekki, Lagos). For urgent order or receipt clarification during service hours.",
      "• Address: Lekki, Lagos, Nigeria.",
      "• Bug reports: Report a Bug — choose category and severity, describe steps, attach a screenshot. Reports are reviewed by our operations team.",
      "• Sales & ads: see Advertise with Us for sponsorship — our team confirms pricing and scheduling.",
      "",
      "BEFORE YOU REACH OUT",
      "• Already checked Help, FAQs, Terms, Privacy? Many common questions are answered there.",
      "• Have ready: your registered email, order number if relevant, campus/pickup choice, payment method, and screenshots. For verification issues, note the exact message you saw.",
      "",
      "WHATSAPP & SIGN-IN",
      "• The Contact via WhatsApp option may ask you to sign in first — after signing in, you'll return to continue your message.",
      "",
      "ESCALATION",
      "If a receipt proof is urgent, add a note to the order and also email support with 'URGENT — order HH-...' in the subject line.",
      "",
      "TRY IT — SANDBOX",
      "• Open Contact → simulate a WhatsApp contact flow → log out and try again to see sign-in handoff.",
      "• Submit a sample bug report (low severity) and track its status lifecycle: Open → In Progress → Resolved (you'll receive an email when resolved).",
    ].join("\n"),
  },
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
