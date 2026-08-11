import { describe, expect, it } from "vitest";
import {
  SECTION_METADATA_EDITOR_VERSION,
  buildSectionMetadata,
  createSection,
  htmlToFallbackSection,
  isSectionType,
  parseSectionsFromMetadata,
  sectionsToPlainText,
  serializeSectionsToHtml,
  stripSectionMetadata,
  type ContentSection,
} from "@/lib/content/structuredSections";

describe("createSection", () => {
  it("creates a TEXT section with stable default fields", () => {
    const section = createSection("TEXT");
    expect(section.type).toBe("TEXT");
    expect(section.heading).toBe("");
    expect(section.content).toBe("");
    expect(section.items).toEqual([]);
    expect(section.attribution).toBe("");
    expect(typeof section.id).toBe("string");
    expect(section.id.length).toBeGreaterThan(0);
  });

  it("applies overrides and defaults to TEXT type", () => {
    const section = createSection("HERO", { heading: "Welcome", content: "Hello" });
    expect(section.type).toBe("HERO");
    expect(section.heading).toBe("Welcome");
    expect(section.content).toBe("Hello");
  });
});

describe("isSectionType", () => {
  it("accepts all known section types", () => {
    expect(["TEXT", "HERO", "CALLOUT", "LIST", "QUOTE"].every(isSectionType)).toBe(true);
  });

  it("rejects unknown types", () => {
    expect(isSectionType("VIDEO")).toBe(false);
    expect(isSectionType("")).toBe(false);
    expect(isSectionType(undefined)).toBe(false);
  });
});

describe("serializeSectionsToHtml", () => {
  it("renders a TEXT section with escaped heading and content", () => {
    const html = serializeSectionsToHtml([
      createSection("TEXT", { heading: "A & B", content: "Line one\nLine two" }),
    ]);
    expect(html).toContain('<section class="pc-text">');
    expect(html).toContain("<h3>A &amp; B</h3>");
    expect(html).toContain("<p>Line one<br />Line two</p>");
    expect(html).not.toContain("<script>");
  });

  it("escapes HTML injected into content", () => {
    const html = serializeSectionsToHtml([
      createSection("TEXT", { content: '<img src=x onerror="alert(1)">' }),
    ]);
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("renders HERO with media and button", () => {
    const html = serializeSectionsToHtml([
      createSection("HERO", {
        heading: "Hero",
        content: "Big message",
        mediaUrl: "/hero.png",
        buttonLabel: "Learn more",
        buttonUrl: "/about",
      }),
    ]);
    expect(html).toContain('<section class="pc-hero">');
    expect(html).toContain('<img src="/hero.png" alt="Hero" />');
    expect(html).toContain('<a href="/about">Learn more</a>');
  });

  it("renders CALLOUT, LIST and QUOTE wrappers", () => {
    const html = serializeSectionsToHtml([
      createSection("CALLOUT", { heading: "Note", content: "Careful" }),
      createSection("LIST", { heading: "Steps", items: ["First", " Second ", ""] }),
      createSection("QUOTE", { content: "Trust the Lord", attribution: "Proverbs 3:5" }),
    ]);
    expect(html).toContain('<section class="pc-callout">');
    expect(html).toContain('<section class="pc-list">');
    expect(html).toContain("<ul><li>First</li><li>Second</li></ul>");
    expect(html).toContain('<section class="pc-quote">');
    expect(html).toContain("<blockquote><p>Trust the Lord</p></blockquote>");
    expect(html).toContain('<p class="pc-quote-attribution">— Proverbs 3:5</p>');
  });

  it("escapes URLs in href/src attributes", () => {
    const html = serializeSectionsToHtml([
      createSection("HERO", {
        heading: "H",
        mediaUrl: "/a?b=1&c=2",
        buttonLabel: "Go",
        buttonUrl: '/path" onclick="x()',
      }),
    ]);
    expect(html).toContain('src="/a?b=1&amp;c=2"');
    expect(html).not.toContain('onclick="x()"');
  });
});

describe("parseSectionsFromMetadata", () => {
  it("round-trips structured sections from metadata", () => {
    const sections: ContentSection[] = [
      createSection("TEXT", { heading: "Intro", content: "Hello" }),
      createSection("LIST", { heading: "Points", items: ["One", "Two"] }),
    ];
    const parsed = parseSectionsFromMetadata(buildSectionMetadata(sections));
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({ type: "TEXT", heading: "Intro", content: "Hello" });
    expect(parsed[1]).toMatchObject({ type: "LIST", items: ["One", "Two"] });
  });

  it("returns an empty array for non-section metadata", () => {
    expect(parseSectionsFromMetadata(null)).toEqual([]);
    expect(parseSectionsFromMetadata({ custom: true })).toEqual([]);
    expect(parseSectionsFromMetadata({ sections: "nope" })).toEqual([]);
  });

  it("coerces unknown section types to TEXT", () => {
    const parsed = parseSectionsFromMetadata({
      sections: [{ type: "VIDEO", heading: "X", content: "Y" }],
    });
    expect(parsed[0]).toMatchObject({ type: "TEXT", heading: "X", content: "Y" });
  });
});

describe("buildSectionMetadata and stripSectionMetadata", () => {
  it("builds version-3 metadata with sections and fallback contract", () => {
    const sections = [createSection("TEXT", { heading: "H", content: "C" })];
    const metadata = buildSectionMetadata(sections);
    expect(metadata.editorVersion).toBe(SECTION_METADATA_EDITOR_VERSION);
    expect(metadata.sections).toEqual(sections);
    expect(metadata.fallbackContract).toMatchObject({
      source: "structured-sections",
      fallbackBodyRequired: true,
    });
    expect(typeof metadata.generatedAt).toBe("string");
  });

  it("strips reserved keys but keeps custom keys", () => {
    const metadata = buildSectionMetadata([createSection("TEXT")]);
    const merged = { ...metadata, customField: "kept" };
    const stripped = stripSectionMetadata(merged);
    expect(stripped).toEqual({ customField: "kept" });
  });

  it("handles null/undefined metadata", () => {
    expect(stripSectionMetadata(null)).toEqual({});
    expect(stripSectionMetadata(undefined)).toEqual({});
  });
});

describe("sectionsToPlainText", () => {
  it("joins heading, content, items and attribution into one line", () => {
    const sections: ContentSection[] = [
      createSection("TEXT", { heading: "Intro", content: "Hello world" }),
      createSection("LIST", { items: ["One", "Two"] }),
      createSection("QUOTE", { attribution: "Proverbs 3:5" }),
    ];
    expect(sectionsToPlainText(sections)).toBe("Intro Hello world One Two Proverbs 3:5");
  });
});

describe("htmlToFallbackSection", () => {
  it("flattens legacy HTML into a single TEXT section", () => {
    const section = htmlToFallbackSection("<h2>Old post</h2><p>Content here</p>", "Legacy title");
    expect(section.type).toBe("TEXT");
    expect(section.heading).toBe("Legacy title");
    expect(section.content).toBe("Old post Content here");
    expect(section.items).toEqual([]);
  });

  it("normalizes whitespace and strips tags", () => {
    const section = htmlToFallbackSection(
      "  <p>Line  one</p>\n  <p>Line  two</p>  ",
      "Title"
    );
    expect(section.content).toBe("Line one Line two");
  });
});
