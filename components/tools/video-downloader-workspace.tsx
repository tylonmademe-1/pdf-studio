"use client";

import * as React from "react";
import {
  Video,
  Music,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Clipboard,
  X,
  Play,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ToolDefinition } from "@/types/tool";
import { triggerSafeDownload, extractFilenameFromHeader } from "@/lib/stirling/download";

interface VideoDownloaderWorkspaceProps {
  tool: ToolDefinition;
}

interface VideoMetadata {
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

type FormatOption = "best" | "1080p" | "720p" | "mp3" | "m4a";

interface FormatConfig {
  id: FormatOption;
  label: string;
  sublabel: string;
  type: "video" | "audio";
  badge: string;
}

const FORMAT_OPTIONS: FormatConfig[] = [
  {
    id: "best",
    label: "MP4 Video (Best / 4K)",
    sublabel: "Highest available resolution with merged audio",
    type: "video",
    badge: "MAX",
  },
  {
    id: "1080p",
    label: "MP4 Video (1080p FHD)",
    sublabel: "Crisp 1080p stream merged with audio",
    type: "video",
    badge: "1080P",
  },
  {
    id: "720p",
    label: "MP4 Video (720p HD)",
    sublabel: "Fast download, ideal for mobile & quick sharing",
    type: "video",
    badge: "720P",
  },
  {
    id: "mp3",
    label: "MP3 Audio (320 kbps)",
    sublabel: "Extracted high-fidelity stereo audio track",
    type: "audio",
    badge: "MP3",
  },
  {
    id: "m4a",
    label: "M4A Audio (AAC)",
    sublabel: "Lossless container extraction for Apple devices",
    type: "audio",
    badge: "M4A",
  },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function VideoDownloaderWorkspace({ tool }: VideoDownloaderWorkspaceProps) {
  const [url, setUrl] = React.useState<string>("");
  const [selectedFormat, setSelectedFormat] = React.useState<FormatOption>("best");
  const [isInspecting, setIsInspecting] = React.useState<boolean>(false);
  const [isDownloading, setIsDownloading] = React.useState<boolean>(false);
  const [metadata, setMetadata] = React.useState<VideoMetadata | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [completedFile, setCompletedFile] = React.useState<{
    blob: Blob;
    filename: string;
    size: number;
  } | null>(null);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Inspect video URL metadata
  const handleInspect = async (targetUrl?: string) => {
    const rawUrl = (targetUrl !== undefined ? targetUrl : url).trim();
    if (!rawUrl) return;

    // Check basic URL format
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setErrorMessage("Please enter a valid HTTP or HTTPS video URL.");
        return;
      }
    } catch {
      setErrorMessage("Please enter a valid URL (e.g. https://www.youtube.com/watch?v=...)");
      return;
    }

    setIsInspecting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/tools/video-downloader?url=${encodeURIComponent(rawUrl)}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to inspect video details.");
      }

