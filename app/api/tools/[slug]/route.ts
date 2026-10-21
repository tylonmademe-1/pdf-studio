import { NextRequest, NextResponse } from "next/server";
import { stirlingClient, InputUploadFile } from "@/lib/stirling/client";
import { validateToolParams } from "@/lib/stirling/schemas";
import { normalizeError, StirlingValidationError } from "@/lib/stirling/errors";
import { getToolBySlug } from "@/config/tools";
import { getCurrentUser } from "@/lib/auth/session";
import { recordHistory } from "@/lib/db";

// Support extended execution windows for heavy conversions like PDF to Excel and OCR
export const maxDuration = 180;

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return NextResponse.json(
      { error: "Invalid tool identifier", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new StirlingValidationError(
        "Request must be submitted as multipart/form-data."
      );
    }

    const formData = await req.formData();
    const files: InputUploadFile[] = [];
    const rawParams: Record<string, unknown> = {};

    // Extract files and parameters
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (value.size > 0) {
          const arrayBuffer = await value.arrayBuffer();
          const isPkcs12 = value.name.endsWith(".p12") || value.name.endsWith(".pfx");
          const mimeType = isPkcs12
            ? "application/x-pkcs12"
            : value.type || "application/octet-stream";

          files.push({
            name: value.name,
            size: value.size,
            type: mimeType,
            buffer: Buffer.from(arrayBuffer),
            fieldName: key,
          });
        }
      } else {
        // Collect repeated form fields as array (e.g. repeated 'words' for auto-redact)
        if (rawParams[key] !== undefined) {
          if (Array.isArray(rawParams[key])) {
            (rawParams[key] as unknown[]).push(value);
          } else {
            rawParams[key] = [rawParams[key], value];
          }
        } else {
          rawParams[key] = value;
        }
      }
    }

    if (files.length === 0) {
      throw new StirlingValidationError("Please select at least one valid file to process.");
    }

    // Validate parameters with tool-specific Zod schema
    const validatedParams = validateToolParams(slug, rawParams);

    // Execute processing via Stirling-PDF / native fallback
    const result = await stirlingClient.executeTool(
      slug,
      files,
      validatedParams as Record<string, unknown>
    );

    // Save history metadata for authenticated users (metadata only, no file storage)
    const currentUser = await getCurrentUser().catch(() => null);
    if (currentUser) {
      await recordHistory(currentUser.id, {
        toolSlug: tool.slug,
        toolName: tool.name,
        originalFilename: files.map((f) => f.name).join(", "),
        outputFilename: result.filename,
        status: "completed",
        fileSize: files.reduce((acc, f) => acc + f.size, 0),
        outputSize: result.outputSize,
        engine: result.engine,
      }).catch((err) => console.error("Failed to record history:", err));
    }

    // Return binary response with sanitized headers
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Content-Length": String(result.buffer.length),
        "X-Processing-Engine": result.engine,
      },
    });
  } catch (err: unknown) {
    const normalized = normalizeError(err);

    // If authenticated user failed, record failed status metadata
    try {
      const currentUser = await getCurrentUser().catch(() => null);
      if (currentUser) {
        await recordHistory(currentUser.id, {
          toolSlug: tool.slug,
          toolName: tool.name,
          originalFilename: "Uploaded File",
          outputFilename: "N/A",
          status: "failed",
          fileSize: 0,
        });
      }
    } catch {
      // Ignore history write errors on failure
    }

    return NextResponse.json(
      {
        error: normalized.message,
        code: normalized.code,
      },
      { status: normalized.statusCode }
    );
  }
}
