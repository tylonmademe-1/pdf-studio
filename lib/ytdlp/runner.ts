import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  uploader: string;
  uploaderUrl?: string;
  viewCount?: number;
  webpageUrl: string;
}

export type MediaFormatChoice =
  | "best"
  | "1080p"
  | "720p"
  | "480p"
  | "mp3"
  | "m4a";

export interface DownloadResult {
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
  cleanup: () => Promise<void>;
}

let cachedFfmpegPath: string | null = null;

/**
 * Locate the FFmpeg executable (static imageio-ffmpeg binary, environment variable, or system path).
 */
export function getFfmpegPath(): string | null {
  if (cachedFfmpegPath !== null) return cachedFfmpegPath;

  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    cachedFfmpegPath = process.env.FFMPEG_PATH;
    return cachedFfmpegPath;
  }

  try {
    const pythonExe = process.env.PYTHON_PATH || "python";
    const detected = execSync(
      `"${pythonExe}" -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"`,
      {
        encoding: "utf-8",
        timeout: 4000,
        stdio: ["ignore", "pipe", "ignore"],
      }
    ).trim();

    if (detected && fs.existsSync(detected)) {
      cachedFfmpegPath = detected;
      return cachedFfmpegPath;
    }
  } catch {
    // If not found via Python module, fallback to empty (let yt-dlp check system PATH)
  }

  cachedFfmpegPath = "";
  return cachedFfmpegPath || null;
}

/**
 * Validates whether the given string is a safe, valid HTTP/HTTPS media URL.
 * Protects against SSRF and local network access.
 */
