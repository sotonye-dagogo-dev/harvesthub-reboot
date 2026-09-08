import { notFound } from "next/navigation";
import Link from "next/link";
import { helpCenterConfig, helpArticleFallbacks } from "@/lib/config/siteContent";
import { getPublicContentBySlug } from "@/lib/data/publicContent";
import HelpSandbox from "@/components/help/HelpSandbox";

interface HelpTopicPageProps {
  params: Promise<{ slug: string }>;
}

export default async function HelpTopicPage({ params }: HelpTopicPageProps) {
  const { slug } = await params;
  const topic = helpCenterConfig.topics.find((item) => item.slug === slug);

  if (!topic) {
    notFound();
  }

  const content = await getPublicContentBySlug(`help-${slug}`);
  const fallback = helpArticleFallbacks[slug];

  const displayTitle = content?.title || fallback?.title || topic.title;
  const displayBody = content?.body || fallback?.body || null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <Link href="/help" className="mb-4 inline-block text-sm text-ds-text-brand hover:underline">
        ← Back to Help Center
      </Link>
      <h1 className="mb-2 text-3xl font-bold text-ds-text-primary">{displayTitle}</h1>
      <p className="mb-8 text-ds-text-secondary">{topic.description}</p>

      {displayBody ? (
        <article className="max-w-none rounded-ds-md border border-ds-border-base bg-ds-surface-base p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ds-text-secondary">
            {displayBody}
          </pre>
          {!content?.body && fallback && (
            <p className="mt-6 border-t border-ds-border-base pt-4 text-xs text-ds-text-placeholder">
              This guide is the built-in fallback. An admin-published article (slug `help-{slug}`) will replace it automatically when available.
            </p>
          )}
        </article>
      ) : (
        <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-base p-6">
          <p className="text-sm text-ds-text-secondary">
            No detailed article has been published for this topic yet.
          </p>
          <p className="mt-2 text-sm text-ds-text-secondary">
            Please contact support via <Link href="/contact" className="text-ds-text-brand hover:underline">the contact page</Link> if you need immediate help.
          </p>
        </div>
      )}
      <div className="mt-6">
        <HelpSandbox slug={slug} />
      </div>
    </div>
  );
}
