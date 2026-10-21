"use client";

import * as React from "react";
import { ToolDefinition } from "@/types/tool";
import { FileUploader, SelectedFile } from "./file-uploader";
import { ProcessingState, OperationState } from "./processing-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { triggerBlobDownload, extractFilenameFromHeader } from "@/lib/stirling/download";
import {
  RotateCw,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Languages,
  Stamp,
  Hash,
  Maximize,
  PenTool,
  ShieldAlert,
  Split,
  GitCompare,
} from "lucide-react";
import { toast } from "sonner";

interface ToolWorkspaceProps {
  tool: ToolDefinition;
}

export function ToolWorkspace({ tool }: ToolWorkspaceProps) {
  const [files, setFiles] = React.useState<SelectedFile[]>([]);
  const [opState, setOpState] = React.useState<OperationState>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [outputFilename, setOutputFilename] = React.useState<string>("");
  const [outputSize, setOutputSize] = React.useState<number>(0);
  const [engineUsed, setEngineUsed] = React.useState<string>("stirling");
  const resultBlobRef = React.useRef<Blob | null>(null);

  // Tool-specific parameter states
  const [rotateAngle, setRotateAngle] = React.useState<number>(90);
  const [splitPages, setSplitPages] = React.useState<string>("1");
  const [removePages, setRemovePages] = React.useState<string>("1");
  const [extractPages, setExtractPages] = React.useState<string>("1-2");
  const [reorderSequence, setReorderSequence] = React.useState<string>("2, 1");
  const [compressLevel, setCompressLevel] = React.useState<number>(2);
  const [password, setPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [keyLength, setKeyLength] = React.useState<number>(256);
  const [imageFit, setImageFit] = React.useState<string>("maintainAspectRatio");
  const [ocrLanguage, setOcrLanguage] = React.useState<string>("eng");
  const [ocrSidecar, setOcrSidecar] = React.useState<boolean>(false);
  const [watermarkText, setWatermarkText] = React.useState<string>("CONFIDENTIAL");
  const [watermarkOpacity, setWatermarkOpacity] = React.useState<number>(0.4);
  const [pageNumberFormat, setPageNumberFormat] = React.useState<string>("Page {n} of {total}");
  const [pageSize, setPageSize] = React.useState<string>("A4");
  const [redactionQuery, setRedactionQuery] = React.useState<string>("CONFIDENTIAL");
  const [signatoryName, setSignatoryName] = React.useState<string>("Authorized Signatory");
  const [autoSplitPages, setAutoSplitPages] = React.useState<number>(2);

  // Validation rules for primary submit button
  const canSubmit = React.useMemo(() => {
    if (files.length === 0) return false;
    if ((tool.slug === "merge-pdf" || tool.slug === "compare-pdf") && files.length < 2) return false;
    if (tool.slug === "add-password") {
      if (!password || password !== confirmPassword) return false;
    }
    if (tool.slug === "split-pdf" && !splitPages.trim()) return false;
    if (tool.slug === "remove-pages" && !removePages.trim()) return false;
    if (tool.slug === "extract-pages" && !extractPages.trim()) return false;
    if (tool.slug === "add-watermark" && !watermarkText.trim()) return false;
    if (tool.slug === "redact-pdf" && !redactionQuery.trim()) return false;
    if (tool.slug === "sign-pdf" && !signatoryName.trim()) return false;
    return opState === "idle" || opState === "failure";
  }, [
    files,
    tool.slug,
    password,
    confirmPassword,
    splitPages,
    removePages,
    extractPages,
    watermarkText,
    redactionQuery,
    signatoryName,
    opState,
  ]);

  const handleReset = () => {
    setFiles([]);
    setOpState("idle");
    setErrorMessage("");
    setOutputFilename("");
    setOutputSize(0);
    resultBlobRef.current = null;
  };

  const handleDownload = () => {
    if (resultBlobRef.current && outputFilename) {
      triggerBlobDownload(resultBlobRef.current, outputFilename);
      toast.success("Download started!");
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setErrorMessage("");
    setOpState("validating");

    try {
      // 1. Client-side parameter validation
      if ((tool.slug === "merge-pdf" || tool.slug === "compare-pdf") && files.length < 2) {
        throw new Error("Please select at least 2 PDF files.");
      }
      if (tool.slug === "add-password") {
        if (!password) throw new Error("Please enter a password.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
      }

      setOpState("uploading");

      // 2. Build FormData
      const formData = new FormData();
      for (const item of files) {
        formData.append("fileInput", item.file, item.name);
      }

      // Append specific tool parameters
      if (tool.slug === "rotate-pdf") {
        formData.append("angle", String(rotateAngle));
      } else if (tool.slug === "split-pdf") {
        formData.append("pages", splitPages.trim());
      } else if (tool.slug === "remove-pages") {
        formData.append("pages", removePages.trim());
      } else if (tool.slug === "extract-pages") {
        formData.append("pages", extractPages.trim());
      } else if (tool.slug === "reorder-pages") {
        formData.append("pages", reorderSequence.trim());
      } else if (tool.slug === "compress-pdf") {
        formData.append("optimizeLevel", String(compressLevel));
      } else if (tool.slug === "add-password") {
        formData.append("password", password);
        formData.append("keyLength", String(keyLength));
      } else if (tool.slug === "remove-password") {
        if (password) formData.append("password", password);
      } else if (tool.slug === "add-watermark") {
        formData.append("watermarkText", watermarkText.trim());
        formData.append("opacity", String(watermarkOpacity));
      } else if (tool.slug === "add-page-numbers") {
        formData.append("customText", pageNumberFormat.trim());
      } else if (tool.slug === "scale-pdf") {
        formData.append("pageSize", pageSize);
      } else if (tool.slug === "redact-pdf") {
        formData.append("redactionText", redactionQuery.trim());
      } else if (tool.slug === "sign-pdf") {
        formData.append("signatoryName", signatoryName.trim());
      } else if (tool.slug === "auto-split") {
        formData.append("pagesPerSplit", String(autoSplitPages));
      } else if (tool.slug === "image-to-pdf") {
        formData.append("fitOption", imageFit);
      } else if (tool.slug === "ocr-pdf") {
        formData.append("languages", ocrLanguage);
        formData.append("sidecar", String(ocrSidecar));
      }

      setOpState("processing");

      // 3. Dispatch to API Route Handler
      const response = await fetch(`/api/tools/${tool.slug}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Processing failed with status ${response.status}.`
        );
      }

      // 4. Handle successful binary response
      const blob = await response.blob();
      resultBlobRef.current = blob;

      const cd = response.headers.get("content-disposition");
      const engine = response.headers.get("x-processing-engine") || "stirling";
      let fallbackExt = ".pdf";
      if (tool.slug === "pdf-to-word") fallbackExt = ".docx";
      else if (tool.slug === "pdf-to-text") fallbackExt = ".txt";
      else if (tool.slug === "pdf-to-image" || tool.slug === "extract-images" || tool.slug === "auto-split") fallbackExt = ".zip";

      const fallbackName = `${tool.slug}-result${fallbackExt}`;
      const safeFilename = extractFilenameFromHeader(cd, fallbackName);

      setOutputFilename(safeFilename);
      setOutputSize(blob.size);
      setEngineUsed(engine);
      setOpState("success");

      toast.success(`${tool.name} finished successfully!`);
      // Auto-trigger download for convenience
      triggerBlobDownload(blob, safeFilename);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      setErrorMessage(msg);
      setOpState("failure");
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Processing or Result State View */}
      {opState !== "idle" && (
        <ProcessingState
          state={opState}
          toolName={tool.name}
          outputFilename={outputFilename}
          outputSize={outputSize}
          engineUsed={engineUsed}
          errorMessage={errorMessage}
          onDownload={handleDownload}
          onReset={handleReset}
          onRetry={handleSubmit}
        />
      )}

      {/* Upload & Option Controls Area (visible when idle or failure) */}
      {(opState === "idle" || opState === "failure") && (
        <div className="space-y-6">
          <FileUploader
            accept={tool.acceptedFileTypes}
            multiple={tool.supportsMultipleFiles}
            files={files}
            onFilesChange={setFiles}
            disabled={opState !== "idle" && opState !== "failure"}
          />

          {/* Tool Options Configuration Panel */}
          {files.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5 animate-in fade-in-0 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Configure Options
                </h3>
                <span className="text-xs text-muted-foreground">
                  {files.length} {files.length === 1 ? "file loaded" : "files loaded"}
                </span>
              </div>

              {/* 1. Merge PDF Options */}
              {tool.slug === "merge-pdf" && (
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>
                    All loaded PDF files will be concatenated in the exact sequence displayed
                    in the file list above. Use the arrow buttons on each file row to reorder.
                  </p>
                  {files.length < 2 && (
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      Select at least 2 files to enable merge.
                    </p>
                  )}
                </div>
              )}

              {/* 2. Rotate PDF Options */}
              {tool.slug === "rotate-pdf" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground block">
                    Rotation Angle (Clockwise)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setRotateAngle(deg)}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                          rotateAngle === deg
                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                            : "border-border bg-card hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <RotateCw className={`h-4 w-4 ${deg === 180 ? "rotate-90" : deg === 270 ? "rotate-180" : ""}`} />
                        <span>{deg}°</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Split PDF Options */}
              {tool.slug === "split-pdf" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground block">
                    Page Selection / Range
                  </label>
                  <Input
                    value={splitPages}
                    onChange={(e) => setSplitPages(e.target.value)}
                    placeholder="e.g. 1-3, 5 or all"
                    className="h-10 text-sm font-mono"
                  />
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => setSplitPages("1")}
                      className="underline hover:text-foreground cursor-pointer"
                    >
                      First page
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSplitPages("1-3")}
                      className="underline hover:text-foreground cursor-pointer"
                    >
                      Pages 1 to 3
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSplitPages("all")}
                      className="underline hover:text-foreground cursor-pointer"
                    >
                      All pages
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Compress PDF Options */}
              {tool.slug === "compress-pdf" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground block">
                    Compression Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { level: 1, name: "Low", desc: "Best quality, modest size reduction" },
                      { level: 2, name: "Medium", desc: "Recommended balance for web and email" },
                      { level: 3, name: "High", desc: "Aggressive reduction for maximum space saving" },
                    ].map((opt) => (
                      <button
                        key={opt.level}
                        type="button"
                        onClick={() => setCompressLevel(opt.level)}
                        className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          compressLevel === opt.level
                            ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
                            : "border-border bg-card hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="font-semibold text-sm text-foreground">
                          {opt.name}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {opt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Add Password Options */}
              {tool.slug === "add-password" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground block">
                        Set Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter document password"
                          className="pr-10 h-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground block">
                        Confirm Password
                      </label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="keyLength"
                        checked={keyLength === 256}
                        onChange={() => setKeyLength(256)}
                        className="accent-primary"
                      />
                      <span>AES 256-bit encryption (Recommended)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="keyLength"
                        checked={keyLength === 128}
                        onChange={() => setKeyLength(128)}
                        className="accent-primary"
                      />
                      <span>128-bit standard</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 6. Image to PDF Options */}
              {tool.slug === "image-to-pdf" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground block">
                    Page Layout & Image Fit
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "maintainAspectRatio", name: "Fit & Center", desc: "Preserve exact dimensions without stretching" },
                      { id: "fillPage", name: "Fill Page", desc: "Crop and fill standard page bounds" },
                      { id: "fitPage", name: "Stretch to Margin", desc: "Scale image to document margins" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setImageFit(opt.id)}
                        className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          imageFit === opt.id
                            ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
                            : "border-border bg-card hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="font-semibold text-xs text-foreground">
                          {opt.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">
                          {opt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. OCR PDF Options */}
              {tool.slug === "ocr-pdf" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center gap-2">
                      <Languages className="h-4 w-4 text-primary" />
                      OCR Language Recognition
                    </label>
                    <select
                      value={ocrLanguage}
                      onChange={(e) => setOcrLanguage(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="eng">English (eng)</option>
                      <option value="spa">Spanish (spa)</option>
                      <option value="fra">French (fra)</option>
                      <option value="deu">German (deu)</option>
                      <option value="ita">Italian (ita)</option>
                      <option value="por">Portuguese (por)</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ocrSidecar}
                      onChange={(e) => setOcrSidecar(e.target.checked)}
                      className="rounded border-border text-primary accent-primary"
                    />
                    <span>Generate sidecar text file alongside searchable PDF</span>
                  </label>
                </div>
              )}

              {/* 8. Remove Pages Options */}
              {tool.slug === "remove-pages" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground block">
                    Pages to Remove
                  </label>
                  <Input
                    value={removePages}
                    onChange={(e) => setRemovePages(e.target.value)}
                    placeholder="e.g. 1, 3-5"
                    className="h-10 text-sm font-mono"
                  />
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => setRemovePages("1")}
                      className="underline hover:text-foreground cursor-pointer"
                    >
                      First page
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setRemovePages("1, 2")}
                      className="underline hover:text-foreground cursor-pointer"
                    >
                      First 2 pages
                    </button>
                  </div>
                </div>
              )}

              {/* 9. Extract Pages Options */}
              {tool.slug === "extract-pages" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground block">
                    Pages to Extract into New PDF
                  </label>
                  <Input
                    value={extractPages}
                    onChange={(e) => setExtractPages(e.target.value)}
                    placeholder="e.g. 1-2, 5"
                    className="h-10 text-sm font-mono"
                  />
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => setExtractPages("1")}
                      className="underline hover:text-foreground cursor-pointer"
                    >
                      Page 1 only
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setExtractPages("1-3")}
                      className="underline hover:text-foreground cursor-pointer"
                    >
                      Pages 1 to 3
                    </button>
                  </div>
                </div>
              )}

              {/* 10. Reorder Pages Options */}
              {tool.slug === "reorder-pages" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground block">
                    Desired Page Sequence
                  </label>
                  <Input
                    value={reorderSequence}
                    onChange={(e) => setReorderSequence(e.target.value)}
                    placeholder="e.g. 2, 1, 3"
                    className="h-10 text-sm font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Specify the full sequence of original 1-indexed page numbers.
                  </p>
                </div>
              )}

              {/* 11. Add Watermark Options */}
              {tool.slug === "add-watermark" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center gap-2">
                      <Stamp className="h-4 w-4 text-primary" />
                      Watermark Stamp Text
                    </label>
                    <Input
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>Quick presets:</span>
                    {["CONFIDENTIAL", "DRAFT", "COPY", "DO NOT DISTRIBUTE"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWatermarkText(preset)}
                        className="underline hover:text-foreground cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">
                      Stamp Opacity: {Math.round(watermarkOpacity * 100)}%
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 0.2, label: "Subtle (20%)" },
                        { val: 0.4, label: "Medium (40%)" },
                        { val: 0.7, label: "Bold (70%)" },
                      ].map((op) => (
                        <button
                          key={op.val}
                          type="button"
                          onClick={() => setWatermarkOpacity(op.val)}
                          className={`py-2 px-3 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                            watermarkOpacity === op.val
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border bg-card text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 12. Add Page Numbers Options */}
              {tool.slug === "add-page-numbers" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    Pagination Format
                  </label>
                  <Input
                    value={pageNumberFormat}
                    onChange={(e) => setPageNumberFormat(e.target.value)}
                    placeholder="Page {n} of {total}"
                    className="h-10 text-sm font-mono"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {[
                      "Page {n} of {total}",
                      "{n} / {total}",
                      "Page {n}",
                    ].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setPageNumberFormat(fmt)}
                        className={`py-2 px-3 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                          pageNumberFormat === fmt
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 13. Scale PDF Options */}
              {tool.slug === "scale-pdf" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground flex items-center gap-2">
                    <Maximize className="h-4 w-4 text-primary" />
                    Target Document Page Size
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "A4", name: "A4", desc: "210 × 297 mm" },
                      { id: "LETTER", name: "Letter", desc: "8.5 × 11 in" },
                      { id: "A3", name: "A3", desc: "297 × 420 mm" },
                      { id: "LEGAL", name: "Legal", desc: "8.5 × 14 in" },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setPageSize(sz.id)}
                        className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                          pageSize === sz.id
                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="font-semibold text-xs text-foreground">{sz.name}</div>
                        <div className="text-[10px] text-muted-foreground">{sz.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 14. Auto Split Options */}
              {tool.slug === "auto-split" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground flex items-center gap-2">
                    <Split className="h-4 w-4 text-primary" />
                    Split Interval (Pages per output PDF)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 5, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAutoSplitPages(n)}
                        className={`py-2.5 px-3 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                          autoSplitPages === n
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Every {n} pages
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 15. Redact PDF Options */}
              {tool.slug === "redact-pdf" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    Text / Query to Redact (Permanently Black Out)
                  </label>
                  <Input
                    value={redactionQuery}
                    onChange={(e) => setRedactionQuery(e.target.value)}
                    placeholder="Enter confidential word or pattern to black out"
                    className="h-10 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    All matching text occurrences across all pages will be permanently removed.
                  </p>
                </div>
              )}

              {/* 16. Sign PDF Options */}
              {tool.slug === "sign-pdf" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-primary" />
                    Signatory Full Name or Title
                  </label>
                  <Input
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    placeholder="e.g. Jane Doe, Senior Director"
                    className="h-10 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Applies a cryptographically verified signature endorsement stamp to the final page.
                  </p>
                </div>
              )}

              {/* 17. Compare PDF Options */}
              {tool.slug === "compare-pdf" && (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <GitCompare className="h-4 w-4 text-primary" />
                    Comparing Revisions
                  </div>
                  <p>
                    File 1 will be compared against File 2. Any textual and layout modifications
                    will be highlighted in a comparison markup document.
                  </p>
                  {files.length < 2 && (
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      Please upload both document versions to enable comparison.
                    </p>
                  )}
                </div>
              )}

              {/* 18. Remove Password Options */}
              {tool.slug === "remove-password" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground block">
                    Current Password (If Encrypted)
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to unlock"
                    className="h-10 text-sm"
                  />
                </div>
              )}

              {/* Submit Action Button */}
              <div className="pt-2 flex justify-end">
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="rounded-xl px-6 gap-2 cursor-pointer shadow-sm"
                >
                  <span>{tool.name}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
