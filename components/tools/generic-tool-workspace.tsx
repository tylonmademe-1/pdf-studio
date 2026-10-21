"use client";

import * as React from "react";
import {
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Lock,
  RotateCw,
  Crop,
  Layers,
  Type,
  FileDown,
  Hash,
  Download,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolDefinition } from "@/types/tool";
import { triggerSafeDownload, extractFilenameFromHeader } from "@/lib/stirling/download";
import { cn } from "@/lib/utils";

interface GenericToolWorkspaceProps {
  tool: ToolDefinition;
}

interface UploadedItem {
  id: string;
  file: File;
  name: string;
  size: number;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileTypeLabel(filename: string): string {
  const ext = filename.split(".").pop()?.toUpperCase();
  return ext ? `${ext} document` : "Document";
}

export function GenericToolWorkspace({ tool }: GenericToolWorkspaceProps) {
  const [files, setFiles] = React.useState<UploadedItem[]>([]);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [completedFile, setCompletedFile] = React.useState<{
    blob: Blob;
    filename: string;
    size: number;
  } | null>(null);

  // Tool-specific parameter state
  const [password, setPassword] = React.useState<string>("");
  const [pageRange, setPageRange] = React.useState<string>("1-3, 5");
  const [rotateAngle, setRotateAngle] = React.useState<number>(90);
  const [watermarkText, setWatermarkText] = React.useState<string>("CONFIDENTIAL");
  const [pageNumberText, setPageNumberText] = React.useState<string>("Page {n} of {total}");
  const [pageSize, setPageSize] = React.useState<string>("A4");
  const [optimizeLevel, setOptimizeLevel] = React.useState<number>(2);
  const [ocrLanguage, setOcrLanguage] = React.useState<string>("eng");
  const [metaTitle, setMetaTitle] = React.useState<string>("");
  const [metaAuthor, setMetaAuthor] = React.useState<string>("");
  const [cropMargins, setCropMargins] = React.useState({
    top: 15,
    bottom: 15,
    left: 15,
    right: 15,
  });

  const dragCounter = React.useRef(0);
  const isSubmittingRef = React.useRef<boolean>(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isMerge = tool.id === "merge-pdf" || tool.slug === "merge-pdf";
  const canSubmit = isMerge
    ? files.length >= 2 && !isProcessing
    : files.length >= 1 && !isProcessing;

  const handleFileSelect = (incomingList: FileList | null) => {
    if (!incomingList || incomingList.length === 0) return;
    setErrorMessage(null);

    const incoming = Array.from(incomingList);
    const newItems: UploadedItem[] = [];

    if (!tool.supportsMultipleFiles && (files.length > 0 || incoming.length > 1)) {
      // Single file tool: replace existing file with the first new file
      const f = incoming[0];
      setFiles([
        {
          id: `${f.name}-${Date.now()}`,
          file: f,
          name: f.name,
          size: f.size,
        },
      ]);
      return;
    }

    for (const f of incoming) {
      newItems.push({
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file: f,
        name: f.name,
        size: f.size,
      });
    }

    setFiles((prev) => (tool.supportsMultipleFiles ? [...prev, ...newItems] : newItems));
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (id: string) => {
    if (isProcessing) return;
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    if (isProcessing) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleReset = () => {
    if (isProcessing) return;
    setFiles([]);
    setCompletedFile(null);
    setErrorMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleProcess = async () => {
    if (!canSubmit || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsProcessing(true);
    setErrorMessage(null);
    setCompletedFile(null);
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      for (const item of files) {
        formData.append("fileInput", item.file, item.name);
      }

      // Append tool-specific parameters
      const tid = tool.id || tool.slug;
      if (tid === "add-password" || tid === "remove-password") {
        if (!password.trim()) {
          throw new Error("Password cannot be empty.");
        }
        formData.append("password", password);
      } else if (tid === "split-pdf" || tid === "extract-pages" || tid === "remove-pages") {
        formData.append("pages", pageRange.trim() || "1");
      } else if (tid === "rotate-pdf") {
        formData.append("angle", String(rotateAngle));
      } else if (tid === "add-watermark") {
        formData.append("watermarkText", watermarkText || "CONFIDENTIAL");
      } else if (tid === "add-page-numbers") {
        formData.append("customText", pageNumberText || "Page {n} of {total}");
      } else if (tid === "scale-pdf") {
        formData.append("pageSize", pageSize);
      } else if (tid === "compress-pdf") {
        formData.append("optimizeLevel", String(optimizeLevel));
      } else if (tid === "ocr-pdf") {
        formData.append("languages", ocrLanguage);
      } else if (tid === "crop-pdf") {
        formData.append("top", String(cropMargins.top));
        formData.append("bottom", String(cropMargins.bottom));
        formData.append("left", String(cropMargins.left));
        formData.append("right", String(cropMargins.right));
      } else if (tid === "edit-metadata") {
        if (metaTitle.trim()) formData.append("title", metaTitle.trim());
        if (metaAuthor.trim()) formData.append("author", metaAuthor.trim());
      }

      const response = await fetch(`/api/tools/${tool.slug || tool.id}`, {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Processing failed with status ${response.status}.`
        );
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("Output file is empty. Processing could not be completed.");
      }

      const cdHeader = response.headers.get("content-disposition");
      const ext =
        tool.slug === "pdf-to-word"
          ? ".docx"
          : tool.slug === "pdf-to-excel"
          ? ".xlsx"
          : tool.slug === "pdf-to-text" || tool.slug === "extract-text"
          ? ".txt"
          : tool.slug === "extract-tables"
          ? ".csv"
          : ".pdf";

      const defaultName = `${tool.slug || tool.id}-result${ext}`;
      const resolvedFilename = extractFilenameFromHeader(cdHeader, defaultName);

      setCompletedFile({
        blob,
        filename: resolvedFilename,
        size: blob.size,
      });

      triggerSafeDownload(blob, resolvedFilename);
      toast.success(`${tool.name} completed successfully!`);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.info("Operation cancelled.");
        return;
      }
      const msg = err instanceof Error ? err.message : "Processing failed.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
      isSubmittingRef.current = false;
    }
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const circle = document.createElement("span");
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add("ripple");
    const existing = btn.querySelector(".ripple");
    if (existing) existing.remove();
    btn.appendChild(circle);

    handleProcess();
  };

  const getStatusText = () => {
    if (isProcessing) return "Processing documents...";
    if (completedFile) return `File ready: ${completedFile.filename}`;
    if (files.length === 0) return "Awaiting documents...";
    if (isMerge && files.length < 2) return "1 file queued (need at least 2 to merge)";
    return `${files.length} file${files.length > 1 ? "s" : ""} ready to ${tool.name.toLowerCase()}`;
  };

  // Check if tool has specialized options UI
  const hasOptions = [
    "add-password",
    "remove-password",
    "split-pdf",
    "extract-pages",
    "remove-pages",
    "rotate-pdf",
    "add-watermark",
    "add-page-numbers",
    "scale-pdf",
    "compress-pdf",
    "crop-pdf",
    "ocr-pdf",
    "edit-metadata",
  ].includes(tool.id || tool.slug);

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
              <h4 className="text-xs font-semibold text-white">Processing Succeeded!</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                Ready as <span className="text-emerald-300 font-medium">{completedFile.filename}</span> (
                {formatBytes(completedFile.size)})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1 sm:flex-initial rounded-lg text-xs font-mono bg-[#1a1a1a] text-neutral-300 border-white/10 hover:bg-[#252525] hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Process Another
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
        {/* Hidden Native File Input */}
        <input
          ref={inputRef}
          type="file"
          accept={tool.acceptedFileTypes?.join(",") || ".pdf"}
          multiple={tool.supportsMultipleFiles}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={isProcessing}
          className="hidden"
          id="tool-file-input"
        />

        {/* Drag and Drop Dropzone */}
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current++;
            if (!isProcessing) setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current--;
            if (dragCounter.current <= 0) {
              setIsDragging(false);
              dragCounter.current = 0;
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current = 0;
            setIsDragging(false);
            if (!isProcessing && e.dataTransfer.files) {
              handleFileSelect(e.dataTransfer.files);
            }
          }}
          onClick={(e) => {
            if (
              !isProcessing &&
              (e.target as HTMLElement).tagName !== "INPUT" &&
              !(e.target as HTMLElement).closest("label")
            ) {
              inputRef.current?.click();
            }
          }}
          className={cn(
            "w-full rounded-xl py-14 px-6 flex flex-col items-center justify-center text-center bg-black border border-dashed border-[#1f1f23] hover:bg-[#121216] hover:border-white/25 transition-all duration-300 cursor-pointer group relative overflow-hidden animate-dropzone-idle select-none",
            isDragging && "dropzone-dragging"
          )}
          data-purpose="file-dropzone"
        >
          {/* Cloud Upload Outline Icon */}
          <div className="mb-4 text-neutral-400 group-hover:text-neutral-200 transition-colors animate-cloud">
            <svg
              className="w-10 h-10 stroke-[1.3] transition-transform duration-300 group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m8 16 4-4 4 4" />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="text-sm font-semibold text-white font-mono tracking-normal mb-1">
            {isDragging ? "Drop document here" : "Choose file or drag & drop"}
          </h2>

          {/* Dropzone Info Subtitle */}
          <p className="text-xs text-neutral-400 font-mono mb-5 transition-colors group-hover:text-neutral-300">
            {tool.supportsMultipleFiles
              ? "Select one or more files to proceed."
              : "Upload a single document for processing."}
          </p>

          {/* Browse Files Button */}
          <label
            className="cursor-pointer relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="inline-block px-5 py-2 text-xs font-mono text-neutral-200 bg-[#1e1e1e] hover:bg-[#eaeaea] hover:text-[#0a0a0a] border border-white/10 hover:border-white/40 rounded-full transition-all duration-200 shadow-sm active:scale-95 font-medium">
              Browse Files
            </span>
            <input
              type="file"
              accept={tool.acceptedFileTypes?.join(",") || ".pdf"}
              multiple={tool.supportsMultipleFiles}
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={isProcessing}
              className="hidden"
            />
          </label>
        </div>

        {/* Queued Files Interactive Container */}
        {files.length > 0 && (
          <div className="flex flex-col gap-2.5 transition-all duration-300" id="fileQueueContainer">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <span>Queued Documents</span>
                <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded text-neutral-300 font-mono">
                  {files.length}
                </span>
              </span>
              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing}
                className="text-[11px] font-mono text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                Clear all
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="file-card-enter flex items-center justify-between p-3 rounded-lg bg-[#080808] border border-white/5 hover:border-white/15 transition-all text-xs font-mono group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <span className="text-neutral-500 font-medium text-[11px] shrink-0 font-mono">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="w-7 h-7 rounded bg-[#0a0a0a] border border-white/10 flex items-center justify-center shrink-0 text-neutral-300">
                      <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-white truncate font-medium text-xs">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {formatBytes(file.size)} · {getFileTypeLabel(file.name)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {tool.supportsMultipleFiles && (
                      <>
                        <button
                          type="button"
                          onClick={() => moveFile(index, -1)}
                          disabled={index === 0 || isProcessing}
                          className="text-neutral-500 hover:text-neutral-300 p-1 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFile(index, 1)}
                          disabled={index === files.length - 1 || isProcessing}
                          className="text-neutral-500 hover:text-neutral-300 p-1 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title="Move down"
                        >
                          ▼
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(file.id)}
                      disabled={isProcessing}
                      className="text-neutral-500 hover:text-red-400 p-1 transition-colors ml-1 disabled:opacity-40"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool-specific Settings Box (when applicable) */}
        {hasOptions && (
          <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-black space-y-4 font-mono">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
              <Sliders className="w-3.5 h-3.5 text-neutral-400" />
              <span>Tool Parameters</span>
            </div>

            {/* 1. Passwords */}
            {(tool.id === "add-password" || tool.id === "remove-password") && (
              <div className="space-y-1.5 max-w-sm">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-neutral-500" />
                  {tool.id === "add-password" ? "Set Document Password" : "Enter Unlock Password"}
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Enter security password"
                  className="h-9 text-xs font-mono bg-black border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-white/30"
                />
              </div>
            )}

            {/* 2. Page Range */}
            {["split-pdf", "extract-pages", "remove-pages"].includes(tool.id) && (
              <div className="space-y-1.5 max-w-sm">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-neutral-500" />
                  Page Selection (e.g. 1-3, 5 or all)
                </label>
                <Input
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  disabled={isProcessing}
                  placeholder="1-3, 5"
                  className="h-9 text-xs font-mono bg-black border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-white/30"
                />
              </div>
            )}

            {/* 3. Rotate Angle */}
            {tool.id === "rotate-pdf" && (
              <div className="space-y-1.5 max-w-sm">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-neutral-500" />
                  Rotation Angle
                </label>
                <div className="flex gap-2">
                  {[90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setRotateAngle(deg)}
                      disabled={isProcessing}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border font-mono transition-colors",
                        rotateAngle === deg
                          ? "bg-neutral-100 text-black border-white/40"
                          : "bg-[#0a0a0a] text-neutral-300 border-white/10 hover:border-white/20 hover:bg-[#282828]"
                      )}
                    >
                      {deg}° Clockwise
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Watermark Text */}
            {tool.id === "add-watermark" && (
              <div className="space-y-1.5 max-w-sm">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-neutral-500" />
                  Watermark Stamp Text
                </label>
                <Input
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  disabled={isProcessing}
                  placeholder="CONFIDENTIAL"
                  className="h-9 text-xs font-mono bg-black border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-white/30"
                />
              </div>
            )}

            {/* 5. Page Numbers */}
            {tool.id === "add-page-numbers" && (
              <div className="space-y-1.5 max-w-sm">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-neutral-500" />
                  Numbering Format
                </label>
                <Input
                  value={pageNumberText}
                  onChange={(e) => setPageNumberText(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Page {n} of {total}"
                  className="h-9 text-xs font-mono bg-black border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-white/30"
                />
              </div>
            )}

            {/* 6. Scale PDF */}
            {tool.id === "scale-pdf" && (
              <div className="space-y-1.5 max-w-sm">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-neutral-500" />
                  Target Standard Dimensions
                </label>
                <div className="flex gap-2">
                  {["A4", "LETTER", "A3", "LEGAL"].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setPageSize(sz)}
                      disabled={isProcessing}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border font-mono transition-colors",
                        pageSize === sz
                          ? "bg-neutral-100 text-black border-white/40"
                          : "bg-[#0a0a0a] text-neutral-300 border-white/10 hover:border-white/20 hover:bg-[#282828]"
                      )}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Compress PDF */}
            {tool.id === "compress-pdf" && (
              <div className="space-y-1.5 max-w-sm">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <FileDown className="w-3.5 h-3.5 text-neutral-500" />
                  Compression Level
                </label>
                <div className="flex gap-2">
                  {[
                    { val: 1, label: "Low (Fast)" },
                    { val: 2, label: "Medium (Optimal)" },
                    { val: 3, label: "High (Smallest)" },
                  ].map((lvl) => (
                    <button
                      key={lvl.val}
                      type="button"
                      onClick={() => setOptimizeLevel(lvl.val)}
                      disabled={isProcessing}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border font-mono transition-colors",
                        optimizeLevel === lvl.val
                          ? "bg-neutral-100 text-black border-white/40"
                          : "bg-[#0a0a0a] text-neutral-300 border-white/10 hover:border-white/20 hover:bg-[#282828]"
                      )}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 8. Crop PDF */}
            {tool.id === "crop-pdf" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Crop className="w-3.5 h-3.5 text-neutral-500" />
                  Margin Trimming (in millimeters)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-md">
                  {(["top", "bottom", "left", "right"] as const).map((side) => (
                    <div key={side} className="space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase">{side} mm</span>
                      <Input
                        type="number"
                        min="0"
                        max="150"
                        value={cropMargins[side]}
                        onChange={(e) =>
                          setCropMargins((prev) => ({
                            ...prev,
                            [side]: Math.max(0, parseInt(e.target.value, 10) || 0),
                          }))
                        }
                        disabled={isProcessing}
                        className="h-8 text-xs font-mono bg-black border-white/10 text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. Edit Metadata */}
            {tool.id === "edit-metadata" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-300">Document Title</label>
                  <Input
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    disabled={isProcessing}
                    placeholder="New Title"
                    className="h-8 text-xs font-mono bg-black border-white/10 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-300">Author Name</label>
                  <Input
                    value={metaAuthor}
                    onChange={(e) => setMetaAuthor(e.target.value)}
                    disabled={isProcessing}
                    placeholder="Author"
                    className="h-8 text-xs font-mono bg-black border-white/10 text-white"
                  />
                </div>
              </div>
            )}

            {/* 10. OCR PDF */}
            {tool.id === "ocr-pdf" && (
              <div className="space-y-1.5 max-w-sm">
                <label className="text-xs font-medium text-neutral-300">OCR Primary Language</label>
                <div className="flex gap-2">
                  {[
                    { code: "eng", label: "English" },
                    { code: "spa", label: "Spanish" },
                    { code: "fra", label: "French" },
                    { code: "deu", label: "German" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setOcrLanguage(lang.code)}
                      disabled={isProcessing}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium border font-mono transition-colors",
                        ocrLanguage === lang.code
                          ? "bg-neutral-100 text-black border-white/40"
                          : "bg-[#0a0a0a] text-neutral-300 border-white/10 hover:border-white/20 hover:bg-[#282828]"
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Inside-Card Divider */}
        <hr className="border-t border-white/5 w-full" />

        {/* Bottom Card Actions Row */}
        <div
          className="flex items-center justify-between w-full"
          data-purpose="action-buttons-row"
        >
          <span
            className={cn(
              "text-xs font-mono transition-colors hidden sm:inline",
              files.length > 0 ? "text-neutral-300" : "text-neutral-500"
            )}
            id="statusMessage"
          >
            {getStatusText()}
          </span>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleButtonClick}
            className={cn(
              "cta-merge-btn relative overflow-hidden inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-mono font-medium border border-white/10 transition-all shadow-md active:scale-95 ml-auto cursor-pointer",
              canSubmit
                ? "bg-neutral-100 text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                : "bg-[#404040] text-neutral-100 opacity-60 cursor-not-allowed"
            )}
            id="mergeBtn"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{tool.name}</span>
                <span className="cta-arrow inline-block" id="mergeBtnArrow">
                  →
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
