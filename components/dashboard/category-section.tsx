import * as React from "react";
import { CategoryDefinition, ToolDefinition } from "@/types/tool";
import { ToolCard } from "./tool-card";

interface CategorySectionProps {
  category: CategoryDefinition;
  tools: ToolDefinition[];
}

const CATEGORY_META: Record<
  string,
  { index: string; title: string; subtitle: string }
> = {
  organize: {
    index: "[01]",
    title: "ORGANIZE // PAGES & LAYOUT",
    subtitle: "Concatenate, slice, orient, rearrange and cull page frames.",
  },
  convert: {
    index: "[02]",
    title: "CONVERT // FORMAT TRANSCODING",
    subtitle: "Bi-directional transcode between PDF container and office, markup, and image formats.",
  },
  optimize: {
    index: "[03]",
    title: "OPTIMIZE // COMPRESSION & SANITIZE",
    subtitle: "Streamline stream dictionaries, downsample assets, flatten forms, and strip metadata.",
  },
  security: {
    index: "[04]",
    title: "SECURITY // CRYPTOGRAPHY & PERMISSIONS",
    subtitle: "Hardware-accelerated AES-256 encryption, redaction sanitization, and cryptographic signing.",
  },
  ocr: {
    index: "[05]",
    title: "OCR & INTELLIGENCE // PARSING",
    subtitle: "Extract raw text, infer table boundaries, and run side-by-side AST document diffs.",
  },
  video: {
    index: "[06]",
    title: "VIDEO // MEDIA & STREAM EXTRACTION",
    subtitle: "High-speed video acquisition, audio extraction, and DASH stream merging via yt-dlp.",
  },
};

export function CategorySection({ category, tools }: CategorySectionProps) {
  if (tools.length === 0) return null;

  const meta = CATEGORY_META[category.id] || {
    index: "[--]",
    title: category.name.toUpperCase(),
    subtitle: category.description,
  };

  return (
    <section
      id={category.id}
      className="scroll-mt-32 space-y-3"
      data-purpose="tool-category-group"
    >
      <div className="flex items-baseline justify-between hairline-b pb-2">
        <div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-xs text-body font-bold">{meta.index}</span>
            <h2 className="text-sm font-bold tracking-tight text-ink uppercase">
              {meta.title}
            </h2>
            <span
              className="px-1.5 py-0.5 hairline-all text-[10px] text-body font-medium bg-surface font-mono"
              style={{ borderRadius: "4px" }}
            >
              {tools.length} OPS
            </span>
          </div>
          <p className="font-code text-xs text-body mt-0.5">{meta.subtitle}</p>
        </div>
      </div>

      {/* 4 Column Grid of Hairline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
