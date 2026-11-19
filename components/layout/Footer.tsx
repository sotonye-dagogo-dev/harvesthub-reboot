"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Instagram, Mail, Phone, MapPin, ArrowUp } from "lucide-react";
import { footerConfig } from "@/lib/config/siteContent";
import { Logo } from "@/components/brand";

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
    <footer className="bg-ds-brand-deep text-ds-palette-purple-200">
      {/* Brand band */}
      <div className="border-b border-white/10">
        <div className="container mx-auto flex flex-col items-start justify-between gap-4 px-4 py-6 md:flex-row md:items-center">
          <Link href="/" aria-label="MyHarvestHub home" className="text-white hover:text-white">
            <Logo variant="church" markSize={44} showTagline inverted />
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wide text-white">We accept</span>
            {["Paystack", "Cards", "Bank transfer", "MyHarvestHub wallet"].map((method) => (
              <span key={method} className="rounded-ds-sm border border-white/20 bg-white/5 px-2 py-1 text-white">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {/* About Section */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">About MyHarvestHub</h3>
             <p className="text-sm text-ds-palette-purple-200">{footerConfig.about}</p>
            <div className="mt-4 flex gap-3">
              {footerConfig.socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ds-palette-purple-200 hover:text-white"
                  aria-label={social.label}
                >
                  {social.icon === "instagram" ? <Instagram className="h-5 w-5" /> : null}
                  {social.icon === "x" ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ) : null}
                  {social.icon === "tiktok" ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.72a8.19 8.19 0 0 0 4.76 1.52V6.79a4.84 4.84 0 0 1-1-.1z" />
                    </svg>
                  ) : null}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
               {footerConfig.quickLinks.map((link) => (
                 <li key={link.href}>
                   <Link
                     href={link.href}
                     className="text-ds-palette-purple-200 hover:text-white"
                   >
                     {link.label}
                   </Link>
                 </li>
               ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Support</h3>
            <ul className="space-y-2 text-sm">
               {footerConfig.supportLinks.map((link) => (
                 <li key={link.href}>
                   <Link
                     href={link.href}
                     className="text-ds-palette-purple-200 hover:text-white"
                   >
                     {link.label}
                   </Link>
                 </li>
               ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-ds-palette-purple-200">
                <MapPin className="h-5 w-5 flex-shrink-0" />
                 <span>{footerConfig.contact.address}</span>
              </li>
              <li className="flex items-center gap-2 text-ds-palette-purple-200">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <a
                   href={`tel:${footerConfig.contact.phone.replace(/\s+/g, "")}`}
                  className="text-ds-palette-purple-200 hover:text-white"
                >
                   {footerConfig.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2 text-ds-palette-purple-200">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <a
                   href={`mailto:${footerConfig.contact.email}`}
                  className="text-ds-palette-purple-200 hover:text-white"
                >
                   {footerConfig.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-ds-palette-purple-200 md:flex-row">
            <div className="flex flex-col items-center gap-1 md:items-start">
              <p>&copy; {currentYear} MyHarvestHub — a Harvesters International Christian Centre initiative. All rights reserved.</p>
              <p className="text-xs text-ds-palette-purple-300">
                Built by{" "}
                <a
                  href="https://sotonye-dagogo.is-a.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ds-palette-magenta-200 hover:text-white hover:underline"
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
                   className="text-ds-palette-purple-200 hover:text-white"
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
