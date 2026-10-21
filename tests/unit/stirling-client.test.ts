import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { STIRLING_ENDPOINTS, getToolEndpointConfig } from "../../lib/stirling/endpoints";
import { sanitizeFilename, extractFilenameFromHeader } from "../../lib/stirling/download";
import { validateToolParams, SplitPdfSchema, RotatePdfSchema, AddPasswordSchema } from "../../lib/stirling/schemas";
import {
  normalizeError,
  StirlingValidationError,
  StirlingConnectionError,
  StirlingTimeoutError,
} from "../../lib/stirling/errors";

describe("Stirling Client & Integration Specifications", () => {
  test("All 52 tools have registered Stirling-PDF endpoint configurations", () => {
    assert.equal(Object.keys(STIRLING_ENDPOINTS).length, 52);

    for (const slug of Object.keys(STIRLING_ENDPOINTS)) {
      const retrieved = getToolEndpointConfig(slug);
      assert.ok(retrieved, `Missing config for tool: ${slug}`);
      assert.equal(retrieved.method, "POST");
      assert.equal(retrieved.fileFieldName, "fileInput");
      assert.ok(retrieved.endpoint.startsWith("/api/v1/"));
      assert.ok(retrieved.timeoutMs > 0);
    }
  });

  test("Filename sanitization prevents path traversal and illegal characters", () => {
    // Path traversal
    assert.equal(sanitizeFilename("../../etc/passwd"), "passwd");
    assert.equal(sanitizeFilename("..\\..\\windows\\system32\\cmd.exe"), "cmd.exe");

    // Illegal characters (< > : " / \ | ? *)
    const illegal = 'report<2026>:final"version?.pdf';
    const sanitized = sanitizeFilename(illegal);
    assert.ok(!/[<>:"/\\|?*]/.test(sanitized));

    // Empty or dot fallback
    assert.equal(sanitizeFilename(""), "document.pdf");
    assert.equal(sanitizeFilename("."), "document.pdf");
    assert.equal(sanitizeFilename(".."), "document.pdf");
  });

  test("extractFilenameFromHeader parses standard and UTF-8 content-disposition", () => {
    const standardHeader = 'attachment; filename="annual_report_2026.pdf"';
    assert.equal(
      extractFilenameFromHeader(standardHeader, "fallback.pdf"),
      "annual_report_2026.pdf"
    );

    const utf8Header = "attachment; filename*=UTF-8''my%20document%202026.pdf";
    assert.equal(
      extractFilenameFromHeader(utf8Header, "fallback.pdf"),
      "my document 2026.pdf"
    );

    assert.equal(extractFilenameFromHeader(null, "fallback.pdf"), "fallback.pdf");
  });

  test("Parameter validation schemas enforce constraints", () => {
    // Split PDF syntax
    assert.ok(SplitPdfSchema.parse({ pages: "1-3, 5" }));
    assert.ok(SplitPdfSchema.parse({ pages: "all" }));
    assert.throws(() => SplitPdfSchema.parse({ pages: "invalid;injection" }));
    assert.throws(() => SplitPdfSchema.parse({ pages: "" }));

    // Rotate PDF angle
    assert.equal(RotatePdfSchema.parse({ angle: "90" }).angle, 90);
    assert.equal(RotatePdfSchema.parse({ angle: 180 }).angle, 180);
    assert.throws(() => RotatePdfSchema.parse({ angle: 45 }));

    // Add Password
    assert.ok(AddPasswordSchema.parse({ password: "secretPassword123" }));
    assert.throws(() => AddPasswordSchema.parse({ password: "" }));

    // validateToolParams helper
    const validated = validateToolParams("rotate-pdf", { angle: "90" });
    assert.deepEqual(validated, { angle: 90 });
  });

  test("Error normalizer returns structured, safe messages without leaking internals", () => {
    const validationErr = new StirlingValidationError("Invalid input");
    const normVal = normalizeError(validationErr);
    assert.equal(normVal.statusCode, 400);
    assert.equal(normVal.code, "VALIDATION_ERROR");

    const connErr = new StirlingConnectionError("Refused");
    const normConn = normalizeError(connErr);
    assert.equal(normConn.statusCode, 503);
    assert.equal(normConn.code, "BACKEND_UNAVAILABLE");

    const timeoutErr = new StirlingTimeoutError("Timed out");
    const normTimeout = normalizeError(timeoutErr);
    assert.equal(normTimeout.statusCode, 504);
    assert.equal(normTimeout.code, "GATEWAY_TIMEOUT");

    // Generic unknown error
    const normGeneric = normalizeError(new Error("Secret DB path /var/lib/secret/key"));
    assert.equal(normGeneric.statusCode, 500);
    assert.ok(!normGeneric.message.includes("/var/lib/secret"));
  });
});
