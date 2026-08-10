"use client";

import { useState } from "react";
import { Facebook, Link2, Twitter } from "lucide-react";

type BlogShareButtonsProps = {
  url: string;
  title: string;
};

export function BlogShareButtons({ url, title }: BlogShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      icon: Twitter,
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: Facebook,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-ds-text-secondary">Share:</span>
      {shareLinks.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className="inline-flex h-9 w-9 items-center justify-center rounded-ds-full border border-ds-border-base text-ds-text-secondary transition-colors hover:border-ds-text-brand hover:text-ds-text-brand"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="inline-flex h-9 w-9 items-center justify-center rounded-ds-full border border-ds-border-base text-ds-text-secondary transition-colors hover:border-ds-text-brand hover:text-ds-text-brand"
      >
        <Link2 className="h-4 w-4" />
      </button>
      {copied ? <span className="text-xs text-ds-status-success-text">Link copied!</span> : null}
    </div>
  );
}
