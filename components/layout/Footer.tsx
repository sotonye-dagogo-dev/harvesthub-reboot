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
    <footer className="border-t border-ds-border-base bg-ds-surface-base dark:bg-ds-surface-base">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About Section */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-ds-text-primary">
              About HarvestHub
            </h3>
            <p className="text-sm text-ds-text-secondary">
              Your trusted marketplace connecting buyers with quality vendors across Lagos and
              beyond.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-ds-text-primary">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products"
                  className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                >
                  Browse Products
                </Link>
              </li>
              <li>
                <Link
                  href="/vendors"
                  className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                >
                  Find Vendors
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                >
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-ds-text-primary">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/help"
                  className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-ds-text-primary">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-ds-text-secondary">
                <MapPin className="h-5 w-5 flex-shrink-0" />
                <span>Oregun, Ikeja, Lagos, Nigeria</span>
              </li>
              <li className="flex items-center gap-2 text-ds-text-secondary">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <a
                  href="tel:+2348012345678"
                  className="hover:text-ds-text-brand dark:hover:text-ds-brand-accent"
                >
                  +234 801 234 5678
                </a>
              </li>
              <li className="flex items-center gap-2 text-ds-text-secondary">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <a
                  href="mailto:support@harvesthub.ng"
                  className="hover:text-ds-text-brand dark:hover:text-ds-brand-accent"
                >
                  support@harvesthub.ng
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-ds-border-base pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-ds-text-secondary md:flex-row">
            <p>&copy; {currentYear} HarvestHub. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-ds-text-brand dark:hover:text-ds-brand-accent">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-ds-text-brand dark:hover:text-ds-brand-accent">
                Privacy
              </Link>
              <Link href="/cookies" className="hover:text-ds-text-brand dark:hover:text-ds-brand-accent">
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
          className="fixed bottom-8 right-8 z-ds-overlay flex h-12 w-12 items-center justify-center rounded-ds-full bg-ds-brand-primary text-white shadow-ds-lg transition-all hover:bg-ds-brand-primary-hover hover:shadow-ds-xl dark:bg-ds-brand-primary dark:hover:bg-ds-brand-primary"
          aria-label="Back to top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </footer>
  );
}
