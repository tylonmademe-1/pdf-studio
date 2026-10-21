"use client";

import * as React from "react";
import Link from "next/link";
import {
  Files,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Dropzone, DropzoneFile } from "@/components/tools/dropzone";
import { Button } from "@/components/ui/button";
import { triggerSafeDownload, extractFilenameFromHeader } from "@/lib/stirling/download";

export default function MergePdfPage() {
  const [files, setFiles] = React.useState<DropzoneFile[]>([]);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [downloadReady, setDownloadReady] = React.useState<{
    blob: Blob;
    filename: string;
    size: number;
  } | null>(null);

  // Submit mutex ref to prevent microtask / synthetic event double clicks
  const isSubmittingRef = React.useRef<boolean>(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const canSubmit = files.length >= 2 && !isProcessing;

  const handleMerge = async () => {
    // Defense against double-click race conditions
    if (!canSubmit || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setErrorMessage(null);
    setDownloadReady(null);
    setIsProcessing(true);

    abortControllerRef.current = new AbortController();

    try {
      if (files.length < 2) {
        throw new Error("Please select at least 2 PDF documents to merge.");
      }

      // Build multipart payload matching Stirling-PDF & Route Handler contract
      const formData = new FormData();
      for (const item of files) {
        formData.append("fileInput", item.file, item.name);
      }

      const response = await fetch("/api/tools/merge-pdf", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        throw new Error(
          errorJson?.error ||
            `Merge request failed with status code ${response.status}.`
        );
      }

      // Read response as binary blob
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("The processing engine returned an empty output document.");
      }

      // Determine clean filename from Content-Disposition header
      const cdHeader = response.headers.get("content-disposition");
      const defaultFilename = files[0]?.name
        ? `merged-${files[0].name.replace(/\.[^.]+$/, "")}.pdf`
        : "merged.pdf";
      const resolvedFilename = extractFilenameFromHeader(cdHeader, defaultFilename);

      setDownloadReady({
        blob,
        filename: resolvedFilename,
        size: blob.size,
      });

      // Trigger automatic safe download
      triggerSafeDownload(blob, resolvedFilename);
      toast.success("PDFs merged successfully! Download started.");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.info("Merge operation cancelled.");
        return;
      }

      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
      isSubmittingRef.current = false;
    }
  };

  const handleReset = () => {
    setFiles([]);
    setErrorMessage(null);
    setDownloadReady(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Breadcrumb Navigation */}
      <div className="border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to all tools</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
              Engine Ready
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-10 sm:pt-14 space-y-10">
        {/* Modern Page Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
            <Files className="w-3.5 h-3.5" />
            Document Organizer
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Merge PDF
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Combine multiple PDF files into one document in seconds. Arrange your
            pages in the exact order you need.
          </p>
        </div>

        {/* Success Banner (when download is ready) */}
        {downloadReady && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in-0 duration-200">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Merge Complete!
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Saved as <span className="font-mono text-foreground font-medium">{downloadReady.filename}</span> ({(downloadReady.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex-1 sm:flex-initial rounded-xl text-xs"
              >
                Merge More Files
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  triggerSafeDownload(downloadReady.blob, downloadReady.filename)
                }
                className="flex-1 sm:flex-initial rounded-xl text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <span>Download Again</span>
              </Button>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3.5 animate-in fade-in-0 duration-200">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider">
                Merge Failed
              </h4>
              <p className="text-xs text-destructive/90 mt-1 leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Main Work Area: Floating Dark Terminal Card */}
        <div className="w-full rounded-2xl bg-black border border-[#1f1f23] p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative transition-all duration-300 hover:border-white/15 overflow-hidden">
          {/* Terminal Header Bar */}
          <div className="w-full flex items-center justify-between px-4 py-3 rounded-t-xl bg-black border-b border-[#1f1f23] -mt-6 -mx-6 md:-mt-8 md:-mx-8 w-[calc(100%+3rem)] md:w-[calc(100%+4rem)] mb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-black/20" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-black/20" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-black/20" />
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-neutral-400" />
          </div>
          <Dropzone
            files={files}
            onFilesChange={setFiles}
            disabled={isProcessing}
          />

          {/* Action Bar */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              {files.length < 2 ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Add at least 2 PDF files to enable merge ({files.length}/2 loaded)
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready to merge {files.length} documents
                </span>
              )}
            </div>

            <Button
              size="lg"
              onClick={handleMerge}
              disabled={!canSubmit}
              className="cta-merge-btn relative overflow-hidden inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-mono font-medium border border-white/10 transition-all shadow-md active:scale-95 cursor-pointer bg-neutral-100 text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] min-w-[160px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Merge PDFs</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">
              Privacy First
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Files are processed in memory and never permanently stored on servers.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">
              High Speed Engine
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Powered by self-hosted high throughput engines with zero queuing delays.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">
              Preserves Quality
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Retains vector crispness, bookmarks, layers, and interactive form fields.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
