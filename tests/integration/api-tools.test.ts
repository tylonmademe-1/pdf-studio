import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { stirlingClient } from "../../lib/stirling/client";
import { StirlingValidationError } from "../../lib/stirling/errors";

// Helper to create a valid minimal PDF buffer for testing
async function createTestPdf(pageCount = 1, text = "Test PDF Page"): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([400, 600]);
    page.drawText(`${text} - ${i + 1}`, { x: 50, y: 500 });
  }
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

describe("End-to-End PDF Operations & Tool Integration", () => {
  test("Merge PDF: combines multiple PDFs and preserves page sequence", async () => {
    const pdf1 = await createTestPdf(2, "Document A");
    const pdf2 = await createTestPdf(3, "Document B");

    const result = await stirlingClient.executeTool("merge-pdf", [
      { name: "docA.pdf", size: pdf1.length, type: "application/pdf", buffer: pdf1 },
      { name: "docB.pdf", size: pdf2.length, type: "application/pdf", buffer: pdf2 },
    ]);

    assert.ok(result.buffer);
    assert.equal(result.mimeType, "application/pdf");
    assert.ok(result.filename.endsWith(".pdf"));

    // Verify resulting PDF is valid and has 2 + 3 = 5 pages
    const parsed = await PDFDocument.load(result.buffer);
    assert.equal(parsed.getPageCount(), 5);
  });

  test("Rotate PDF: adjusts orientation by 90 degrees", async () => {
    const originalPdf = await createTestPdf(1, "Rotate Test");

    const result = await stirlingClient.executeTool(
      "rotate-pdf",
      [{ name: "rotate-test.pdf", size: originalPdf.length, type: "application/pdf", buffer: originalPdf }],
      { angle: 90 }
    );

    assert.ok(result.buffer);
    const parsed = await PDFDocument.load(result.buffer);
    const page = parsed.getPage(0);
    assert.equal(page.getRotation().angle, 90);
  });

  test("Split PDF: extracts specified page range", async () => {
    const multiPagePdf = await createTestPdf(4, "Multi-page Doc");

    const result = await stirlingClient.executeTool(
      "split-pdf",
      [{ name: "split-test.pdf", size: multiPagePdf.length, type: "application/pdf", buffer: multiPagePdf }],
      { pages: "1-2" }
    );

    assert.ok(result.buffer);
    const parsed = await PDFDocument.load(result.buffer);
    assert.equal(parsed.getPageCount(), 2);
  });

  test("Compress PDF: processes and produces valid output", async () => {
    const doc = await createTestPdf(3, "Compress Test");

    const result = await stirlingClient.executeTool(
      "compress-pdf",
      [{ name: "compress-test.pdf", size: doc.length, type: "application/pdf", buffer: doc }],
      { optimizeLevel: 2 }
    );

    assert.ok(result.buffer);
    const parsed = await PDFDocument.load(result.buffer);
    assert.equal(parsed.getPageCount(), 3);
  });

  test("Remove Pages: deletes targeted pages and returns trimmed PDF", async () => {
    const doc = await createTestPdf(4, "Trim Test");
    const result = await stirlingClient.executeTool(
      "remove-pages",
      [{ name: "doc.pdf", size: doc.length, type: "application/pdf", buffer: doc }],
      { pages: "2, 4" }
    );
    assert.ok(result.buffer);
    const parsed = await PDFDocument.load(result.buffer);
    assert.equal(parsed.getPageCount(), 2);
  });

  test("Add Watermark: stamps custom text across pages", async () => {
    const doc = await createTestPdf(2, "Watermark Test");
    const result = await stirlingClient.executeTool(
      "add-watermark",
      [{ name: "doc.pdf", size: doc.length, type: "application/pdf", buffer: doc }],
      { watermarkText: "CONFIDENTIAL", opacity: 0.5 }
    );
    assert.ok(result.buffer);
    const parsed = await PDFDocument.load(result.buffer);
    assert.equal(parsed.getPageCount(), 2);
  });

  test("Add Page Numbers: inserts pagination onto document pages", async () => {
    const doc = await createTestPdf(3, "Pagination Test");
    const result = await stirlingClient.executeTool(
      "add-page-numbers",
      [{ name: "doc.pdf", size: doc.length, type: "application/pdf", buffer: doc }],
      { customText: "Page {n} of {total}" }
    );
    assert.ok(result.buffer);
    const parsed = await PDFDocument.load(result.buffer);
    assert.equal(parsed.getPageCount(), 3);
  });

  test("Scale PDF: adjusts page bounds to targeted standard format", async () => {
    const doc = await createTestPdf(1, "Scale Test");
    const result = await stirlingClient.executeTool(
      "scale-pdf",
      [{ name: "doc.pdf", size: doc.length, type: "application/pdf", buffer: doc }],
      { pageSize: "A4" }
    );
    assert.ok(result.buffer);
    const parsed = await PDFDocument.load(result.buffer);
    const page = parsed.getPage(0);
    const { width, height } = page.getSize();
    assert.ok(Math.abs(width - 595.28) < 1);
    assert.ok(Math.abs(height - 841.89) < 1);
  });

  test("Sign PDF: applies legal signature verification stamp", async () => {
    const doc = await createTestPdf(2, "Sign Test");
    const result = await stirlingClient.executeTool(
      "sign-pdf",
      [{ name: "doc.pdf", size: doc.length, type: "application/pdf", buffer: doc }],
      { signatoryName: "John Architect", reason: "Approved and verified" }
    );
    assert.ok(result.buffer);
    const parsed = await PDFDocument.load(result.buffer);
    assert.equal(parsed.getPageCount(), 2);
  });

  test("Sanitize, Flatten, and Repair operations complete successfully", async () => {
    const doc = await createTestPdf(1, "Maintenance Doc");

    const sanitized = await stirlingClient.executeTool("sanitize-pdf", [
      { name: "doc.pdf", size: doc.length, type: "application/pdf", buffer: doc },
    ]);
    assert.ok(sanitized.buffer);

    const flattened = await stirlingClient.executeTool("flatten-pdf", [
      { name: "doc.pdf", size: doc.length, type: "application/pdf", buffer: doc },
    ]);
    assert.ok(flattened.buffer);

    const repaired = await stirlingClient.executeTool("repair-pdf", [
      { name: "doc.pdf", size: doc.length, type: "application/pdf", buffer: doc },
    ]);
    assert.ok(repaired.buffer);
  });

  test("Crop PDF: trims margins and produces cropped document", async () => {
    const doc = await createTestPdf(1, "Crop Test");
    const result = await stirlingClient.executeTool(
      "crop-pdf",
      [{ name: "doc.pdf", size: doc.length, type: "application/pdf", buffer: doc }],
      { top: 20, bottom: 20, left: 15, right: 15 }
    );
    assert.ok(result.buffer);
    const parsed = await PDFDocument.load(result.buffer);
    assert.equal(parsed.getPageCount(), 1);
  });

  test("Auto-Redact: validates regex pattern and applies redaction", async () => {
    const doc = await createTestPdf(1, "Confidential SSN: 123-45-6789");
    const result = await stirlingClient.executeTool(
      "auto-redact",
      [{ name: "doc.pdf", size: doc.length, type: "application/pdf", buffer: doc }],
      { useRegEx: true, regex: "\\d{3}-\\d{2}-\\d{4}" }
    );
    assert.ok(result.buffer);

    // Reject invalid regex syntax gracefully
    await assert.rejects(
      async () => {
        await stirlingClient.executeTool(
          "auto-redact",
          [{ name: "doc.pdf", size: doc.length, type: "application/pdf", buffer: doc }],
          { useRegEx: true, regex: "[unclosed-bracket(" }
        );
      },
      (err: unknown) => err instanceof StirlingValidationError
    );
  });

  test("PDF to Excel: generates spreadsheet output with verified MIME type", async () => {
    const doc = await createTestPdf(1, "Financial Table Q3");
    const result = await stirlingClient.executeTool("pdf-to-excel", [
      { name: "financials.pdf", size: doc.length, type: "application/pdf", buffer: doc },
    ]);
    assert.ok(result.buffer);
    assert.equal(
      result.mimeType,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    assert.ok(result.filename.endsWith(".xlsx"));
  });

  test("Sign PDF: dual-slot supports PDF + .p12 certificate keystore", async () => {
    const doc = await createTestPdf(1, "Agreement Document");
    const certMock = Buffer.from("mock-p12-certificate-binary-content");

    const result = await stirlingClient.executeTool(
      "sign-pdf",
      [
        { name: "agreement.pdf", size: doc.length, type: "application/pdf", buffer: doc, fieldName: "fileInput" },
        { name: "cert.p12", size: certMock.length, type: "application/x-pkcs12", buffer: certMock, fieldName: "certFile" },
      ],
      { certPassword: "test-password-123" }
    );
    assert.ok(result.buffer);
    const parsed = await PDFDocument.load(result.buffer);
    assert.equal(parsed.getPageCount(), 1);
  });

  test("Validation: rejects empty file list", async () => {
    await assert.rejects(
      async () => {
        await stirlingClient.executeTool("merge-pdf", []);
      },
      (err: unknown) => err instanceof StirlingValidationError
    );
  });

  test("Validation: rejects multi-file submission on single-file tools", async () => {
    const pdf1 = await createTestPdf(1);
    const pdf2 = await createTestPdf(1);

    await assert.rejects(
      async () => {
        await stirlingClient.executeTool("rotate-pdf", [
          { name: "1.pdf", size: pdf1.length, type: "application/pdf", buffer: pdf1 },
          { name: "2.pdf", size: pdf2.length, type: "application/pdf", buffer: pdf2 },
        ]);
      },
      (err: unknown) => err instanceof StirlingValidationError
    );
  });
});

