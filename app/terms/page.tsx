import { Metadata } from "next";
import { getPublicContentBySlug } from "@/lib/data/publicContent";

export const metadata: Metadata = {
  title: "Terms & Conditions | MyHarvestHub",
  description:
    "MyHarvestHub.org Terms & Conditions of Use � binding agreement governing use of the platform.",
};

export default async function TermsOfServicePage() {
  const publicContent = await getPublicContentBySlug("terms");

  if (publicContent && publicContent.status === "PUBLISHED") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-4 text-4xl font-bold text-ds-text-primary">{publicContent.title}</h1>
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: publicContent.body }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold text-ds-text-primary">
          Terms &amp; Conditions of Use
        </h1>
        <p className="mb-4 text-ds-text-secondary">
          This page is temporarily unavailable. Please check back soon.
        </p>
      </div>
    </div>
  );
}
