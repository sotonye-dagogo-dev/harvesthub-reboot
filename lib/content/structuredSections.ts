/**
 * Universal structured content section model shared by every no-HTML authoring surface
 * (public content pages, blog posts, and future use-cases). Sections are stored twice:
 * a generated HTML `body` for safe frontend rendering plus a structured `sections` array
 * inside metadata so editors can round-trip without HTML knowledge.
 */

export type SectionType = "TEXT" | "HERO" | "CALLOUT" | "LIST" | "QUOTE";

export type ContentSection = {
  id: string;
  type: SectionType;
  heading: string;
  content: string;
  items: string[];
  attribution: string;
  mediaUrl?: string;
  buttonLabel?: string;
  buttonUrl?: string;
};

export const SECTION_TYPES: SectionType[] = ["TEXT", "HERO", "CALLOUT", "LIST", "QUOTE"];

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  TEXT: "Text Block",
  HERO: "Hero Block",
  CALLOUT: "Callout Block",
  LIST: "List Block",
  QUOTE: "Quote Block",
};

export const SECTION_TYPE_SHORT_LABELS: Record<SectionType, string> = {
  TEXT: "Text",
  HERO: "Hero",
  CALLOUT: "Callout",
  LIST: "List",
  QUOTE: "Quote",
};

export const SECTION_METADATA_EDITOR_VERSION = 3;

export function isSectionType(value: unknown): value is SectionType {
  return typeof value === "string" && (SECTION_TYPES as readonly string[]).includes(value);
}

export function createSection(type: SectionType = "TEXT", overrides: Partial<ContentSection> = {}): ContentSection {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    heading: "",
    content: "",
    items: [],
    attribution: "",
    ...overrides,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMultiline(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function escapeUrl(value: string): string {
  return escapeHtml(value);
}

function renderListItems(items: string[]): string {
  const filtered = items
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (filtered.length === 0) return "";

  return `<ul>${filtered.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

export function serializeSectionsToHtml(sections: ContentSection[]): string {
  return sections
    .map((section) => {
      const heading = section.heading.trim();
      const content = section.content.trim();
      const buttonLabel = section.buttonLabel?.trim();
      const buttonUrl = section.buttonUrl?.trim();
      const mediaUrl = section.mediaUrl?.trim();
      const attribution = section.attribution?.trim();

      switch (section.type) {
        case "HERO": {
          return [
            '<section class="pc-hero">',
            heading ? `<h2>${escapeHtml(heading)}</h2>` : "",
            content ? `<p>${formatMultiline(content)}</p>` : "",
            mediaUrl
              ? `<img src="${escapeUrl(mediaUrl)}" alt="${escapeHtml(heading || "Hero image")}" />`
              : "",
            buttonLabel && buttonUrl
              ? `<p><a href="${escapeUrl(buttonUrl)}">${escapeHtml(buttonLabel)}</a></p>`
              : "",
            "</section>",
          ].join("");
        }

        case "CALLOUT": {
          return [
            '<section class="pc-callout">',
            heading ? `<h3>${escapeHtml(heading)}</h3>` : "",
            content ? `<p>${formatMultiline(content)}</p>` : "",
            "</section>",
          ].join("");
        }

        case "LIST": {
          return [
            '<section class="pc-list">',
            heading ? `<h3>${escapeHtml(heading)}</h3>` : "",
            renderListItems(section.items),
            "</section>",
          ].join("");
        }

        case "QUOTE": {
          return [
            '<section class="pc-quote">',
            content ? `<blockquote><p>${formatMultiline(content)}</p></blockquote>` : "",
            attribution ? `<p class="pc-quote-attribution">— ${escapeHtml(attribution)}</p>` : "",
            "</section>",
          ].join("");
        }

        default: {
          return [
            '<section class="pc-text">',
            heading ? `<h3>${escapeHtml(heading)}</h3>` : "",
            content ? `<p>${formatMultiline(content)}</p>` : "",
            mediaUrl
              ? `<p><img src="${escapeUrl(mediaUrl)}" alt="${escapeHtml(heading || "Section image")}" /></p>`
              : "",
            "</section>",
          ].join("");
        }
      }
    })
    .join("\n");
}

function parseString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseSectionsFromMetadata(metadata: unknown): ContentSection[] {
  if (!metadata || typeof metadata !== "object") return [];

  const record = metadata as Record<string, unknown>;
  const rawSections = record.sections;
  if (!Array.isArray(rawSections)) return [];

  const parsed: ContentSection[] = [];
  rawSections.forEach((section, index) => {
    if (!section || typeof section !== "object") return;
    const item = section as Record<string, unknown>;

    const type = isSectionType(item.type) ? item.type : "TEXT";

    parsed.push({
      id: typeof item.id === "string" && item.id.length > 0 ? item.id : `imported-${index}`,
      type,
      heading: parseString(item.heading),
      content: parseString(item.content),
      items: Array.isArray(item.items)
        ? item.items.map((entry) => (typeof entry === "string" ? entry : "")).filter((entry) => entry.length > 0)
        : [],
      attribution: parseString(item.attribution),
      mediaUrl: typeof item.mediaUrl === "string" ? item.mediaUrl : undefined,
      buttonLabel: typeof item.buttonLabel === "string" ? item.buttonLabel : undefined,
      buttonUrl: typeof item.buttonUrl === "string" ? item.buttonUrl : undefined,
    });
  });

  return parsed;
}

export function buildSectionMetadata(sections: ContentSection[]) {
  return {
    editorVersion: SECTION_METADATA_EDITOR_VERSION,
    sections,
    generatedAt: new Date().toISOString(),
    fallbackContract: {
      source: "structured-sections",
      fallbackBodyRequired: true,
    },
  };
}

export function stripSectionMetadata(metadata: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object") return {};
  const copy = { ...metadata };
  delete copy.editorVersion;
  delete copy.sections;
  delete copy.generatedAt;
  delete copy.fallbackContract;
  return copy;
}

export function sectionsToPlainText(sections: ContentSection[]): string {
  const parts: string[] = [];
  sections.forEach((section) => {
    if (section.heading.trim()) parts.push(section.heading.trim());
    if (section.content.trim()) parts.push(section.content.trim());
    section.items.forEach((item) => {
      if (item.trim()) parts.push(item.trim());
    });
    if (section.attribution.trim()) parts.push(section.attribution.trim());
  });
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function htmlToFallbackSection(body: string, heading: string): ContentSection {
  const text = body
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    ...createSection("TEXT"),
    heading,
    content: text,
  };
}
