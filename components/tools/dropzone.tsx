"use client";

import * as React from "react";
import {
  UploadCloud,
  FileText,
  X,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DropzoneFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

export interface DropzoneProps {
  files: DropzoneFile[];
  onFilesChange: (files: DropzoneFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function Dropzone({
  files,
  onFilesChange,
  maxFiles = 20,
  maxSizeMB = 100,
  disabled = false,
  className,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateAndAddFiles = (incomingList: FileList | File[]) => {
    setErrorMessage(null);
    const incoming = Array.from(incomingList);
    const validAdditions: DropzoneFile[] = [];

    if (files.length + incoming.length > maxFiles) {
      setErrorMessage(`You can upload a maximum of ${maxFiles} files.`);
      return;
    }

    for (const file of incoming) {
      // Validate file size
      if (file.size > maxSizeBytes) {
        setErrorMessage(
          `"${file.name}" exceeds the maximum allowed size of ${maxSizeMB}MB.`
        );
        return;
      }

      // Validate extension
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        setErrorMessage(`"${file.name}" is not a valid PDF file.`);
        return;
      }

      validAdditions.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        size: file.size,
      });
    }

    if (validAdditions.length > 0) {
      onFilesChange([...files, ...validAdditions]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    // Reset file input so identical files can be selected again if needed
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = (id: string) => {
    if (disabled) return;
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (disabled || index === 0) return;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onFilesChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (disabled || index === files.length - 1) return;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onFilesChange(updated);
  };

  const handleClearAll = () => {
    if (disabled) return;
    onFilesChange([]);
    setErrorMessage(null);
  };

  return (
    <div className={cn("space-y-4 w-full", className)}>
      {/* Hidden Native File Input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
        id="pdf-dropzone-input"
      />

      {/* Drop Target Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative group border border-dashed border-[#1f1f23] rounded-xl py-14 px-6 animate-dropzone-idle text-center transition-all duration-200 cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.008] shadow-md ring-4 ring-primary/10"
            : "border-[#1f1f23] bg-black hover:border-white/25 hover:bg-[#121216]",
          disabled && "opacity-60 cursor-not-allowed hover:border-border hover:bg-card"
        )}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200",
              isDragging
                ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}
          >
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              {isDragging ? "Drop your PDF files here" : "Choose PDFs or drag & drop"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload two or more PDF files to combine. Files remain private and
              processed in local memory.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="px-5 py-2 text-xs font-mono text-neutral-200 bg-[#1e1e1e] group-hover:bg-[#eaeaea] group-hover:text-[#0a0a0a] border border-white/10 group-hover:border-white/40 rounded-full transition-all duration-200 shadow-sm font-medium pointer-events-none"
            >
              Browse Computer
            </Button>
            <span className="text-[11px] text-muted-foreground font-mono">
              Up to {maxSizeMB}MB each
            </span>
          </div>
        </div>
      </div>

      {/* Validation Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 flex items-start gap-3 animate-in fade-in-50 duration-200">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-destructive">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-destructive/70 hover:text-destructive p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected Files List & Reordering Table */}
      {files.length > 0 && (
        <div className="rounded-xl border border-[#1f1f23] bg-black p-5 space-y-4 font-mono transition-all">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Merge Sequence
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                {files.length} {files.length === 1 ? "file" : "files"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => !disabled && inputRef.current?.click()}
                disabled={disabled}
                className="h-8 text-xs gap-1.5 rounded-lg hover:text-foreground"
              >
                <Plus className="w-3.5 h-3.5" />
                Add more
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={disabled}
                className="h-8 text-xs text-muted-foreground hover:text-destructive rounded-lg gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </Button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            The output document will combine pages in the top-to-bottom sequence
            shown below. Use the arrows to adjust order.
          </p>

          <ul className="space-y-2">
            {files.map((item, index) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 hover:bg-muted/50 transition-colors duration-150 group",
                  disabled && "opacity-75"
                )}
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <span className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-[11px] font-mono font-medium text-muted-foreground shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate max-w-[200px] sm:max-w-md">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {formatBytes(item.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Move Up */}
                  <button
                    type="button"
                    title="Move up in merge sequence"
                    disabled={disabled || index === 0}
                    onClick={() => handleMoveUp(index)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    title="Move down in merge sequence"
                    disabled={disabled || index === files.length - 1}
                    onClick={() => handleMoveDown(index)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Remove Item */}
                  <button
                    type="button"
                    title="Remove file"
                    disabled={disabled}
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
