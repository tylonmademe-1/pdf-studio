"use client";

import * as React from "react";
import {
  FileText,
  KeyRound,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Download,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolDefinition } from "@/types/tool";
import { triggerSafeDownload } from "@/lib/stirling/download";
import { cn } from "@/lib/utils";

interface SignPdfWorkspaceProps {
  tool: ToolDefinition;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function SignPdfWorkspace({ tool }: SignPdfWorkspaceProps) {
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [certFile, setCertFile] = React.useState<File | null>(null);
  const [certPassword, setCertPassword] = React.useState<string>("");
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
  const pdfInputRef = React.useRef<HTMLInputElement>(null);
  const certInputRef = React.useRef<HTMLInputElement>(null);

  const canSubmit =
    pdfFile !== null &&
    certFile !== null &&
    certPassword.trim().length > 0 &&
    !isProcessing;

  const handleReset = () => {
    if (isProcessing) return;
    setPdfFile(null);
    setCertFile(null);
    setCertPassword("");
    setCompletedFile(null);
    setErrorMessage(null);
  };

  const handleSign = async () => {
    if (!canSubmit || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsProcessing(true);
    setErrorMessage(null);
    setCompletedFile(null);

    try {
      if (!pdfFile || !certFile) {
        throw new Error("Both the target PDF and certificate file are required.");
      }

      const formData = new FormData();
      formData.append("fileInput", pdfFile, pdfFile.name);
      formData.append("certFile", certFile, certFile.name);
      formData.append("certPassword", certPassword);
      formData.append("sigType", "DIGITAL");

      const response = await fetch(`/api/tools/${tool.slug || "sign-pdf"}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Signing failed with HTTP ${response.status}.`
        );
      }

      const blob = await response.blob();
      const outputName = `signed-${pdfFile.name}`;

      setCompletedFile({
        blob,
        filename: outputName,
        size: blob.size,
      });

      triggerSafeDownload(blob, outputName);
      toast.success("Document digitally signed with certificate!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signing failed.";
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

    handleSign();
  };

  const getStatusText = () => {
    if (isProcessing) return "Signing document...";
    if (completedFile) return `File ready: ${completedFile.filename}`;
    if (!pdfFile && !certFile) return "Awaiting documents...";
    if (pdfFile && !certFile) return "PDF loaded · Waiting for certificate (.p12/.pfx)";
    if (!pdfFile && certFile) return "Certificate loaded · Waiting for PDF document";
    if (!certPassword) return "Awaiting certificate password...";
    return "All assets ready to sign";
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
              <h4 className="text-xs font-semibold text-white">Document Signed!</h4>
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
              Sign Another
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
              Signing Error
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
        {/* Hidden File Inputs */}
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
          disabled={isProcessing}
          className="hidden"
          id="sign-pdf-input"
        />
        <input
          ref={certInputRef}
          type="file"
          accept=".p12,.pfx,application/x-pkcs12"
          onChange={(e) => setCertFile(e.target.files?.[0] || null)}
          disabled={isProcessing}
          className="hidden"
          id="sign-cert-input"
        />

        {/* Primary PDF Dropzone */}
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
              const file = e.dataTransfer.files[0];
              if (file.name.endsWith(".p12") || file.name.endsWith(".pfx")) {
                setCertFile(file);
              } else {
                setPdfFile(file);
              }
            }
          }}
          onClick={(e) => {
            if (
              !isProcessing &&
              (e.target as HTMLElement).tagName !== "INPUT" &&
              !(e.target as HTMLElement).closest("label")
            ) {
              pdfInputRef.current?.click();
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
            Upload the PDF document you want to digitally sign.
          </p>

          <label className="cursor-pointer relative z-10" onClick={(e) => e.stopPropagation()}>
            <span className="inline-block px-5 py-2 text-xs font-mono text-neutral-200 bg-[#1e1e1e] hover:bg-[#eaeaea] hover:text-[#0a0a0a] border border-white/10 hover:border-white/40 rounded-full transition-all duration-200 shadow-sm active:scale-95 font-medium">
              Browse PDF
            </span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              disabled={isProcessing}
              className="hidden"
            />
          </label>
        </div>

        {/* Queued Documents for PDF & Certificate */}
        {(pdfFile || certFile) && (
          <div className="flex flex-col gap-2.5 transition-all duration-300">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <span>Queued Files</span>
                <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded text-neutral-300 font-mono">
                  {(pdfFile ? 1 : 0) + (certFile ? 1 : 0)} / 2
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
              {pdfFile && (
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
                        {pdfFile.name}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {formatBytes(pdfFile.size)} · Target PDF Document
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPdfFile(null)}
                    disabled={isProcessing}
                    className="text-neutral-500 hover:text-red-400 p-1 transition-colors ml-1 disabled:opacity-40"
                    title="Remove PDF"
                  >
                    ✕
                  </button>
                </div>
              )}

              {certFile && (
                <div className="file-card-enter flex items-center justify-between p-3 rounded-lg bg-[#080808] border border-white/5 hover:border-white/15 transition-all text-xs font-mono group">
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <span className="text-neutral-500 font-medium text-[11px] shrink-0 font-mono">
                      #02
                    </span>
                    <div className="w-7 h-7 rounded bg-[#0a0a0a] border border-white/10 flex items-center justify-center shrink-0 text-amber-400">
                      <KeyRound className="w-3.5 h-3.5 stroke-[1.5]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-white truncate font-medium text-xs">
                        {certFile.name}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {formatBytes(certFile.size)} · PKCS#12 Certificate Keystore
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCertFile(null)}
                    disabled={isProcessing}
                    className="text-neutral-500 hover:text-red-400 p-1 transition-colors ml-1 disabled:opacity-40"
                    title="Remove Certificate"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Certificate Upload & Password Box */}
        <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-black space-y-4 font-mono">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>Digital Certificate Credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Keystore File Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                Certificate File (.p12 / .pfx)
              </label>
              <div
                onClick={() => certInputRef.current?.click()}
                className="h-9 px-3 rounded-lg border border-white/10 bg-black hover:border-white/20 flex items-center justify-between text-xs text-neutral-300 cursor-pointer transition-colors"
              >
                <span className="truncate max-w-[200px]">
                  {certFile ? certFile.name : "Select certificate file..."}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-neutral-400 shrink-0">
                  Browse
                </span>
              </div>
            </div>

            {/* Keystore Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-neutral-500" />
                Private Key Password
              </label>
              <Input
                type="password"
                value={certPassword}
                onChange={(e) => setCertPassword(e.target.value)}
                disabled={isProcessing}
                placeholder="Passphrase to unlock keystore"
                className="h-9 text-xs font-mono bg-black border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-white/30"
              />
            </div>
          </div>
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
            id="signBtn"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing...</span>
              </>
            ) : (
              <>
                <span>Sign Document</span>
                <span className="cta-arrow inline-block" id="signBtnArrow">
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
