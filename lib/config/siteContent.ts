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
      "MyHarvestHub orders are vendor-routed: one checkout can create one order per vendor. Each order carries a unique orderNumber (e.g., HH-2026-00123), status, payment status, delivery method (PICKUP or DELIVERY), and a full statusHistory audit trail.",
      "",
      "BUYER FLOW — HOW TO ORDER",
      "1) Browse /products or /vendors → Add to cart → adjust quantity/variants (e.g., T-shirt size) at cart level. The cart enforces variant selection when a product requires it.",
      "2) Checkout at /checkout: confirm delivery address, campus/pickup service, delivery method, and payment method. If you choose bank-transfer proof (BANK_TRANSFER_PROOF), uploading a clear proof image is compulsory before the order can be placed. The vendor validates the proof and updates status.",
      "3) Apply a voucher code if available (campus/category/product/vendor-scoped, min-order and expiry apply). Confirm totals and place order.",
      "4) Track progress in /orders → select an order to see statusHistory, pickupDetails/deliveryAddress, payment line, and proof status. You will receive order-confirmation and status-update emails via the notification system.",
      "5) Need to contact the vendor? Use the WhatsApp action from the order/vendor card — the auth-guarded continuation preserves your intent through login/verification if needed.",
      "",
      "ORDER LIFECYCLE & STATUSES",
      "PENDING → CONFIRMED (vendor accepted) → PROCESSING → READY_FOR_PICKUP or OUT_FOR_DELIVERY → DELIVERED. Vendors can also mark CANCELLED/REFUNDED when appropriate; every transition is recorded with actor, timestamp, and note.",
      "",
      "VENDOR FLOW — MANAGING ORDERS",
      "• Open /operations/orders. Filter by status/date/vendor campus.",
      "• Confirm incoming orders after validating payment proof (ProofOfTransfer row is created PENDING at checkout for every proof checkout). Use Verify/Reject on the proof to move the order forward.",
      "• Update status explicitly: Confirm, Mark as Sent / Ready for Pickup, Out for Delivery, Delivered. A delivered order can still be refunded within the configured refund window via the commerce lifecycle settings.",
      "• Keep audit integrity: add a note on every transition; customers see notes in their timeline.",
      "",
      "TIPS",
      "• Pickup: choose the Sunday service that matches your campus (SUNDAY_FIRST / SUNDAY_SECOND / MIDWEEK / SPECIAL_EVENT). Vendors configure which services they support per storeSettings.",
      "• If an order shows PENDING but payment was via Paystack/wallet, check /wallet transactions and the email logs; wallet uses explicit initialize-and-verify semantics — do not infer success from client callbacks alone.",
      "• Availability holds: for uncertain stock, raise a ProductAvailabilityRequest from the product page; the vendor confirms and the hold expires after the configured window.",
      "• Trouble? /contact/whatsapp preserves your checkout intent, /bug-report files a ticket, and /help/payments explains proof requirements.",
    ].join("\n"),
  },
  payments: {
    title: "Payments & Wallet — Methods, Proofs & Troubleshooting",
    body: [
      "OVERVIEW",
      "MyHarvestHub supports wallet, Paystack card/USSD, and bank-transfer proof. Wallet and Paystack are online; bank-transfer proof is an offline bank transfer plus a required image upload that the vendor validates. The commerce lifecycle config (operations/settings) controls whether payments are globally enabled and the settlement handles.",
      "",
      "BUYER GUIDE",
      "Wallet: top up in /wallet → Deposit → Paystack inline popup (card/USSD). Desktop and mobile resolve immediately when provider verification is unavailable from the deployment, falling back safely. Balance updates and a Transaction (DEPOSIT) is recorded.",
      "Card/USSD at checkout: pay through the same Paystack inline flow. Do not close the popup prematurely — wait for the verification step; if it stalls, check /wallet and /orders before retrying.",
      "Bank transfer proof at checkout or ad-application proof: transfer externally, then upload a clear image (PNG/JPG/WebP/PDF, ≤5MB via Cloudinary). The image is stored as ProofOfTransfer (PENDING) and the order moves only after the vendor verifies it. Proof upload is compulsory when that method is selected — checkout returns PROOF_OF_PAYMENT_REQUIRED if missing.",
      "Refunds & withdrawals: refunds follow the refundWindowHours setting; wallet withdrawals settle after withdrawalSettlementHoldHours and generate Notification + EmailDeliveryLog entries.",
      "",
      "VENDOR GUIDE",
      "• Verify proofs in /operations/orders or /operations/ads: open the proof image, confirm amount/currency/reference, then Verify or Reject with a note. Verified proofs release the order for fulfillment.",
      "• Configure bank details so buyers know where to transfer (storeSettings/bank fields surfaced at checkout). Keep store logo/banner and verification docs current to preserve trust.",
      "• Monitor payouts and commission (category-specific commissionConfig with a global default fallback). Statements live in the dashboard analytics cards.",
      "",
      "TROUBLESHOOTING",
      "• 'Proof required' at checkout: you selected bank-transfer proof but no image was attached — attach proof and retry.",
      "• Paystack amount mismatch: backend validates verified amount/currency strictly against checkout/deposit expectations — fulfillment is blocked until it matches.",
      "• No global toast after pay? The global feedback toast is wired for checkout (column-aligned live totals, discount stacking, voucher feedback), cart, and proof flows; if a toast is missing, check browser console and retry from /orders.",
      "• Receipts and emails: order confirmation shows orderNumber, vendor, totals, payment status, and line-item variants (size, quantity, price) so you do not need to click through to see what was ordered.",
    ].join("\n"),
  },
  locations: {
    title: "Locations & Pickup — Campuses, Zones & How to Choose",
    body: [
      "OVERVIEW",
      "MyHarvestHub is campus-aware: your User.campus (collected at signup), Address.campus (per-address), and Order.deliveryAddress/pickupDetails all carry campus so fulfillment is local. Campuses include Lekki, Ikeja, Gbagada, Yaba, Ilupeju, Abeokuta, Ibadan_Jericho, Port Harcourt, Abuja, Ghana, London, Manchester, Houston, Toronto, Online, and more.",
      "",
      "BUYER DIRECTIVE",
      "1) Choose a primary campus once at signup (buyer/vendor). You can add multiple addresses under /profile → Addresses, each tagged to a campus.",
      "2) At checkout, pick delivery method:",
      "   • PICKUP: select campus + pickup service (SUNDAY_FIRST, SUNDAY_SECOND, MIDWEEK, SPECIAL_EVENT). Vendors expose only the services they support; the UI enforces this and checkout validates.",
      "   • DELIVERY: select delivery zone if the vendor offers delivery (allowsDelivery toggle per vendor + configured deliveryZones). Delivery fees apply per vendor.",
      "3) Pickup details are recorded on the order and echoed in the confirmation email. Bring your order number to the service; vendors use it to confirm handover.",
      "4) If your campus is missing or you moved, update it in profile — new orders will use the updated campus, existing orders keep their captured campus.",
      "",
      "VENDOR DIRECTIVE",
      "• Configure in /store-settings: allowsPickup (boolean), allowsDelivery (boolean), pickupServices (array), deliveryZones (ids). Changes apply to new checkouts immediately; they do not retroactively change prior orders.",
      "• Align inventory to local campuses where possible and publish clear business hours + pickup windows in store description.",
      "• For cross-campus demand, enable delivery or offer a WhatsApp contact path (sanitized internal continuation ensures unauthenticated buyers can refire intent after signup/verify/login).",
      "",
      "TIPS & FAQs",
      "• 'No pickup service available' means that vendor does not support the service you selected — choose a different service or switch to delivery.",
      "• Online campus is a virtual fulfillment marker — suitable when no physical pickup applies; the system treats it like any other campus for routing and filtering.",
      "• Admins manage the global campus and lifecycle configs in /operations/settings and voucher scoping respects campus/category/product/vendor targeting.",
    ].join("\n"),
  },
  account: {
    title: "Account & Security — Email, Password & Profile",
    body: [
      "OVERVIEW",
      "Accounts are role-based: BUYER, VENDOR, ADMIN. Vendors undergo business verification; all users verify email before accessing protected routes. Security is built on HttpOnly SameSite cookies, JWT access/refresh with rotation, and audit-logged updates.",
      "",
      "SIGNUP & EMAIL VERIFICATION (CRITICAL)",
      "1) Complete /signup in stages: role → user info → (vendors) store info + verification docs (ID type, valid ID, business registration, utility bill — all must be Cloudinary URLs) → account/security.",
      "2) On submit, we create your account with emailVerified=false and send a verification email with a 24h link: https://<site>/verify-email?token=<uuid>&email=<you@example.com>. Do not close the signup page until you see the 'check your inbox' confirmation. If emailDelivered=0, the success banner still appears but the verification email did not send — use the resend form at /verify-email.",
      "3) Click the link from the same browser for smooth continuation. The /verify-email page auto-verifies the token via POST /api/auth/verify-email. On success it shows 'Email verified' and redirects to /login?verified=1 within 4 seconds (or via the 'Continue to Login' button). If your token expired, the page shows TOKEN_EXPIRED with a direct resend form — enter the exact signup email and press 'Resend verification email'.",
      "4) Sign in at /login after verification. Login returns 403 'needsEmailVerification' until the token is used. If you are already logged in with a stale unverified JWT, the verify step refreshes your session in-place so middleware stops forcing /verify-email.",
      "5) Trouble: 'Invalid verification link' means it was already used, malformed, or copy/paste trimmed characters. 'No account found' on resend means you typed a different email — match the signup address exactly (lowercased). Rate limiting is per-IP (strict) — wait a minute before retrying.",
      "",
      "PASSWORD & SESSION",
      "• Forgot password: /forgot-password → email with reset link (token + email in query). Do not request reset for an email with no account — you will receive an explicit 'no account found' message.",
      "• Change password: /profile → current password verification required for non-admins.",
      "• Email change: /profile → enter new email → we send a verification link to the NEW address (token prefix email-change:). Clicking that link mutates the canonical email and forces re-login via cleared auth cookies → /login?emailChanged=1.",
      "• Session hygiene: auth cookies are HttpOnly; 'Remember me' extends lifetime to 8h/30d, otherwise session cookies. Logout clears both and the localStorage cache myharvesthub_user.",
      "",
      "PROFILE, ADDRESSES & VENDOR UPGRADE",
      "• Profile picture and vendor/store logo uploads go to Cloudinary first; the API rejects raw non-Cloudinary URLs. Upload progress shows on the thumbnail overlay — wait for it to complete before navigating away.",
      "• Addresses: add/label/manage at /profile; flag isDefault; each can carry a campus override.",
      "• Buyers can become vendors via /become-vendor — the same verification-doc and businessAddress requirements apply.",
      "• Admins manage users in /operations/users: role changes, status, and related vendor records. Every update shows feedback toasts; the refresh button there reflects loading state.",
      "",
      "PRIVACY & SAFETY",
      "• We enforce verification gating on protected routes (dashboard, orders, wallet, etc.) and rate-limit auth endpoints. Vendor docs are reviewed by operations before approval.",
      "• For sensitive changes, we never reveal account existence via login timing — verification-pending is returned irrespective of password correctness to avoid oracles.",
    ].join("\n"),
  },
  products: {
    title: "Products & Vendors — Discovery, Listings & Reviews",
    body: [
      "OVERVIEW",
      "Products are vendor-routed and category-scoped (ProductCategory). Vendors manage listings in /operations/products; buyers browse /products and /vendors. Discovery respects isActive/isFeatured, views, sales, and ratings.",
      "",
      "BUYER GUIDE — FINDING & BUYING",
      "1) Discover: search at /products, filter by category/campus, or browse a vendor storefront (/vendors/[id]). Verified badges signal that businessVerification passed operations review.",
      "2) Variants & options: some products have config-driven variants (e.g., Fashion sizes M/L/XL/XXL). The PDP shows a single Size dropdown per product; for multi-size orders adjust quantities per variant in the cart (Medium ×1, Large ×1). The global ProductVariationConfig is admin-managed and non-blocking when absent — if a product has variants and requires a selection, Add to Cart is gated; otherwise it works without a size.",
      "3) Services vs products: listings with listingType=SERVICE carry serviceDetails (rate type, location, booking). Book via the service card — bookings create PENDING→CONFIRMED→IN_PROGRESS→COMPLETED flows.",
      "4) Reviews: only verified purchasers can review. Helpful votes (ReviewVote) bubble quality feedback; vendor responses attach to the review thread.",
      "5) Ads: sponsored banners appear TOP/HERO/SIDEBAR and are tracked via BannerEvents (IMPRESSION/CLICK/CONVERSION) for dashboards and analytics — unauthenticated views are counted too using visitorId fallback.",
      "",
      "VENDOR GUIDE — LISTING & GROWTH",
      "• Create/edit in /operations/products: name, description, category, price, compareAtPrice, discount, stock, images/mainImage (Cloudinary), variants JSON, tags, isActive/isFeatured, listingType. Upload via the governed uploader — feedback appears on the button, input area, and via global toast; success updates the page without manual refresh.",
      "• Content marketing: publish via /operations/marketing-content (VendorContentType IMAGE/VIDEO/TEXT/PROMO_BANNER). Pending → Approved → Active → Expired, with rejection reasons surfaced.",
      "• Growth tips: keep stock and pricing accurate; use clear photos; respond quickly to availability requests (ProductAvailabilityRequest with PENDING/CONFIRMED/DECLINED/EXPIRED and buyerNote/vendorResponse/expiresAt). Orders completed reliably raise totalSales/totalOrders/averageRating.",
      "",
      "TRUST & POLICIES",
      "• Vendors submit ID, business registration, and utility bill proofs — operations reviews docs and status moves PENDING→APPROVED. Customers see approved stores first.",
      "• Report issues via /bug-report (severity + screenshot + metadata → operations triage) or email support@myharvesthub.org.",
      "• 5MB image/file limits apply; unsupported types are reported via parsed human-readable toasts (too large, unsupported file type, parsed server messages) across the whole platform.",
    ].join("\n"),
  },
  contact: {
    title: "Contact & Support — Channels, SLAs & What to Include",
    body: [
      "OVERVIEW",
      "We keep support simple and auditable: one public contact hub, clear static channels, and dedicated flows for bugs and account help. No dead contact form lives here — static channels route directly.",
      "",
      "CHANNELS",
      "• Primary email: support@myharvesthub.org — for account, order, payment, and general help. Expect a response within one business day.",
      "• Phone: +234 701 203 7766 (Lekki, Lagos, Nigeria). For urgent order handover or payment-proof clarification during service hours.",
      "• Address: Lekki, Lagos, Nigeria (operational base; not a walk-in sales point).",
      "• Bug reports: /bug-report — choose category, severity (low/medium/high/critical), describe steps, attach a screenshot. Reports feed operations dashboards (/operations/bug-reports).",
      "• Sales & ads: /advertise and /ad-application for sponsorship — operations confirms pricing/inventory and schedules placements.",
      "",
      "BEFORE YOU REACH OUT",
      "• Already checked /help, /faqs, /terms, /privacy? Many order, payment-proof, and pickup questions are answered there.",
      "• Have ready: your registered email (lowercased), orderNumber (if relevant), campus/pickup service, payment method, and screenshots of proofs/errors. For email verification issues include the exact message shown (TOKEN_EXPIRED, INVALID_TOKEN, USER_NOT_FOUND, EMAIL_DELIVERY_FAILED).",
      "",
      "WHATSAPP & AUTH CONTINUATION",
      "• The 'Contact via WhatsApp' flow (/contact/whatsapp) is auth-guarded. If you start while logged out, we store a sanitized internal continuation and refire it after signup → verify-email → login, so you do not lose intent.",
      "",
      "ESCALATION",
      "If an order proof is urgent, flag it in both the order note (visible to the vendor) and via the static email channel with 'URGENT — order HH-...' in the subject line. Vendor/admins monitor proof queues in near real-time.",
      "",
      "AVAILABILITY",
      "Support is staffed around key commerce windows (weekdays + Sunday services that align with pickup). Off-hours messages are queued and responded next business window.",
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
