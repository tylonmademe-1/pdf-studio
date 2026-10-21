import { z } from "zod";

const REGEX_SPLIT_PAGES = /^[0-9,\s\-all]+$/i;
const REGEX_REMOVE_PAGES = /^[0-9,\s\-]+$/;

export const SplitPdfSchema = z.object({
  pages: z
    .string()
    .min(1, "Page range or page numbers are required (e.g. 1-3, 5)")
    .regex(REGEX_SPLIT_PAGES, "Invalid page syntax. Use numbers, dashes, and commas (e.g. '1-3, 5')"),
});

export const RotatePdfSchema = z.object({
  angle: z.coerce
    .number()
    .refine((val) => [90, 180, 270].includes(val), "Angle must be 90, 180, or 270 degrees")
    .default(90),
});

export const ImageToPdfSchema = z.object({
  fitOption: z
    .enum(["maintainAspectRatio", "fillPage", "fitPage"])
    .default("maintainAspectRatio"),
});

export const CompressPdfSchema = z.object({
  optimizeLevel: z.coerce.number().min(1).max(3).default(2),
});

export const AddPasswordSchema = z.object({
  password: z.string().min(1, "Password cannot be empty"),
  keyLength: z.coerce.number().refine((val) => [128, 256].includes(val)).default(256),
});

export const OcrPdfSchema = z.object({
  languages: z.string().min(2, "At least one language code is required (e.g. 'eng')").default("eng"),
  sidecar: z.coerce.boolean().default(false),
});

export const WatermarkPdfSchema = z.object({
  watermarkText: z.string().min(1, "Watermark text cannot be empty").default("CONFIDENTIAL"),
  opacity: z.coerce.number().min(0.1).max(1.0).default(0.4),
});

export const PageNumbersSchema = z.object({
  customText: z.string().default("Page {n} of {total}"),
  position: z.enum(["bottom-center", "bottom-right"]).default("bottom-center"),
});

export const RemovePagesSchema = z.object({
  pages: z
    .string()
    .min(1, "Specify page numbers to remove (e.g. 2, 4-5)")
    .regex(REGEX_REMOVE_PAGES, "Invalid syntax. Use comma-separated numbers or ranges"),
});

export const ScalePdfSchema = z.object({
  pageSize: z.enum(["A4", "LETTER", "A3", "LEGAL"]).default("A4"),
});

export const AutoSplitSchema = z.object({
  pagesPerSplit: z.coerce.number().min(1).max(500).default(2),
});

export const SignPdfSchema = z.object({
  signatoryName: z.string().optional().default("Authorized Signatory"),
  reason: z.string().optional().default("Digitally verified and approved"),
  sigType: z.string().optional(),
  certPassword: z.string().optional(),
});

export const RedactPdfSchema = z.object({
  redactionText: z.string().optional().default("CONFIDENTIAL"),
  useRegEx: z.union([z.boolean(), z.string()]).optional(),
  regex: z.string().optional(),
  words: z.union([z.string(), z.array(z.string())]).optional(),
});

export function validateToolParams(slug: string, rawParams: Record<string, unknown>) {
  switch (slug) {
    case "split-pdf":
    case "extract-pages":
      return SplitPdfSchema.parse(rawParams);
    case "remove-pages":
      return RemovePagesSchema.parse(rawParams);
    case "rotate-pdf":
      return RotatePdfSchema.parse(rawParams);
    case "image-to-pdf":
      return ImageToPdfSchema.parse(rawParams);
    case "compress-pdf":
      return CompressPdfSchema.parse(rawParams);
    case "add-password":
      return AddPasswordSchema.parse(rawParams);
    case "ocr-pdf":
      return OcrPdfSchema.parse(rawParams);
    case "add-watermark":
      return WatermarkPdfSchema.parse(rawParams);
    case "add-page-numbers":
      return PageNumbersSchema.parse(rawParams);
    case "scale-pdf":
      return ScalePdfSchema.parse(rawParams);
    case "auto-split":
      return AutoSplitSchema.parse(rawParams);
    case "sign-pdf":
    case "certify-pdf":
      return SignPdfSchema.parse(rawParams);
    case "auto-redact":
    case "redact-pdf":
    case "manual-redact":
      return RedactPdfSchema.parse(rawParams);
    case "merge-pdf":
    case "pdf-to-word":
    case "pdf-to-image":
    case "pdf-to-text":
    case "markdown-to-pdf":
    case "html-to-pdf":
    case "pdf-to-pdfa":
    case "word-to-pdf":
    case "extract-images":
    case "repair-pdf":
    case "flatten-pdf":
    case "sanitize-pdf":
    case "grayscale-pdf":
    case "remove-password":
    case "reorder-pages":
    case "multi-page-layout":
    case "crop-pdf":
    case "auto-rotate":
    case "compare-pdf":
    default:
      return rawParams;
  }
}
