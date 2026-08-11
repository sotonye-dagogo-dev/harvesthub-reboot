"use client";

import { useState } from "react";
import { Button, Input, openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import ImageUpload, { type FolderType } from "@/components/ui/ImageUpload";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SECTION_TYPES,
  SECTION_TYPE_LABELS,
  SECTION_TYPE_SHORT_LABELS,
  createSection,
  type ContentSection,
  type SectionType,
} from "@/lib/content/structuredSections";

type StructuredContentEditorProps = {
  sections: ContentSection[];
  onSectionsChange: (sections: ContentSection[]) => void;
  allowedTypes?: SectionType[];
  defaultType?: SectionType;
  mediaFolderType?: FolderType;
  minSections?: number;
  showMedia?: boolean;
  showButtons?: boolean;
  className?: string;
};

export function StructuredContentEditor({
  sections,
  onSectionsChange,
  allowedTypes = SECTION_TYPES,
  defaultType,
  mediaFolderType = "banner",
  minSections = 1,
  showMedia = true,
  showButtons = true,
  className,
}: StructuredContentEditorProps) {
  const availableTypes = allowedTypes.length > 0 ? allowedTypes : SECTION_TYPES;
  const [newSectionType, setNewSectionType] = useState<SectionType>(
    defaultType ?? availableTypes[0] ?? "TEXT"
  );

  const addSection = () => {
    onSectionsChange([...sections, createSection(newSectionType)]);
  };

  const moveSection = (id: string, direction: "up" | "down") => {
    const index = sections.findIndex((section) => section.id === id);
    if (index < 0) return;

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sections.length) return;

    const next = [...sections];
    const item = next[index];
    if (!item) return;
    next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onSectionsChange(next);
  };

  const updateSection = (id: string, patch: Partial<ContentSection>) => {
    onSectionsChange(
      sections.map((section) => (section.id === id ? { ...section, ...patch } : section))
    );
  };

  const removeSection = (id: string) => {
    if (sections.length <= minSections) return;
    onSectionsChange(sections.filter((section) => section.id !== id));
  };

  return (
    <div className={cn("rounded-ds-md border border-ds-border-subtle p-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ds-text-primary">Structured Sections</p>
        <div className="flex items-center gap-2">
          <select
            className="rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-1.5 text-sm"
            value={newSectionType}
            aria-label="New section type"
            title="New section type"
            onChange={(event) => setNewSectionType(event.target.value as SectionType)}
          >
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {SECTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <Button type="button" variant="secondary" onClick={addSection}>
            <Plus className="mr-1 h-4 w-4" />
            Add Section
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="rounded-ds-md border border-ds-border-base bg-ds-surface-sunken p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-ds-text-primary">
                <GripVertical className="h-4 w-4 text-ds-text-tertiary" />
                <span>
                  Section {index + 1} · {SECTION_TYPE_SHORT_LABELS[section.type]}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveSection(section.id, "up")}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveSection(section.id, "down")}
                  disabled={index === sections.length - 1}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    openActionConfirm(ActionConfirmPresets.remove("section"), () =>
                      removeSection(section.id)
                    )
                  }
                  disabled={sections.length <= minSections}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Heading"
                value={section.heading}
                onChange={(event) => updateSection(section.id, { heading: event.target.value })}
                placeholder="Section heading"
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                  Section Type
                </label>
                <select
                  className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-sm"
                  value={section.type}
                  aria-label="Section type"
                  title="Section type"
                  onChange={(event) =>
                    updateSection(section.id, { type: event.target.value as SectionType })
                  }
                >
                  {availableTypes.map((type) => (
                    <option key={type} value={type}>
                      {SECTION_TYPE_SHORT_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                  Content
                </label>
                <textarea
                  className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base p-2 text-sm"
                  rows={section.type === "QUOTE" ? 3 : 4}
                  value={section.content}
                  onChange={(event) => updateSection(section.id, { content: event.target.value })}
                  placeholder={
                    section.type === "QUOTE"
                      ? "Write the quote text"
                      : "Write section content"
                  }
                />
              </div>

              {section.type === "LIST" ? (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                    List Items
                  </label>
                  <textarea
                    className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base p-2 text-sm"
                    rows={4}
                    value={section.items.join("\n")}
                    onChange={(event) =>
                      updateSection(section.id, { items: event.target.value.split("\n") })
                    }
                    placeholder={"One item per line\nAnother item"}
                  />
                  <p className="mt-1 text-xs text-ds-text-tertiary">One item per line.</p>
                </div>
              ) : null}

              {section.type === "QUOTE" ? (
                <div className="md:col-span-2">
                  <Input
                    label="Attribution (Optional)"
                    value={section.attribution}
                    onChange={(event) =>
                      updateSection(section.id, { attribution: event.target.value })
                    }
                    placeholder="Who said it (e.g. Proverbs 3:5)"
                  />
                </div>
              ) : null}

              {showMedia ? (
                <div className="md:col-span-2 rounded-ds-md border border-ds-border-subtle bg-ds-surface-base p-3">
                  <p className="mb-2 text-sm font-medium text-ds-text-secondary">Section Media</p>
                  <ImageUpload
                    folderType={mediaFolderType}
                    valueUrl={section.mediaUrl}
                    helpText="Upload image via managed uploader. This URL is stored in section metadata and generated HTML."
                    onUploaded={(result) =>
                      updateSection(section.id, {
                        mediaUrl: result.cacheBustedUrl || result.url,
                      })
                    }
                  />
                  {section.mediaUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateSection(section.id, { mediaUrl: "" })}
                    >
                      Remove media
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {showButtons ? (
                <>
                  <Input
                    label="Button Label (Optional)"
                    value={section.buttonLabel || ""}
                    onChange={(event) =>
                      updateSection(section.id, { buttonLabel: event.target.value })
                    }
                    placeholder="Learn more"
                  />
                  <Input
                    label="Button URL (Optional)"
                    value={section.buttonUrl || ""}
                    onChange={(event) =>
                      updateSection(section.id, { buttonUrl: event.target.value })
                    }
                    placeholder="/products"
                  />
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
