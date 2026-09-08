"use client";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

function isStructuredHtml(content: string): boolean {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  if (trimmed.includes('<section class="pc-')) return true;
  // legacy HTML detection: starts with < and contains a tag we generate
  if (trimmed.startsWith("<") && /<(section|p|h[1-6]|ul|blockquote|img)[\s>]/i.test(trimmed)) return true;
  return false;
}

export default function BlogBodyRenderer({ content }: { content: string }) {
  if (!content || typeof content !== "string") {
    return <p className="text-sm text-ds-text-secondary">No content available.</p>;
  }
  if (isStructuredHtml(content)) {
    return (
      <div
        className="blog-structured-content prose prose-sm max-w-none dark:prose-invert prose-headings:text-ds-text-primary prose-p:text-ds-text-secondary prose-a:text-ds-text-brand prose-strong:text-ds-text-primary prose-li:text-ds-text-secondary"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return <MarkdownRenderer content={content} />;
}
