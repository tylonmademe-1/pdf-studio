"use client";

import * as React from "react";
import {
  Upload,
  FileText,
  X,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  FileImage,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SelectedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

interface FileUploaderProps {
  accept: string[];
  multiple?: boolean;
  maxSizeMB?: number;
  files: SelectedFile[];
  onFilesChange: (files: SelectedFile[]) => void;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileUploader({
  accept,
  multiple = false,
  maxSizeMB = 100,
  files,
  onFilesChange,
  disabled = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const newFiles: SelectedFile[] = [];

    const fileArray = Array.from(incomingFiles);

    if (!multiple && fileArray.length > 1) {
      setErrorMessage("This tool only accepts a single file at a time.");
      return;
    }

    for (const file of fileArray) {
      // Validate file size
      if (file.size > maxSizeBytes) {
        setErrorMessage(
          `File '${file.name}' exceeds the ${maxSizeMB}MB size limit.`
        );
        return;
      }

      // Validate extension
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
      const isAcceptedExt = accept.some((a) => a.toLowerCase() === ext);

      if (!isAcceptedExt) {
        setErrorMessage(
          `Invalid file format. Allowed formats: ${accept.join(", ")}`
        );
        return;
      }

      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      let previewUrl: string | undefined;

      if (file.type.startsWith("image/")) {
        previewUrl = URL.createObjectURL(file);
      }

      newFiles.push({
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
      });
    }

    if (multiple) {
      onFilesChange([...files, ...newFiles]);
    } else {
      // Revoke any existing object URL
      if (files[0]?.previewUrl) {
        URL.revokeObjectURL(files[0].previewUrl);
      }
      onFilesChange(newFiles.slice(0, 1));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    // Reset input so same file can be re-selected if removed
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemoveFile = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    for (const f of files) {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    }
    onFilesChange([]);
    setErrorMessage(null);
  };

  const handleMoveFile = (index: number, direction: "up" | "down") => {
    const newFiles = [...files];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;

    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIndex];
    newFiles[targetIndex] = temp;

    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      {/* Hidden Native File Input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "relative flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-[#1f1f23] rounded-xl animate-dropzone-idle transition-all cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.005]"
            : "border-[#1f1f23] bg-black hover:border-white/25 hover:bg-[#121216]",
          disabled && "opacity-60 cursor-not-allowed pointer-events-none"
        )}
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
          <Upload className="h-6 w-6" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-foreground">
          {multiple ? "Drop PDF files here, or click to browse" : "Drop your PDF file here, or click to browse"}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-sm">
          Supports {accept.join(", ")} files up to {maxSizeMB}MB
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 px-5 py-2 text-xs font-mono text-neutral-200 bg-[#1e1e1e] group-hover:bg-[#eaeaea] group-hover:text-[#0a0a0a] border border-white/10 group-hover:border-white/40 rounded-full transition-all duration-200 shadow-sm font-medium pointer-events-none"
        >
          Select {multiple ? "Files" : "File"}
        </Button>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in-0"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selected File List */}
      {files.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Selected {files.length} {files.length === 1 ? "file" : "files"}
              {multiple && files.length > 1 && " (drag or use arrows to change merge sequence)"}
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear all</span>
            </button>
          </div>

          <ul className="space-y-2" aria-label="Selected files list">
            {files.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {item.type.startsWith("image/") ? (
                      <FileImage className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(item.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {multiple && files.length > 1 && (
                    <div className="flex items-center border border-border rounded-lg overflow-hidden mr-1">
                      <button
                        type="button"
                        onClick={() => handleMoveFile(index, "up")}
                        disabled={index === 0}
                        aria-label={`Move ${item.name} up`}
                        className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-muted"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveFile(index, "down")}
                        disabled={index === files.length - 1}
                        aria-label={`Move ${item.name} down`}
                        className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-muted"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
