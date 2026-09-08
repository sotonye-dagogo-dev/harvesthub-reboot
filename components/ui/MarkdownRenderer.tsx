"use client";
import React from "react";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineFormat(text: string): string {
  let out = escapeHtml(text);
  // bold **text** or __text__
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // italic *text* or _text_ (avoid double)
  out = out.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  out = out.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, "<em>$1</em>");
  // inline code `code`
  out = out.replace(/`([^`]+?)`/g, '<code class="rounded bg-ds-surface-sunken px-1 py-0.5 text-xs">$1</code>');
  // links [text](url) - sanitize url
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-ds-text-brand hover:underline">$1</a>');
  return out;
}

export default function MarkdownRenderer({ content }: { content: string }) {
  if (!content || typeof content !== "string") {
    return <p className="text-sm text-ds-text-secondary">No content available.</p>;
  }
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listBuffer.length === 0 || !listType) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    blocks.push(
      // eslint-disable-next-line react/no-array-index-key
      React.createElement(
        Tag,
        {
          key: `list-${blocks.length}`,
          className: listType === "ol" ? "ml-6 list-decimal space-y-1 text-sm text-ds-text-secondary" : "ml-6 list-disc space-y-1 text-sm text-ds-text-secondary",
        },
        listBuffer.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
        ))
      )
    );
    listBuffer = [];
    listType = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }
    // headings
    const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      flushList();
      const level = hMatch[1]!.length;
      const text = hMatch[2]!;
      const cls = level === 1 ? "text-xl font-bold text-ds-text-primary" : level === 2 ? "text-lg font-semibold text-ds-text-primary" : "text-base font-semibold text-ds-text-primary";
      blocks.push(React.createElement(`h${level}`, { key: `h-${idx}`, className: `mt-3 ${cls}`, dangerouslySetInnerHTML: { __html: inlineFormat(text) } }));
      return;
    }
    // unordered list
    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listBuffer.push(ulMatch[1]!);
      return;
    }
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listBuffer.push(olMatch[1]!);
      return;
    }
    // blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      blocks.push(
        <blockquote key={`bq-${idx}`} className="border-l-2 border-ds-border-base pl-3 text-sm italic text-ds-text-secondary" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.slice(2)) }} />
      );
      return;
    }
    // paragraph
    flushList();
    blocks.push(<p key={`p-${idx}`} className="text-sm leading-relaxed text-ds-text-secondary" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }} />);
  });
  flushList();

  return <div className="space-y-2">{blocks}</div>;
}
