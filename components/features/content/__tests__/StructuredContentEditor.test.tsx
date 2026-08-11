import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StructuredContentEditor } from "@/components/features/content/StructuredContentEditor";
import { createSection, type ContentSection } from "@/lib/content/structuredSections";

describe("StructuredContentEditor", () => {
  it("renders an initial section with heading and content inputs", () => {
    const sections = [createSection("TEXT", { heading: "Intro", content: "Hello" })];
    render(<StructuredContentEditor sections={sections} onSectionsChange={() => undefined} />);

    expect(screen.getByText("Structured Sections")).toBeInTheDocument();
    expect(screen.getByText("Section 1 · Text")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Section heading")).toHaveValue("Intro");
    expect(screen.getByPlaceholderText("Write section content")).toHaveValue("Hello");
  });

  it("emits updated heading and content on change", () => {
    const onSectionsChange = vi.fn();
    const sections = [createSection("TEXT", { heading: "", content: "" })];
    render(
      <StructuredContentEditor sections={sections} onSectionsChange={onSectionsChange} />
    );

    fireEvent.change(screen.getByPlaceholderText("Section heading"), {
      target: { value: "New heading" },
    });
    expect(onSectionsChange).toHaveBeenCalledWith([
      expect.objectContaining({ heading: "New heading" }),
    ]);

    fireEvent.change(screen.getByPlaceholderText("Write section content"), {
      target: { value: "New content" },
    });
    expect(onSectionsChange).toHaveBeenCalledWith([
      expect.objectContaining({ content: "New content" }),
    ]);
  });

  it("adds a new section with the selected type", () => {
    const onSectionsChange = vi.fn();
    const sections = [createSection("TEXT", { heading: "One" })];
    render(
      <StructuredContentEditor sections={sections} onSectionsChange={onSectionsChange} />
    );

    fireEvent.change(screen.getByLabelText("New section type"), {
      target: { value: "LIST" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add section/i }));

    expect(onSectionsChange).toHaveBeenCalledWith([
      expect.objectContaining({ heading: "One" }),
      expect.objectContaining({ type: "LIST", heading: "" }),
    ]);
  });

  it("only offers allowed section types", () => {
    const sections = [createSection("TEXT")];
    render(
      <StructuredContentEditor
        sections={sections}
        onSectionsChange={() => undefined}
        allowedTypes={["TEXT", "QUOTE"]}
      />
    );

    const options = screen.getByLabelText("Section type");
    expect(options.children.length).toBe(2);
    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("Quote")).toBeInTheDocument();
    expect(screen.queryByText("Hero")).not.toBeInTheDocument();
    expect(screen.queryByText("List")).not.toBeInTheDocument();
  });

  it("renders list items for LIST sections and attribution for QUOTE sections", () => {
    const sections: ContentSection[] = [
      createSection("LIST", { heading: "Steps", items: ["One", "Two"] }),
      createSection("QUOTE", { content: "Trust the Lord", attribution: "Proverbs 3:5" }),
    ];
    render(<StructuredContentEditor sections={sections} onSectionsChange={() => undefined} />);

    expect(screen.getByPlaceholderText(/One item per line/)).toHaveValue("One\nTwo");
    expect(screen.getByPlaceholderText("Who said it (e.g. Proverbs 3:5)")).toHaveValue(
      "Proverbs 3:5"
    );
  });

  it("reorders sections with move buttons", () => {
    const onSectionsChange = vi.fn();
    const sections: ContentSection[] = [
      createSection("TEXT", { heading: "First" }),
      createSection("TEXT", { heading: "Second" }),
    ];
    render(
      <StructuredContentEditor sections={sections} onSectionsChange={onSectionsChange} />
    );

    const upButtons = screen.getAllByText("↑");
    fireEvent.click(upButtons[1] as HTMLElement);

    expect(onSectionsChange).toHaveBeenCalledWith([
      expect.objectContaining({ heading: "Second" }),
      expect.objectContaining({ heading: "First" }),
    ]);
  });

  it("hides media when showMedia is false", () => {
    const sections = [createSection("TEXT")];
    render(
      <StructuredContentEditor
        sections={sections}
        onSectionsChange={() => undefined}
        showMedia={false}
      />
    );

    expect(screen.queryByText("Section Media")).not.toBeInTheDocument();
  });

  it("hides button fields when showButtons is false", () => {
    const sections = [createSection("TEXT")];
    render(
      <StructuredContentEditor
        sections={sections}
        onSectionsChange={() => undefined}
        showButtons={false}
      />
    );

    expect(screen.queryByPlaceholderText("Learn more")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("/products")).not.toBeInTheDocument();
  });
});
