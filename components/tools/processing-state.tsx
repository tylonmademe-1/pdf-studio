"use client";

import * as React from "react";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type OperationState =
  | "idle"
  | "validating"
  | "uploading"
  | "processing"
  | "success"
  | "failure";

interface ProcessingStateProps {
  state: OperationState;
  toolName: string;
  outputFilename?: string;
  outputSize?: number;
  engineUsed?: string;
  errorMessage?: string;
  onDownload?: () => void;
  onReset: () => void;
  onRetry?: () => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ProcessingState({
  state,
  toolName,
  outputFilename,
  outputSize,
  errorMessage,
  onDownload,
  onReset,
  onRetry,
}: ProcessingStateProps) {
  if (state === "idle") return null;

  if (state === "validating" || state === "uploading" || state === "processing") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-border bg-card/60 backdrop-blur-xs space-y-4 animate-in fade-in-0"
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center animate-pulse">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="font-semibold text-base sm:text-lg text-foreground">
            {state === "validating" && "Validating files..."}
            {state === "uploading" && "Uploading document to server..."}
            {state === "processing" && `Processing ${toolName}...`}
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
            {state === "processing"
              ? "Applying operations. Please keep this tab open until the process finishes."
              : "Preparing request payload and checking parameters."}
          </p>
        </div>

        {/* Indeterminate linear progress indicator */}
        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-indeterminate" />
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-5 animate-in zoom-in-95 duration-200"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-1.5">
          <h4 className="font-bold text-lg sm:text-xl text-foreground">
            Document Ready!
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your file has been processed successfully.
          </p>
          {outputFilename && (
            <p className="font-mono text-xs font-medium text-foreground bg-background/80 py-1 px-3 rounded-lg border border-border inline-block mt-1">
              {outputFilename} {outputSize ? `(${formatBytes(outputSize)})` : ""}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onDownload && (
            <Button
              size="lg"
              onClick={onDownload}
              className="gap-2 rounded-xl shadow-sm cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Download Result
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            onClick={onReset}
            className="gap-2 rounded-xl cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            Process Another
          </Button>
        </div>
      </div>
    );
  }

  if (state === "failure") {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-destructive/30 bg-destructive/5 dark:bg-destructive/10 space-y-4 animate-in fade-in-0"
      >
        <div className="w-14 h-14 rounded-2xl bg-destructive/15 text-destructive border border-destructive/30 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-1 max-w-md">
          <h4 className="font-semibold text-base sm:text-lg text-foreground">
            Processing Error
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {errorMessage || "We encountered an issue while processing your document. Please try again."}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          {onRetry && (
            <Button
              variant="default"
              onClick={onRetry}
              className="gap-2 rounded-xl cursor-pointer"
            >
              Try Again
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onReset}
            className="gap-2 rounded-xl cursor-pointer"
          >
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
