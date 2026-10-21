"use client";

import * as React from "react";
import {
  FileText,
  ShieldAlert,
  Loader2,
  AlertCircle,
  Code2,
  CheckCircle2,
  Download,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolDefinition } from "@/types/tool";
import { triggerSafeDownload, extractFilenameFromHeader } from "@/lib/stirling/download";
import { cn } from "@/lib/utils";

interface AutoRedactWorkspaceProps {
  tool: ToolDefinition;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function AutoRedactWorkspace({ tool }: AutoRedactWorkspaceProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [keywords, setKeywords] = React.useState<string>("CONFIDENTIAL, SECRET, SSN");
  const [useRegex, setUseRegex] = React.useState<boolean>(false);
  const [regexPattern, setRegexPattern] = React.useState<string>("\\d{3}-\\d{2}-\\d{4}");
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [completedFile, setCompletedFile] = React.useState<{
    blob: Blob;
    filename: string;
    size: number;
  } | null>(null);

  const dragCounter = React.useRef(0);
  const isSubmittingRef = React.useRef<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const canSubmit =
    file !== null &&
    (useRegex ? regexPattern.trim().length > 0 : keywords.trim().length > 0) &&
    !isProcessing;

  const handleReset = () => {
    if (isProcessing) return;
    setFile(null);
    setCompletedFile(null);
    setErrorMessage(null);
  };

  const handleRedact = async () => {
    if (!canSubmit || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsProcessing(true);
    setErrorMessage(null);
    setCompletedFile(null);

    try {
      if (!file) throw new Error("Please upload a PDF document.");

      const formData = new FormData();
      formData.append("fileInput", file, file.name);

      if (useRegex && regexPattern.trim()) {
        formData.append("useRegEx", "true");
        formData.append("regex", regexPattern.trim());
      } else {
        const wordsList = keywords
          .split(/[,;\n]/)
          .map((w) => w.trim())
          .filter(Boolean);

        if (wordsList.length === 0) {
          throw new Error("Please enter at least one word or phrase to redact.");
        }

        wordsList.forEach((word) => {
          formData.append("words", word);
        });
        formData.append("useRegEx", "false");
      }

      const response = await fetch(`/api/tools/${tool.slug || "redact-pdf"}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Redaction failed with status ${response.status}.`
        );
      }

      const blob = await response.blob();
      const cdHeader = response.headers.get("content-disposition");
      const defaultName = `redacted-${file.name}`;
      const resolvedName = extractFilenameFromHeader(cdHeader, defaultName);

      setCompletedFile({
        blob,
        filename: resolvedName,
        size: blob.size,
      });

      triggerSafeDownload(blob, resolvedName);
      toast.success("Document redacted successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Redaction failed.";
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

    handleRedact();
  };

  const getStatusText = () => {
    if (isProcessing) return "Sanitizing and redacting document...";
    if (completedFile) return `File ready: ${completedFile.filename}`;
    if (!file) return "Awaiting document...";
    if (useRegex && !regexPattern.trim()) return "Enter RegEx pattern to redact";
    if (!useRegex && !keywords.trim()) return "Enter keywords to redact";
    return `1 file ready to redact`;
  };

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
              <h4 className="text-xs font-semibold text-white">Redaction Completed!</h4>
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
              Redact Another
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
              Redaction Error
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
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={isProcessing}
          className="hidden"
          id="redact-file-input"
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
            if (!isProcessing && e.dataTransfer.files?.[0]) {
              setFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={(e) => {
            if (
              !isProcessing &&
              (e.target as HTMLElement).tagName !== "INPUT" &&
              !(e.target as HTMLElement).closest("label")
            ) {
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            "w-full rounded-xl py-12 px-6 flex flex-col items-center justify-center text-center bg-black border border-dashed border-[#1f1f23] hover:bg-[#121216] hover:border-white/25 transition-all duration-300 cursor-pointer group relative overflow-hidden animate-dropzone-idle select-none",
            isDragging && "dropzone-dragging"
          )}
          data-purpose="file-dropzone"
        >
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

          <h2 className="text-sm font-semibold text-white font-mono tracking-normal mb-1">
            {isDragging ? "Drop PDF document here" : "Choose PDF or drag & drop"}
          </h2>
          <p className="text-xs text-neutral-400 font-mono mb-5 transition-colors group-hover:text-neutral-300">
            Upload the PDF document you want to redact sensitive info from.
          </p>

          <label className="cursor-pointer relative z-10" onClick={(e) => e.stopPropagation()}>
            <span className="inline-block px-5 py-2 text-xs font-mono text-neutral-200 bg-[#1e1e1e] hover:bg-[#eaeaea] hover:text-[#0a0a0a] border border-white/10 hover:border-white/40 rounded-full transition-all duration-200 shadow-sm active:scale-95 font-medium">
              Browse PDF
            </span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isProcessing}
              className="hidden"
            />
          </label>
        </div>

        {/* Queued PDF Document Card */}
        {file && (
          <div className="flex flex-col gap-2.5 transition-all duration-300">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <span>Queued Document</span>
                <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded text-neutral-300 font-mono">
                  1
                </span>
              </span>
              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing}
                className="text-[11px] font-mono text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            <div className="file-card-enter flex items-center justify-between p-3 rounded-lg bg-[#080808] border border-white/5 hover:border-white/15 transition-all text-xs font-mono group">
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <span className="text-neutral-500 font-medium text-[11px] shrink-0 font-mono">
                  #01
                </span>
                <div className="w-7 h-7 rounded bg-[#0a0a0a] border border-white/10 flex items-center justify-center shrink-0 text-neutral-300">
                  <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white truncate font-medium text-xs">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {formatBytes(file.size)} · PDF Document
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={isProcessing}
                className="text-neutral-500 hover:text-red-400 p-1 transition-colors ml-1 disabled:opacity-40"
                title="Remove file"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Redaction Rules Configuration Box */}
        <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-black space-y-4 font-mono">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
            <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
            <span>Redaction Strategy</span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setUseRegex(false)}
              disabled={isProcessing}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border font-mono transition-colors",
                !useRegex
                  ? "bg-neutral-100 text-black border-white/40"
                  : "bg-[#0a0a0a] text-neutral-300 border-white/10 hover:border-white/20 hover:bg-[#282828]"
              )}
            >
              Keywords & Phrases
            </button>
            <button
              type="button"
              onClick={() => setUseRegex(true)}
              disabled={isProcessing}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border font-mono transition-colors",
                useRegex
                  ? "bg-neutral-100 text-black border-white/40"
                  : "bg-[#0a0a0a] text-neutral-300 border-white/10 hover:border-white/20 hover:bg-[#282828]"
              )}
            >
              Regular Expression (RegEx)
            </button>
          </div>

