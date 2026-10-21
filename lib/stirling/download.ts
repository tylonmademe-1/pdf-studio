const REGEX_LEADING_PATH = /^.*[\\/]/;
const REGEX_ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
const REGEX_UTF8_FILENAME = /filename\*=UTF-8''([^;]+)/i;
const REGEX_STANDARD_FILENAME = /filename="?([^";]+)"?/i;

export function sanitizeFilename(filename: string): string {
  if (!filename) return "document.pdf";

  // Strip path traversal characters, directory separators, and control characters
  let clean = filename
    .replace(REGEX_LEADING_PATH, "") // remove leading path
    .replace(REGEX_ILLEGAL_FILENAME_CHARS, "_") // remove illegal chars
    .trim();

  if (!clean || clean === "." || clean === "..") {
    clean = "document.pdf";
  }

  return clean;
}

export function extractFilenameFromHeader(
  contentDisposition: string | null,
  fallbackFilename: string
): string {
  if (!contentDisposition) {
    return sanitizeFilename(fallbackFilename);
  }

  // Check for filename*=UTF-8''... format (RFC 5987)
  const utf8Match = contentDisposition.match(REGEX_UTF8_FILENAME);
  if (utf8Match && utf8Match[1]) {
    try {
      return sanitizeFilename(decodeURIComponent(utf8Match[1]));
    } catch {
      // Fall through to standard filename
    }
  }

  // Standard filename="name.pdf" format
  const match = contentDisposition.match(REGEX_STANDARD_FILENAME);
  if (match && match[1]) {
    return sanitizeFilename(match[1]);
  }

  return sanitizeFilename(fallbackFilename);
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const safeName = sanitizeFilename(filename);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();

  // Cleanup object URL after download
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

export const triggerSafeDownload = triggerBlobDownload;
