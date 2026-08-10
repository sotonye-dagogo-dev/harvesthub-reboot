"use client";

import { useState } from "react";
import { BlogAdminPanel } from "@/components/features/blog/BlogAdminPanel";
import { BlogConfigPanel } from "@/components/features/blog/BlogConfigPanel";
import { cn } from "@/lib/utils";

type Tab = "posts" | "settings";

export default function OperationsBlogPage() {
  const [tab, setTab] = useState<Tab>("posts");

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "posts", label: "Posts" },
    { key: "settings", label: "Blog Settings" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-ds-text-primary">Blog</h1>

      <div className="flex gap-1 border-b border-ds-border-base">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === item.key
                ? "border-ds-brand-primary text-ds-text-brand"
                : "border-transparent text-ds-text-secondary hover:text-ds-text-primary"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "posts" ? <BlogAdminPanel /> : <BlogConfigPanel />}
    </div>
  );
}
