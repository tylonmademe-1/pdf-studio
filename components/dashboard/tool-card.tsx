import * as React from "react";
import Link from "next/link";
import { ToolDefinition } from "@/types/tool";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  tool: ToolDefinition;
  className?: string;
}

export function getToolBadgeToken(slug: string): string {
  const map: Record<string, string> = {
    "merge-pdf": "MERGE",
    "split-pdf": "SPLIT",
    "rotate-pdf": "ROTATE",
    "remove-pages": "CULL",
    "extract-pages": "EXTRACT",
    "reorder-pages": "REORDER",
    "multi-page-layout": "N-UP",
    "crop-pdf": "CROP",
    "scale-pdf": "SCALE",
    "auto-split": "AUTO_SPLIT",
    "auto-rotate": "ORIENT",
    "remove-blank-pages": "PURGE_BLANK",
    "add-blank-pages": "ADD_BLANK",
    "add-page-numbers": "NUMBERS",

    "pdf-to-word": "DOCX",
    "word-to-pdf": "PDF",
    "pdf-to-excel": "XLSX",
    "excel-to-pdf": "PDF",
    "pdf-to-powerpoint": "PPTX",
    "powerpoint-to-pdf": "PDF",
    "image-to-pdf": "IMAGE",
    "pdf-to-image": "IMG_DUMP",
    "pdf-to-text": "TXT",
    "text-to-pdf": "TXT_TO_PDF",
    "markdown-to-pdf": "MARKDOWN",
    "html-to-pdf": "HTML",
    "url-to-pdf": "URL",
    "pdf-to-pdfa": "ARCHIVE",
    "extract-images": "EXTRACT_IMG",
    "photo-tool": "PHOTO",
    "passport-photo": "PHOTO",

    "compress-pdf": "COMPRESS",
    "repair-pdf": "REPAIR",
    "flatten-pdf": "FLATTEN",
    "sanitize-pdf": "SANITIZE",
    "color-to-grayscale": "MONO",
    "remove-annotations": "REMOVE_ANN",
    "edit-metadata": "INFO_DICT",
    "auto-rename": "RENAME",

    "add-password": "ENCRYPT",
    "remove-password": "DECRYPT",
    "change-permissions": "PERMS",
    "add-watermark": "WATERMARK",
    "auto-redact": "REDACT",
    "manual-redact": "MANUAL_REDACT",
    "sign-pdf": "SIGN",
    "certify-pdf": "CERTIFY",
    "verify-signature": "VERIFY",
    "sanitize-javascript": "DE-SCRIPT",

    "ocr-pdf": "OCR",
    "compare-pdf": "DIFF",
    "extract-text": "DUMP",
    "extract-tables": "TABULATE",
    "count-pages": "INSPECT",

    "video-downloader": "YT_DLP",
  };
  return map[slug] || slug.toUpperCase().slice(0, 10);
}

export function ToolCard({ tool, className }: ToolCardProps) {
  const badgeToken = getToolBadgeToken(tool.slug || tool.id);

  return (
    <Link
      href={tool.route}
      prefetch={false}
      data-purpose="tool-card"
      className={cn(
        "tool-card-interactive group relative flex flex-col justify-between p-3.5 bg-canvas hairline-all overflow-hidden cursor-pointer",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs font-bold text-ink">
            {badgeToken}
          </span>
          <span className="card-arrow font-mono text-xs text-stone opacity-0 transition-all duration-200">
            →
          </span>
        </div>
        <h3 className="font-mono text-xs font-bold text-ink group-hover:underline">
          {tool.name}
        </h3>
        <p className="mt-1 font-code text-xs text-body leading-normal">
          {tool.description}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-hairline/60 flex items-center justify-between text-[10px] font-mono text-body font-medium">
        <span>{tool.supportsMultipleFiles ? "MULTI" : "ATOMIC"}</span>
        <span>{tool.acceptedFileTypes[0]}</span>
      </div>
    </Link>
  );
}
