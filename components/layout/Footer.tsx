"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ArrowUp } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About Section */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              About HarvestHub
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your trusted marketplace connecting buyers with quality vendors across Lagos and
              beyond.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products"
                  className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                >
                  Browse Products
                </Link>
              </li>
              <li>
                <Link
                  href="/vendors"
                  className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                >
                  Find Vendors
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                >
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/help"
                  className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="h-5 w-5 flex-shrink-0" />
                <span>Oregun, Ikeja, Lagos, Nigeria</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <a
                  href="tel:+2348012345678"
                  className="hover:text-purple-600 dark:hover:text-purple-400"
                >
                  +234 801 234 5678
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <a
                  href="mailto:support@harvesthub.ng"
                  className="hover:text-purple-600 dark:hover:text-purple-400"
                >
                  support@harvesthub.ng
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400 md:flex-row">
            <p>&copy; {currentYear} HarvestHub. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-purple-600 dark:hover:text-purple-400">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-purple-600 dark:hover:text-purple-400">
                Privacy
              </Link>
              <Link href="/cookies" className="hover:text-purple-600 dark:hover:text-purple-400">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-all hover:bg-purple-700 hover:shadow-xl dark:bg-purple-500 dark:hover:bg-purple-600"
          aria-label="Back to top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </footer>
  );
}
