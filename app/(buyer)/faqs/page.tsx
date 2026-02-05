import { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQs | HarvestHub",
  description: "Frequently asked questions about using HarvestHub marketplace.",
};

export default function FAQsPage() {
  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click 'Sign Up' in the top right corner, choose your account type (Buyer or Vendor), and fill in your details. You'll receive a confirmation email to activate your account.",
        },
        {
          q: "Is HarvestHub free to use?",
          a: "Yes, creating an account and browsing products is completely free for buyers. Vendors pay a small commission on sales to maintain the platform.",
        },
        {
          q: "What areas do you serve?",
          a: "We currently serve Lagos and surrounding areas, with church pickup options at Oregun, Lekki, Victoria Island, Ikeja, Festac, and Ajah campuses.",
        },
      ],
    },
    {
      category: "Orders & Shopping",
      questions: [
        {
          q: "How do I place an order?",
          a: "Browse products, add items to your cart, proceed to checkout, choose delivery or pickup, and complete payment. You'll receive an order confirmation immediately.",
        },
        {
          q: "Can I modify my order after placing it?",
          a: "Orders can be cancelled before processing begins. Contact the vendor or our support team immediately if you need to make changes.",
        },
        {
          q: "What payment methods are accepted?",
          a: "We accept wallet balance, debit/credit cards, bank transfers, and USSD payments through secure payment gateways like Paystack and Flutterwave.",
        },
        {
          q: "How long does delivery take?",
          a: "Delivery times vary by vendor and location, typically 1-3 business days within Lagos. Check the product page for estimated delivery times.",
        },
      ],
    },
    {
      category: "Church Pickup",
      questions: [
        {
          q: "How does church pickup work?",
          a: "Select 'Church Pickup' at checkout, choose your preferred service (Sunday First, Sunday Second, Midweek, or Special Event) and campus location. Your order will be ready for collection at the designated area.",
        },
        {
          q: "What if I miss my pickup?",
          a: "Uncollected orders are held for 7 days. After that, they may be returned to the vendor. Contact support if you need to reschedule.",
        },
        {
          q: "Which church locations offer pickup?",
          a: "Oregun (HQ), Lekki, Victoria Island, Ikeja, Festac, and Ajah campuses all offer pickup services.",
        },
      ],
    },
    {
      category: "Wallet & Payments",
      questions: [
        {
          q: "How do I add money to my wallet?",
          a: "Go to your Wallet page, click 'Deposit Funds', enter the amount (minimum ₦100), and choose your payment method. Funds are added instantly after successful payment.",
        },
        {
          q: "How do I withdraw from my wallet?",
          a: "Click 'Withdraw' on your Wallet page, enter the amount and bank details. Withdrawals are processed within 3-5 business days.",
        },
        {
          q: "Are there any transaction fees?",
          a: "Payment gateway fees may apply depending on your payment method. Wallet-to-wallet transactions within HarvestHub have no fees.",
        },
        {
          q: "What happens if a payment fails?",
          a: "Failed payments don't complete the order. Your funds remain in your wallet or are refunded to your original payment method within 24 hours.",
        },
      ],
    },
    {
      category: "Returns & Refunds",
      questions: [
        {
          q: "Can I return a product?",
          a: "Yes, products can be returned within 7 days if they're defective, damaged, or significantly different from the description. Perishable items are non-returnable.",
        },
        {
          q: "How do I request a refund?",
          a: "Contact the vendor through your order page or our support team. Approved refunds are processed to your wallet within 5-7 business days.",
        },
        {
          q: "Who pays for return shipping?",
          a: "For defective or misrepresented products, the vendor covers return shipping. For buyer's remorse, the buyer may be responsible for return costs.",
        },
      ],
    },
    {
      category: "For Vendors",
      questions: [
        {
          q: "How do I become a vendor?",
          a: "Sign up as a vendor, complete your store profile, and submit for verification. Our team reviews applications within 3-5 business days.",
        },
        {
          q: "What are the fees for vendors?",
          a: "We charge a small commission on each sale (typically 5-10%) and payment processing fees. No monthly subscription required.",
        },
        {
          q: "How do I receive payments?",
          a: "Sales proceeds go to your vendor wallet. You can withdraw funds to your bank account at any time (processed within 3-5 business days).",
        },
        {
          q: "Can I offer both delivery and pickup?",
          a: "Yes! You can configure your store to offer delivery, church pickup, or both options to give customers flexibility.",
        },
      ],
    },
    {
      category: "Account & Security",
      questions: [
        {
          q: "How do I reset my password?",
          a: "Click 'Forgot Password' on the login page, enter your email, and follow the reset link sent to your inbox. Links expire after 1 hour.",
        },
        {
          q: "Is my payment information secure?",
          a: "Yes, we use industry-standard encryption and never store your full card details. Payments are processed through secure, PCI-compliant gateways.",
        },
        {
          q: "Can I delete my account?",
          a: "Yes, contact support to request account deletion. Note that this action is irreversible and you'll lose your wallet balance and order history.",
        },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Quick answers to common questions about using HarvestHub
        </p>
      </div>

      <div className="mx-auto max-w-4xl space-y-12">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
              {section.category}
            </h2>
            <div className="space-y-4">
              {section.questions.map((faq, index) => (
                <details
                  key={index}
                  className="group rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-900 dark:text-white">
                    <span>{faq.q}</span>
                    <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-lg bg-purple-50 p-8 text-center dark:bg-purple-900/20">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Didn&apos;t find your answer?
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Our support team is ready to help you with any questions
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/contact"
            className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
          >
            Contact Support
          </Link>
          <Link
            href="/help"
            className="rounded-lg border-2 border-purple-600 px-6 py-3 font-semibold text-purple-600 hover:bg-purple-50 dark:border-purple-500 dark:text-purple-500 dark:hover:bg-purple-900/20"
          >
            Visit Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