          {!useRegex ? (
            <div className="space-y-1.5 max-w-lg">
              <label className="text-xs font-medium text-neutral-300 block">
                Words or Phrases to Black Out (comma separated)
              </label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                disabled={isProcessing}
                placeholder="e.g. Confidential, Secret, SSN, Internal Only"
                className="h-9 text-xs font-mono bg-black border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-white/30"
              />
              <p className="text-[10px] text-neutral-500">
                Matches are permanently blacked out and scrubbed from text streams across all pages.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-w-lg">
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-neutral-400" />
                Regular Expression Pattern
              </label>
              <Input
                value={regexPattern}
                onChange={(e) => setRegexPattern(e.target.value)}
                disabled={isProcessing}
                placeholder="e.g. \d{3}-\d{2}-\d{4}"
                className="h-9 text-xs font-mono bg-black border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-white/30"
              />
              <p className="text-[10px] text-neutral-500">
                Standard RegEx format. Examples: <code className="bg-[#0a0a0a] px-1 py-0.5 rounded text-[10px]">\d{3}-\d{2}-\d{4}</code> for SSN, <code className="bg-[#0a0a0a] px-1 py-0.5 rounded text-[10px]">[\w\.-]+@[\w\.-]+</code> for emails.
              </p>
            </div>
          )}
        </div>

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
              canSubmit ? "text-neutral-300" : "text-neutral-500"
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
            id="redactBtn"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Redacting...</span>
              </>
            ) : (
              <>
                <span>Redact Document</span>
                <span className="cta-arrow inline-block" id="redactBtnArrow">
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