export function isValidMediaUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;

  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const cleanHost = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

    // Guard against localhost, loopback, and local network ranges
    if (
      cleanHost === "localhost" ||
      cleanHost.endsWith(".localhost") ||
      cleanHost === "127.0.0.1" ||
      cleanHost === "0.0.0.0" ||
      cleanHost === "::1" ||
      cleanHost.startsWith("10.") ||
      cleanHost.startsWith("192.168.") ||
      cleanHost.startsWith("169.254.")
    ) {
      return false;
    }

    // Check 172.16.0.0 - 172.31.255.255
    if (cleanHost.startsWith("172.")) {
      const parts = cleanHost.split(".");
      if (parts.length >= 2) {
        const second = parseInt(parts[1], 10);
        if (second >= 16 && second <= 31) return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Formats duration in seconds to MM:SS or HH:MM:SS.
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const sec = Math.floor(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  const sStr = s < 10 ? `0${s}` : `${s}`;
  if (h > 0) {
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${h}:${mStr}:${sStr}`;
  }
  return `${m}:${sStr}`;
}

/**
 * Extract video metadata using `yt-dlp --dump-single-json`.
 */
export async function getVideoMetadata(
  url: string,
  signal?: AbortSignal
): Promise<VideoMetadata> {
  if (!isValidMediaUrl(url)) {
    throw new Error("Invalid or unsupported media URL.");
  }

  const pythonExe = process.env.PYTHON_PATH || "python";
  const args = [
    "-m",
    "yt_dlp",
    "--dump-single-json",
    "--no-playlist",
    "--skip-download",
    "--no-warnings",
    "--no-call-home",
    url.trim(),
  ];

  return new Promise<VideoMetadata>((resolve, reject) => {
    const child = spawn(/*turbopackIgnore: true*/ pythonExe, args, {
      windowsHide: true,
      signal,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to start yt-dlp process: ${err.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const errorMsg =
          stderr.trim() || `yt-dlp exited with status code ${code}`;
        return reject(new Error(`Failed to extract video information: ${errorMsg}`));
      }

      try {
        const info = JSON.parse(stdout);
        const duration = typeof info.duration === "number" ? info.duration : 0;

        const metadata: VideoMetadata = {
          id: String(info.id || ""),
          title: String(info.title || "Untitled Video"),
          description: String(info.description || "").slice(0, 300),
          duration,
          durationFormatted: formatDuration(duration),
          thumbnail: String(info.thumbnail || ""),
          uploader: String(info.uploader || info.channel || "Unknown Creator"),
          uploaderUrl: info.uploader_url ? String(info.uploader_url) : undefined,
          viewCount: typeof info.view_count === "number" ? info.view_count : undefined,
          webpageUrl: String(info.webpage_url || url),
        };

        resolve(metadata);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        reject(new Error(`Failed to parse video metadata: ${message}`));
      }
    });
  });
}

/**
 * Downloads a video or extracts audio track based on chosen format.
 */
export async function downloadMedia(
  url: string,
  formatChoice: MediaFormatChoice = "best",
  signal?: AbortSignal
): Promise<DownloadResult> {
  if (!isValidMediaUrl(url)) {
    throw new Error("Invalid or unsupported media URL.");
  }

  const pythonExe = process.env.PYTHON_PATH || "python";
  const ffmpegExe = getFfmpegPath();

  // Create isolated temp workspace
  const tempDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "pdf-studio-ytdlp-")
  );

  const cleanup = async () => {
    try {
      if (fs.existsSync(tempDir)) {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup error
    }
  };

  const outputTemplate = path.join(tempDir, "%(title).180B [%(id)s].%(ext)s");

  const args: string[] = [
    "-m",
    "yt_dlp",
    "--no-playlist",
    "--no-warnings",
    "-o",
    outputTemplate,
  ];

  if (ffmpegExe) {
    args.push("--ffmpeg-location", ffmpegExe);
  }

  let mimeType = "video/mp4";

  switch (formatChoice) {
    case "mp3":
      args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
      mimeType = "audio/mpeg";
      break;

    case "m4a":
      args.push("-x", "--audio-format", "m4a");
      mimeType = "audio/mp4";
      break;

    case "1080p":
      args.push(
        "-f",
        "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]",
        "--merge-output-format",
        "mp4"
      );
      mimeType = "video/mp4";
      break;

    case "720p":
      args.push(
        "-f",
        "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]",
        "--merge-output-format",
        "mp4"
      );
      mimeType = "video/mp4";
      break;

    case "480p":
      args.push(
        "-f",
        "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best[height<=480]",
        "--merge-output-format",
        "mp4"
      );
      mimeType = "video/mp4";
      break;

    case "best":
    default:
      args.push(
        "-f",
        "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
        "--merge-output-format",
        "mp4"
      );
      mimeType = "video/mp4";
      break;
  }

  args.push(url.trim());

  return new Promise<DownloadResult>((resolve, reject) => {
    const child = spawn(/*turbopackIgnore: true*/ pythonExe, args, {
      windowsHide: true,
      signal,
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", async (err) => {
      await cleanup();
      reject(new Error(`Failed to start yt-dlp download: ${err.message}`));
    });

    child.on("close", async (code) => {
      if (code !== 0) {
        await cleanup();
        return reject(
          new Error(`Download failed with status ${code}: ${stderr.trim()}`)
        );
      }

      try {
        const files = await fs.promises.readdir(tempDir);
        if (!files || files.length === 0) {
          await cleanup();
          return reject(new Error("No output file generated by yt-dlp."));
        }

        // Pick the largest file or first matching media file in directory
        const validFiles = files.filter((f) => !f.endsWith(".part") && !f.endsWith(".ytdl"));
        const targetFilename = validFiles[0] || files[0];
        const targetPath = path.join(tempDir, targetFilename);
        const stat = await fs.promises.stat(targetPath);

        // Adjust mimeType based on actual file extension if changed by yt-dlp
        const ext = path.extname(targetFilename).toLowerCase();
        if (ext === ".mp3") mimeType = "audio/mpeg";
        else if (ext === ".m4a") mimeType = "audio/mp4";
        else if (ext === ".webm") mimeType = "video/webm";
        else if (ext === ".mkv") mimeType = "video/x-matroska";
        else if (ext === ".mp4") mimeType = "video/mp4";

        resolve({
          filePath: targetPath,
          fileName: targetFilename,
          mimeType,
          size: stat.size,
          cleanup,
        });
      } catch (err: unknown) {
        await cleanup();
        const message = err instanceof Error ? err.message : String(err);
        reject(new Error(`Failed to read downloaded media: ${message}`));
      }
    });
  });
}
