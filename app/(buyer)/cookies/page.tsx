import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | HarvestHub",
  description: "HarvestHub Cookie Policy - How we use cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Cookie Policy</h1>
        <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
          Last updated: February 1, 2026
        </p>

        <div className="prose dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              1. What Are Cookies
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Cookies are small text files stored on your device when you visit a website. They help
              us provide you with a better experience by remembering your preferences and
              understanding how you use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              2. How We Use Cookies
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              HarvestHub uses cookies for the following purposes:
            </p>

            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Essential Cookies
            </h3>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>Authentication and session management</li>
              <li>Shopping cart functionality</li>
              <li>Security features and fraud prevention</li>
              <li>Load balancing and server optimization</li>
            </ul>

            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Functional Cookies
            </h3>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>Remembering your language and currency preferences</li>
              <li>Storing your delivery address preferences</li>
              <li>Maintaining your theme settings (light/dark mode)</li>
              <li>Remembering recently viewed products</li>
            </ul>

            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Analytics Cookies
            </h3>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>Understanding how visitors interact with our platform</li>
              <li>Measuring the effectiveness of our features</li>
              <li>Identifying areas for improvement</li>
              <li>Tracking page views and navigation patterns</li>
            </ul>

            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Marketing Cookies
            </h3>
            <ul className="list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>Showing relevant product recommendations</li>
              <li>Displaying personalized promotional banners</li>
              <li>Measuring the effectiveness of our marketing campaigns</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              3. Cookies We Use
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold dark:border-gray-700">
                      Cookie Name
                    </th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold dark:border-gray-700">
                      Purpose
                    </th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold dark:border-gray-700">
                      Duration
                    </th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold dark:border-gray-700">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-400">
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      accessToken
                    </td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      User authentication
                    </td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      15 minutes
                    </td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      Essential
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      refreshToken
                    </td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      Session persistence
                    </td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      7 days
                    </td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      Essential
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">theme</td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      Dark/light mode preference
                    </td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      1 year
                    </td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      Functional
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">cart</td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      Shopping cart contents
                    </td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      30 days
                    </td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">
                      Essential
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              4. Managing Cookies
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              You can manage your cookie preferences in several ways:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>
                <strong>Browser Settings:</strong> Most browsers allow you to control cookies
                through their settings. You can typically find these in the &quot;Options&quot; or
                &quot;Preferences&quot; menu.
              </li>
              <li>
                <strong>Deleting Cookies:</strong> You can delete existing cookies at any time
                through your browser settings.
              </li>
              <li>
                <strong>Blocking Cookies:</strong> You can set your browser to block all cookies,
                but some features may not work properly.
              </li>
            </ul>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Please note that disabling essential cookies may prevent you from using certain
              features of HarvestHub, such as logging in or adding items to your cart.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              5. Third-Party Cookies
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We may use third-party services that set their own cookies, including:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>Paystack and Flutterwave for payment processing</li>
              <li>Google Analytics for usage analytics</li>
              <li>Cloudinary for image delivery optimization</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              6. Updates to This Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We may update this Cookie Policy from time to time. We will notify you of any
              significant changes by posting a notice on our platform. Your continued use of
              HarvestHub after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">7. Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-400">
              If you have questions about our cookie practices, please contact us:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
              <li>
                Email:{" "}
                <a href="mailto:privacy@harvesthub.com" className="text-purple-600 hover:underline">
                  privacy@harvesthub.com
                </a>
              </li>
              <li>
                Visit our{" "}
                <Link href="/contact" className="text-purple-600 hover:underline">
                  Contact Page
                </Link>
              </li>
            </ul>
          </section>

          <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Related policies:{" "}
              <Link href="/privacy" className="text-purple-600 hover:underline">
                Privacy Policy
              </Link>
              {" · "}
              <Link href="/terms" className="text-purple-600 hover:underline">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
