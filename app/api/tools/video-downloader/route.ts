import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import {
  getVideoMetadata,
  downloadMedia,
  isValidMediaUrl,
  MediaFormatChoice,
} from "@/lib/ytdlp/runner";

export const maxDuration = 300; // Allow up to 5 minutes for video encoding and merging

/**
 * GET: Inspect video URL metadata (title, duration, thumbnail, uploader)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl || !isValidMediaUrl(targetUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid, public HTTP or HTTPS media URL is required.",
        },
        { status: 400 }
      );
    }

    const metadata = await getVideoMetadata(targetUrl);

    return NextResponse.json(
      {
        success: true,
        metadata,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch video information.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Download media file according to requested format
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetUrl = body.url;
    const formatChoice = (body.format || "best") as MediaFormatChoice;

    if (!targetUrl || !isValidMediaUrl(targetUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid, public HTTP or HTTPS media URL is required.",
        },
        { status: 400 }
      );
    }

    const validFormats: MediaFormatChoice[] = [
      "best",
      "1080p",
      "720p",
      "480p",
      "mp3",
      "m4a",
    ];
    const resolvedFormat: MediaFormatChoice = validFormats.includes(formatChoice)
      ? formatChoice
      : "best";

    const result = await downloadMedia(targetUrl, resolvedFormat);

    try {
      const fileBuffer = await fs.promises.readFile(result.filePath);

      const safeAsciiName = result.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const encodedName = encodeURIComponent(result.fileName);

      const headers = new Headers();
      headers.set("Content-Type", result.mimeType);
      headers.set("Content-Length", result.size.toString());
      headers.set(
        "Content-Disposition",
        `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`
      );
      headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
    } finally {
      await result.cleanup();
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to download media file.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