      setMetadata(data.metadata);
      toast.success("Video metadata retrieved successfully!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch video details.";
      setErrorMessage(message);
      setMetadata(null);
    } finally {
      setIsInspecting(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setErrorMessage(null);
        handleInspect(text);
      }
    } catch {
      toast.error("Unable to read clipboard. Please paste manually.");
    }
  };

  const handleClear = () => {
    setUrl("");
    setMetadata(null);
    setErrorMessage(null);
    setCompletedFile(null);
  };

  const handleDownload = async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setErrorMessage("Please enter a valid video URL.");
      return;
    }

    setIsDownloading(true);
    setErrorMessage(null);
    setCompletedFile(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/tools/video-downloader", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: cleanUrl,
          format: selectedFormat,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let errorDetail = "Download failed.";
        try {
          const errData = await response.json();
          errorDetail = errData.error || errorDetail;
        } catch {
          errorDetail = `Server responded with status ${response.status}`;
        }
        throw new Error(errorDetail);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const defaultFilename =
        selectedFormat === "mp3"
          ? "audio.mp3"
          : selectedFormat === "m4a"
          ? "audio.m4a"
          : "video.mp4";

      const finalFilename = extractFilenameFromHeader(
        contentDisposition,
        metadata?.title ? `${metadata.title}.${selectedFormat === "mp3" ? "mp3" : selectedFormat === "m4a" ? "m4a" : "mp4"}` : defaultFilename
      );

      setCompletedFile({
        blob,
        filename: finalFilename,
        size: blob.size,
      });

      triggerSafeDownload(blob, finalFilename);
      toast.success("Media successfully downloaded!");
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") {
        toast.info("Download cancelled.");
      } else {
        const message =
          err instanceof Error ? err.message : "Media download failed.";
        setErrorMessage(message);
        toast.error("Download failed.");
      }
    } finally {
      setIsDownloading(false);
      abortControllerRef.current = null;
    }
  };

  const isBusy = isInspecting || isDownloading;

  return (
    <div className="w-full flex flex-col gap-6">
      

      {/* Success Notification Banner */}
      {completedFile && (
        <div className="file-card-enter rounded-2xl border border-emerald-500/30 bg-[#121c17] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono shadow-lg">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-white">Media Download Succeeded!</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                Saved as <span className="text-emerald-300 font-medium">{completedFile.filename}</span> (
                {formatBytes(completedFile.size)})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1 sm:flex-initial rounded-lg text-xs font-mono bg-[#1a1a1a] text-neutral-300 border-white/10 hover:bg-[#252525] hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Download Another
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => triggerSafeDownload(completedFile.blob, completedFile.filename)}
              className="flex-1 sm:flex-initial rounded-lg text-xs font-mono bg-neutral-100 text-black hover:bg-white font-medium"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download Again
            </Button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="file-card-enter rounded-2xl border border-red-500/30 bg-red-950/20 p-4 flex items-start gap-3 font-mono">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h5 className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
              Operation Error
            </h5>
            <p className="text-xs text-red-200/90 mt-1 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}      {/* Floating Dark Terminal Card */}
      <div
        className="w-full rounded-2xl bg-black border border-[#1f1f23] p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative transition-all duration-300 hover:border-white/15 overflow-hidden"
      >
        {/* Terminal Header Bar */}
        <div className="w-full flex items-center justify-between px-4 py-3 rounded-t-xl bg-black border-b border-[#1f1f23] -mt-6 -mx-6 md:-mt-8 md:-mx-8 w-[calc(100%+3rem)] md:w-[calc(100%+4rem)] mb-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-black/20" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-black/20" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-black/20" />
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-400" />
        </div>
        {/* URL Input Section */}
        <div className="flex flex-col gap-2 font-mono">
          <label className="text-[11px] uppercase tracking-wider text-neutral-400 flex items-center justify-between">
            <span>Video or Audio URL</span>
            <span className="text-[10px] text-neutral-400">1000+ Platforms Supported</span>
          </label>

          <div className="relative flex items-center w-full">
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setErrorMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isBusy) {
                  e.preventDefault();
                  handleInspect();
                }
              }}
              placeholder="https://www.youtube.com/watch?v=... or any video link"
              disabled={isBusy}
              className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3.5 pr-28 text-xs font-mono text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isBusy}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Clear URL"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePaste}
                disabled={isBusy}
                className="h-8 px-2.5 rounded-lg text-[11px] font-mono bg-[#242424] text-neutral-300 border-white/10 hover:bg-[#2c2c2c] hover:text-white"
              >
                <Clipboard className="w-3 h-3 mr-1" />
                Paste
              </Button>
            </div>
          </div>
        </div>

        {/* Quick URL Inspect Button (if not inspected yet) */}
        {!metadata && url.trim() && (
          <div className="flex justify-end -mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleInspect()}
              disabled={isBusy}
              className="rounded-lg text-xs font-mono bg-[#1e1e1e] border-white/10 text-neutral-300 hover:text-white hover:bg-[#282828]"
            >
              {isInspecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Inspecting Streams...
                </>
              ) : (
                <>
                  <Film className="w-3.5 h-3.5 mr-1.5" />
                  Inspect Video Details
                </>
              )}
            </Button>
          </div>
        )}

        {/* Video Metadata Preview Card */}
        {metadata && (
          <div className="file-card-enter rounded-xl bg-[#1a1a1a] border border-white/10 p-4 flex flex-col sm:flex-row gap-4 items-start font-mono">
            {metadata.thumbnail ? (
              <div className="relative w-full sm:w-44 h-28 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={metadata.thumbnail}
                  alt={metadata.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border border-white/10">
                  {metadata.durationFormatted}
                </span>
              </div>
            ) : (
              <div className="w-full sm:w-44 h-28 rounded-lg shrink-0 bg-black border border-white/10 flex items-center justify-center text-neutral-400">
                <Play className="w-8 h-8 opacity-40" />
              </div>
            )}

            <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
              <div>
                <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                  {metadata.title}
                </h4>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300">
                    {metadata.uploader}
                  </span>
                  {metadata.viewCount !== undefined && (
                    <span>
                      {metadata.viewCount.toLocaleString()} views
                    </span>
                  )}
                  <span>•</span>
                  <span>{metadata.durationFormatted}</span>
                </div>
              </div>

              {metadata.webpageUrl && (
                <div className="mt-3">
                  <a
                    href={metadata.webpageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
                  >
                    <span>View original source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Format Selector */}
        <div className="flex flex-col gap-3 font-mono">
          <label className="text-[11px] uppercase tracking-wider text-neutral-400">
            Select Output Format
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FORMAT_OPTIONS.map((fmt) => {
              const isSelected = selectedFormat === fmt.id;
              const Icon = fmt.type === "video" ? Video : Music;

              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setSelectedFormat(fmt.id)}
                  disabled={isBusy}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-white/10 border-white/30 shadow-sm"
                      : "bg-[#181818] border-white/5 hover:border-white/15 hover:bg-[#1e1e1e]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? "bg-white text-black"
                        : "bg-white/5 text-neutral-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">
                        {fmt.label}
                      </span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
                        {fmt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                      {fmt.sublabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hairline Divider */}
        <div className="border-t border-white/10" />

        {/* Dynamic Action and Status Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            {isDownloading ? (
              <span className="flex items-center gap-2 text-neutral-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Downloading media & merging streams...</span>
              </span>
            ) : isInspecting ? (
              <span className="flex items-center gap-2 text-neutral-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Querying stream manifests...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Engine: {tool.name} (yt-dlp & FFmpeg Native Active)</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!url.trim() || isBusy}
            className={`cta-merge-btn w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-mono text-xs font-semibold tracking-wide cursor-pointer select-none ${
              !url.trim() || isBusy
                ? "bg-[#1f1f1f] text-neutral-400 border border-white/5 cursor-not-allowed opacity-60"
                : "bg-white text-black hover:bg-neutral-100 border border-white/80 active:scale-95"
            }`}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Stream...</span>
              </>
            ) : (
              <>
                <span>Download Media</span>
                <span className="cta-arrow inline-block">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
