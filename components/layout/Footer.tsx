"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Instagram, Mail, Phone, MapPin, ArrowUp } from "lucide-react";
import { footerConfig } from "@/lib/config/siteContent";

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
            <h3 className="mb-4 text-lg font-semibold text-ds-text-primary">About MyHarvestHub</h3>
             <p className="text-sm text-ds-text-secondary">{footerConfig.about}</p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://www.instagram.com/myharvesthub?igsh=eTllY20wMjA0NHhj&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://x.com/myharvesthub?s=21&t=KwO4wedcwGSnEO5ouE1o-w"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                aria-label="X (Twitter)"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@myharvesthub?_r=1&_t=ZS-94Y4nZ0omjV"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                aria-label="TikTok"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.72a8.19 8.19 0 0 0 4.76 1.52V6.79a4.84 4.84 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-ds-text-primary">Quick Links</h3>
            <ul className="space-y-2 text-sm">
               {footerConfig.quickLinks.map((link) => (
                 <li key={link.href}>
                   <Link
                     href={link.href}
                     className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                   >
                     {link.label}
                   </Link>
                 </li>
               ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-ds-text-primary">Support</h3>
            <ul className="space-y-2 text-sm">
               {footerConfig.supportLinks.map((link) => (
                 <li key={link.href}>
                   <Link
                     href={link.href}
                     className="text-ds-text-secondary hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
                   >
                     {link.label}
                   </Link>
                 </li>
               ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-ds-text-primary">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-ds-text-secondary">
                <MapPin className="h-5 w-5 flex-shrink-0" />
                 <span>{footerConfig.contact.address}</span>
              </li>
              <li className="flex items-center gap-2 text-ds-text-secondary">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <a
                   href={`tel:${footerConfig.contact.phone.replace(/\s+/g, "")}`}
                  className="hover:text-ds-text-brand dark:hover:text-ds-brand-accent"
                >
                   {footerConfig.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2 text-ds-text-secondary">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <a
                   href={`mailto:${footerConfig.contact.email}`}
                  className="hover:text-ds-text-brand dark:hover:text-ds-brand-accent"
                >
                   {footerConfig.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-ds-border-base pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-ds-text-secondary md:flex-row">
            <div className="flex flex-col items-center gap-1 md:items-start">
              <p>&copy; {currentYear} MyHarvestHub. All rights reserved.</p>
              <p className="text-xs text-ds-text-placeholder">
                Built by{" "}
                <a
                  href="https://sotonye-dagogo.is-a.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ds-text-brand hover:underline"
                >
                  S.D.
                </a>
              </p>
            </div>
            <div className="flex gap-6">
               {footerConfig.legalLinks.map((link) => (
                 <Link
                   key={link.href}
                   href={link.href}
                   className="hover:text-ds-text-brand dark:hover:text-ds-brand-accent"
                 >
                   {link.label}
                 </Link>
               ))}
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
