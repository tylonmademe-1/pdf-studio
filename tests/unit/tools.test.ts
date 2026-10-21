import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  TOOLS,
  CATEGORIES,
  getAllTools,
  getToolBySlug,
  getToolsByCategory,
  searchTools,
} from "../../config/tools";

describe("Tool Registry & Catalog Verification", () => {
  test("Catalog contains full suite of 54 tools including Video & Photo Tool", () => {
    assert.equal(TOOLS.length, 54);
    assert.equal(getAllTools().length, 54);
    const slugs = TOOLS.map((t) => t.slug);
    const coreSlugs = [
      "merge-pdf",
      "split-pdf",
      "rotate-pdf",
      "remove-pages",
      "extract-pages",
      "reorder-pages",
      "scale-pdf",
      "auto-split",
      "auto-rotate",
      "remove-blank-pages",
      "add-blank-pages",
      "add-page-numbers",
      "crop-pdf",
      "pdf-to-word",
      "word-to-pdf",
      "pdf-to-excel",
      "excel-to-pdf",
      "pdf-to-powerpoint",
      "powerpoint-to-pdf",
      "image-to-pdf",
      "pdf-to-image",
      "pdf-to-text",
      "text-to-pdf",
      "markdown-to-pdf",
      "html-to-pdf",
      "url-to-pdf",
      "pdf-to-pdfa",
      "extract-images",
      "compress-pdf",
      "repair-pdf",
      "flatten-pdf",
      "sanitize-pdf",
      "color-to-grayscale",
      "remove-annotations",
      "edit-metadata",
      "auto-rename",
      "add-password",
      "remove-password",
      "change-permissions",
      "add-watermark",
      "auto-redact",
      "manual-redact",
      "sign-pdf",
      "certify-pdf",
      "verify-signature",
      "sanitize-javascript",
      "ocr-pdf",
      "compare-pdf",
      "extract-text",
      "extract-tables",
      "count-pages",
      "video-downloader",
      "photo-tool",
    ];
    for (const slug of coreSlugs) {
      assert.ok(slugs.includes(slug), `Missing expected tool: ${slug}`);
    }
  });

  test("Categories are defined in exact required order", () => {
    assert.equal(CATEGORIES.length, 6);
    const categoryIds = CATEGORIES.map((c) => c.id);
    const expectedCategoryIds = [
      "organize",
      "convert",
      "optimize",
      "security",
      "ocr",
      "video",
    ];
    assert.deepEqual(categoryIds, expectedCategoryIds);
  });

  test("Every tool has valid metadata and planned status", () => {
    for (const tool of TOOLS) {
      assert.ok(tool.id, `Tool missing id: ${tool.slug}`);
      assert.ok(tool.name, `Tool missing name: ${tool.slug}`);
      assert.ok(tool.description, `Tool missing description: ${tool.slug}`);
      assert.ok(tool.iconName, `Tool missing iconName: ${tool.slug}`);
      assert.ok(
        tool.route.startsWith("/tools/"),
        `Tool has invalid route: ${tool.route}`
      );
      assert.ok(
        tool.acceptedFileTypes.length > 0,
        `Tool missing file types: ${tool.slug}`
      );
      assert.equal(
        tool.status,
        "ready",
        `Tool status must be ready: ${tool.slug}`
      );
    }
  });

  test("getToolBySlug retrieves matching tools or returns undefined", () => {
    const merge = getToolBySlug("merge-pdf");
    assert.ok(merge);
    assert.equal(merge.name, "Merge PDF");
    assert.equal(merge.supportsMultipleFiles, true);

    const nonExistent = getToolBySlug("invalid-slug-123");
    assert.equal(nonExistent, undefined);
  });

  test("getToolsByCategory groups tools correctly", () => {
    const organize = getToolsByCategory("organize");
    assert.equal(organize.length, 14);

    const convert = getToolsByCategory("convert");
    assert.equal(convert.length, 16);

    const optimize = getToolsByCategory("optimize");
    assert.equal(optimize.length, 8);

    const security = getToolsByCategory("security");
    assert.equal(security.length, 10);

    const ocr = getToolsByCategory("ocr");
    assert.equal(ocr.length, 5);

    const video = getToolsByCategory("video");
    assert.equal(video.length, 1);
  });

  test("searchTools filters accurately with trimming and case-insensitivity", () => {
    // Exact match
    const mergeResult = searchTools("merge");
    assert.ok(mergeResult.some((t) => t.slug === "merge-pdf"));

    // Case insensitivity
    const ocrResult = searchTools("  OCR  ");
    assert.ok(ocrResult.some((t) => t.slug === "ocr-pdf"));

    // Description match
    const wordResult = searchTools("word");
    assert.ok(wordResult.some((t) => t.slug === "pdf-to-word"));

    // Category match
    const secResult = searchTools("security");
    assert.ok(secResult.some((t) => t.slug === "add-password"));

    const vidResult = searchTools("video");
    assert.ok(vidResult.some((t) => t.slug === "video-downloader"));

    const photoResult = searchTools("photo");
    assert.ok(photoResult.some((t) => t.slug === "photo-tool"));

    // Empty query returns all tools
    const all = searchTools("   ");
    assert.equal(all.length, 54);

    // No match
    const emptyResult = searchTools("nonexistent-tool-query-xyz");
    assert.equal(emptyResult.length, 0);
  });
});
