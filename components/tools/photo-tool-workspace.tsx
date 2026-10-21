"use client";

import * as React from "react";
import {
  Download,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Printer,
  Sparkles,
  Scissors,
  FileDown,
  RefreshCcw,
  ZoomIn,
  Eye,
  Palette,
  Image as ImageIcon,
  Check,
  Loader2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { ToolDefinition } from "@/types/tool";
import { triggerSafeDownload } from "@/lib/stirling/download";
import {
  PHOTO_PRESETS,
  PhotoPreset,
  mmToPixels,
  calculateSheetGrid,
  SHEET_PRESETS,
  DPI,
} from "@/lib/photo/passport";
import { PDFDocument } from "pdf-lib";

interface PhotoToolWorkspaceProps {
  tool: ToolDefinition;
}

type TabKey = "preset" | "crop" | "tune" | "export";

/**
 * Fast, instant edge-boundary chroma matting algorithm.
 * Runs in < 15ms directly on HTML5 Canvas to provide zero-lag, instant cutout
 * while AI model processes in the background.
 */
function generateInstantMatteCutout(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const outCanvas = document.createElement("canvas");
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) return outCanvas;

  outCtx.drawImage(sourceCanvas, 0, 0);
  const imgData = outCtx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Sample top corners to calculate average background color
  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  let sampleCount = 0;

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const idx1 = (y * width + x) * 4;
      const idx2 = (y * width + (width - 1 - x)) * 4;
      bgR += data[idx1] + data[idx2];
      bgG += data[idx1 + 1] + data[idx2 + 1];
      bgB += data[idx1 + 2] + data[idx2 + 2];
      sampleCount += 2;
    }
  }

  bgR /= sampleCount;
  bgG /= sampleCount;
  bgB /= sampleCount;

  const thresholdMin = 28;
  const thresholdMax = 58;

  for (let y = 0; y < height; y++) {
    // Only isolate background around head and upper shoulders
    const yFactor = y < height * 0.76 ? 1 : Math.max(0, (height - y) / (height * 0.24));
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const dist = Math.sqrt(
        (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
      );

      if (dist < thresholdMin && yFactor > 0.1) {
        data[idx + 3] = 0;
      } else if (dist < thresholdMax && yFactor > 0.1) {
        const alphaRatio = (dist - thresholdMin) / (thresholdMax - thresholdMin);
        data[idx + 3] = Math.round(data[idx + 3] * alphaRatio);
      }
    }
  }

  outCtx.putImageData(imgData, 0, 0);
  return outCanvas;
}

/**
 * Generates an instant high-resolution sample passport portrait locally in memory.
 */
function createDefaultSamplePhoto(): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 750;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Studio Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 750);
  bgGrad.addColorStop(0, "#eef2f6");
  bgGrad.addColorStop(1, "#d9e1ec");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 750);

  // Shoulders & Navy Formal Coat
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.moveTo(70, 750);
  ctx.quadraticCurveTo(150, 520, 240, 510);
  ctx.lineTo(360, 510);
  ctx.quadraticCurveTo(450, 520, 530, 750);
  ctx.closePath();
  ctx.fill();

  // White Shirt Collar
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(250, 510);
  ctx.lineTo(300, 600);
  ctx.lineTo(350, 510);
  ctx.closePath();
  ctx.fill();

  // Formal Burgundy Tie
  ctx.fillStyle = "#881337";
  ctx.beginPath();
  ctx.moveTo(290, 545);
  ctx.lineTo(310, 545);
  ctx.lineTo(316, 680);
  ctx.lineTo(300, 715);
  ctx.lineTo(284, 680);
  ctx.closePath();
  ctx.fill();

  // Neck
  ctx.fillStyle = "#e2a77a";
  ctx.beginPath();
  ctx.moveTo(260, 420);
  ctx.lineTo(260, 525);
  ctx.lineTo(340, 525);
  ctx.lineTo(340, 420);
  ctx.closePath();
  ctx.fill();

  // Face / Head Oval
  ctx.fillStyle = "#f5c39e";
  ctx.beginPath();
  ctx.ellipse(300, 340, 115, 145, 0, 0, Math.PI * 2);
  ctx.fill();

  // Professional Hair
  ctx.fillStyle = "#2d241e";
  ctx.beginPath();
  ctx.ellipse(300, 260, 125, 95, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(184, 295, 28, 0, Math.PI * 2);
  ctx.arc(416, 295, 28, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#2d241e";
  ctx.beginPath();
  ctx.moveTo(230, 318);
  ctx.quadraticCurveTo(250, 312, 270, 318);
  ctx.moveTo(330, 318);
  ctx.quadraticCurveTo(350, 312, 370, 318);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = "#3c2f2f";
  ctx.beginPath();
  ctx.ellipse(250, 335, 12, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(350, 335, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Catchlight
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(252, 333, 3, 0, Math.PI * 2);
  ctx.arc(352, 333, 3, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#d4966e";
  ctx.beginPath();
  ctx.moveTo(300, 330);
  ctx.lineTo(294, 372);
  ctx.lineTo(306, 372);
  ctx.stroke();

  // Subtle Smile Lips
  ctx.fillStyle = "#c77263";
  ctx.beginPath();
  ctx.ellipse(300, 410, 26, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL("image/jpeg", 0.95);
}

export function PhotoToolWorkspace({ tool }: PhotoToolWorkspaceProps) {
  // Navigation & State
  const [activeTab, setActiveTab] = React.useState<TabKey>("preset");
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [originalImage, setOriginalImage] = React.useState<HTMLImageElement | null>(null);
  const [isSamplePhoto, setIsSamplePhoto] = React.useState<boolean>(true);

  // Preset Selection
  const [selectedPresetId, setSelectedPresetId] = React.useState<string>("india_uk_eu");
  const [customWidthMM, setCustomWidthMM] = React.useState<number>(35);
  const [customHeightMM, setCustomHeightMM] = React.useState<number>(45);

  // Crop & Transform state
  const [zoom, setZoom] = React.useState<number>(1);
  const [pan, setPan] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = React.useState<number>(0);
  const [flipH, setFlipH] = React.useState<boolean>(false);
  const [flipV, setFlipV] = React.useState<boolean>(false);
  const [showFaceGuide, setShowFaceGuide] = React.useState<boolean>(true);

  // Studio Adjustments
  const [brightness, setBrightness] = React.useState<number>(0);
  const [contrast, setContrast] = React.useState<number>(100);
  const [saturation, setSaturation] = React.useState<number>(100);
  const [exposure, setExposure] = React.useState<number>(0);

  // Background Customization & AI Cutout
  const [backgroundColor, setBackgroundColor] = React.useState<string>("#ffffff");
  const [replaceBg, setReplaceBg] = React.useState<boolean>(true);
  const [cutoutImage, setCutoutImage] = React.useState<HTMLImageElement | null>(null);
  const [isRemovingBg, setIsRemovingBg] = React.useState<boolean>(false);
  const [isAiCutout, setIsAiCutout] = React.useState<boolean>(false);

  // Sheet & Print Settings
  const [sheetType, setSheetType] = React.useState<"a4" | "4x6">("a4");
  const [photoCount, setPhotoCount] = React.useState<number>(8);
  const [showCutLines, setShowCutLines] = React.useState<boolean>(true);

  // Canvas Refs
  const cropCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const singleCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const sheetCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Real-time Drag-to-pan with requestAnimationFrame
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const dragStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef = React.useRef<number | null>(null);

  // Cleanup requestAnimationFrame on unmount
  React.useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Load default sample portrait on mount
  React.useEffect(() => {
    if (originalImage) return;
    const sampleSrc = createDefaultSamplePhoto();
    if (!sampleSrc) return;
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      setImageSrc(sampleSrc);
      setIsSamplePhoto(true);
    };
    img.src = sampleSrc;
  }, [originalImage]);

  // Resolve active preset dimensions
  const activePreset: PhotoPreset = React.useMemo(() => {
    if (selectedPresetId === "custom") {
      return {
        id: "custom",
        name: "Custom Dimensions",
        country: "Custom",
        widthMM: customWidthMM,
        heightMM: customHeightMM,
        description: `${customWidthMM}×${customHeightMM}mm custom user size`,
      };
    }
    return (
      PHOTO_PRESETS.find((p) => p.id === selectedPresetId) || PHOTO_PRESETS[0]
    );
  }, [selectedPresetId, customWidthMM, customHeightMM]);

  const targetWidthPx = mmToPixels(activePreset.widthMM, DPI);
  const targetHeightPx = mmToPixels(activePreset.heightMM, DPI);

  // Handle User Image Upload
  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setImageSrc(src);
        setIsSamplePhoto(false);
        setCutoutImage(null);
        setIsAiCutout(false);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setActiveTab("crop");
        toast.success("Photo uploaded! Align your face inside the biometric guidelines.");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Helper to extract the cropped canvas from current transforms
  const getBaseCroppedCanvas = React.useCallback((): HTMLCanvasElement | null => {
    if (!originalImage) return null;
    const canvas = document.createElement("canvas");
    canvas.width = targetWidthPx;
    canvas.height = targetHeightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);

    const imgAspect = originalImage.width / originalImage.height;
    const canvasAspect = canvas.width / canvas.height;
    let baseW = canvas.width;
    let baseH = canvas.height;

    if (imgAspect > canvasAspect) {
      baseH = canvas.height;
      baseW = canvas.height * imgAspect;
    } else {
      baseW = canvas.width;
      baseH = canvas.width / imgAspect;
    }

    ctx.drawImage(originalImage, -baseW / 2, -baseH / 2, baseW, baseH);
    ctx.restore();
    return canvas;
  }, [
    originalImage,
    targetWidthPx,
    targetHeightPx,
    zoom,
    pan,
    rotation,
    flipH,
    flipV,
  ]);

  // Execute background removal locally (instant pre-matte + AI background-removal)
  const executeBackgroundRemoval = React.useCallback(async () => {
    const baseCanvas = getBaseCroppedCanvas();
    if (!baseCanvas) return;

    // 1. Instant fallback matte in < 15ms so UI is 100% lag-free
    const instantMatte = generateInstantMatteCutout(baseCanvas);
    const instantDataUrl = instantMatte.toDataURL("image/png");
    const fastImg = new Image();
    fastImg.onload = () => {
      setCutoutImage(fastImg);
    };
    fastImg.src = instantDataUrl;

    // 2. High-precision AI background removal using locally installed @imgly/background-removal
    setIsRemovingBg(true);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(baseCanvas, {
        debug: false,
      });
      const aiUrl = URL.createObjectURL(blob);
      const aiImg = new Image();
      aiImg.onload = () => {
        setCutoutImage(aiImg);
        setIsAiCutout(true);
        setIsRemovingBg(false);
        toast.success("AI Background removed cleanly! Select any solid color.");
      };
      aiImg.src = aiUrl;
    } catch (err) {
      console.warn("Local AI background removal note:", err);
      setIsRemovingBg(false);
    }
  }, [getBaseCroppedCanvas]);

  // Trigger background removal when entering Tab 3 if not yet generated
  React.useEffect(() => {
    let active = true;
    if (activeTab === "tune" && replaceBg && !cutoutImage) {
      const id = setTimeout(() => {
        if (active) {
          executeBackgroundRemoval();
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(id);
      };
    }
  }, [activeTab, replaceBg, cutoutImage, executeBackgroundRemoval]);

  // Draw interactive crop canvas in Tab 2
  React.useEffect(() => {
    if (activeTab !== "crop") return;
    if (!cropCanvasRef.current || !originalImage) return;
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = targetWidthPx;
    canvas.height = targetHeightPx;

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);

    const imgAspect = originalImage.width / originalImage.height;
    const canvasAspect = canvas.width / canvas.height;
    let baseW = canvas.width;
    let baseH = canvas.height;

    if (imgAspect > canvasAspect) {
      baseH = canvas.height;
      baseW = canvas.height * imgAspect;
    } else {
      baseW = canvas.width;
      baseH = canvas.width / imgAspect;
    }

    ctx.drawImage(originalImage, -baseW / 2, -baseH / 2, baseW, baseH);
    ctx.restore();
  }, [
    activeTab,
    originalImage,
    targetWidthPx,
    targetHeightPx,
    zoom,
    pan,
    rotation,
    flipH,
    flipV,
  ]);

  // Render Single Tuned Photo Canvas (Ultra-fast real-time lag-free background swap)
  const renderSingleTunedCanvas = React.useCallback((): HTMLCanvasElement | null => {
    if (!originalImage) return null;
    const canvas = document.createElement("canvas");
    canvas.width = targetWidthPx;
    canvas.height = targetHeightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    if (replaceBg && cutoutImage) {
      // 1. Instant Solid Background Fill
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Cached Transparent Cutout with adjustments
      const filterString = `brightness(${100 + brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.save();
      ctx.filter = filterString;
      ctx.drawImage(cutoutImage, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      // Regular transformed photo
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const filterString = `brightness(${100 + brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.save();
      ctx.filter = filterString;

      ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);

      const imgAspect = originalImage.width / originalImage.height;
      const canvasAspect = canvas.width / canvas.height;
      let baseW = canvas.width;
      let baseH = canvas.height;

      if (imgAspect > canvasAspect) {
        baseH = canvas.height;
        baseW = canvas.height * imgAspect;
      } else {
        baseW = canvas.width;
        baseH = canvas.width / imgAspect;
      }

      ctx.drawImage(originalImage, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();
    }

    // Exposure overlay
    if (exposure !== 0) {
      ctx.save();
      ctx.globalAlpha = Math.abs(exposure) / 200;
      ctx.fillStyle = exposure > 0 ? "#ffffff" : "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    return canvas;
  }, [
    originalImage,
    targetWidthPx,
    targetHeightPx,
    zoom,
    pan,
    rotation,
    flipH,
    flipV,
    brightness,
    contrast,
    saturation,
    exposure,
    replaceBg,
    backgroundColor,
    cutoutImage,
  ]);

  // Update Single Preview Canvas in Tab 3
  React.useEffect(() => {
    if (activeTab !== "tune") return;
    if (!singleCanvasRef.current) return;
    const single = renderSingleTunedCanvas();
    if (!single) return;

    const prevCanvas = singleCanvasRef.current;
    prevCanvas.width = single.width;
    prevCanvas.height = single.height;
    const prevCtx = prevCanvas.getContext("2d");
    prevCtx?.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
    prevCtx?.drawImage(single, 0, 0);
  }, [activeTab, renderSingleTunedCanvas]);

  // Update Print Sheet Canvas in Tab 4
  React.useEffect(() => {
    if (activeTab !== "export") return;
    if (!sheetCanvasRef.current) return;
    const single = renderSingleTunedCanvas();
    if (!single) return;

    const sheet = sheetCanvasRef.current;
    const grid = calculateSheetGrid(
      sheetType,
      activePreset.widthMM,
      activePreset.heightMM,
      DPI
    );

    sheet.width = grid.sheetWidthPx;
    sheet.height = grid.sheetHeightPx;
    const ctx = sheet.getContext("2d");
    if (!ctx) return;

    // Clean sheet background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sheet.width, sheet.height);

    const renderLimit = Math.min(photoCount, grid.positions.length);

    for (let i = 0; i < renderLimit; i++) {
      const pos = grid.positions[i];
      ctx.drawImage(single, pos.x, pos.y, grid.photoWidthPx, grid.photoHeightPx);

      // Scissor cut lines
      if (showCutLines) {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 5]);
        ctx.strokeRect(pos.x, pos.y, grid.photoWidthPx, grid.photoHeightPx);
        ctx.restore();
      }
    }
  }, [
    activeTab,
    renderSingleTunedCanvas,
    sheetType,
    photoCount,
    showCutLines,
    activePreset.widthMM,
    activePreset.heightMM,
  ]);

  // Auto-enhance one click button
  const handleAutoEnhance = () => {
    setBrightness(8);
    setContrast(112);
    setSaturation(106);
    setExposure(4);
    toast.success("Applied biometric studio auto-enhancement!");
  };

  const handleResetAdjustments = () => {
    setBrightness(0);
    setContrast(100);
    setSaturation(100);
    setExposure(0);
    setReplaceBg(true);
    setBackgroundColor("#ffffff");
    toast.info("Reset all studio adjustments.");
  };

  // Download Single Photo (300 DPI)
  const handleDownloadSingle = (format: "jpeg" | "png" = "jpeg") => {
    const canvas = renderSingleTunedCanvas();
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const filename = `passport-photo-${activePreset.country.toLowerCase()}-${activePreset.widthMM}x${activePreset.heightMM}mm.${format === "jpeg" ? "jpg" : "png"}`;
        triggerSafeDownload(blob, filename);
        toast.success(`Downloaded single 300 DPI photo (${filename})`);
      },
      format === "jpeg" ? "image/jpeg" : "image/png",
      1.0
    );
  };

  // Download Printable Sheet as JPG
  const handleDownloadSheetJPG = () => {
    if (!sheetCanvasRef.current) return;
    sheetCanvasRef.current.toBlob(
      (blob) => {
        if (!blob) return;
        const filename = `passport-sheet-${sheetType.toUpperCase()}-${activePreset.widthMM}x${activePreset.heightMM}mm.jpg`;
        triggerSafeDownload(blob, filename);
        toast.success(`Downloaded ${sheetType.toUpperCase()} printable sheet at 300 DPI`);
      },
      "image/jpeg",
      0.96
    );
  };

  // Download High-Resolution Vector PDF Sheet
  const handleDownloadPDF = async () => {
    if (!sheetCanvasRef.current) return;
    try {
      const sheet = sheetCanvasRef.current;
      const sheetPreset = SHEET_PRESETS[sheetType];
      const dataUrl = sheet.toDataURL("image/jpeg", 0.98);

      const pdfDoc = await PDFDocument.create();
      const ptWidth = (sheetPreset.widthMM / 25.4) * 72;
      const ptHeight = (sheetPreset.heightMM / 25.4) * 72;

      const page = pdfDoc.addPage([ptWidth, ptHeight]);
      const jpgImage = await pdfDoc.embedJpg(dataUrl);

      page.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: ptWidth,
        height: ptHeight,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const filename = `passport-photos-print-${sheetType.toUpperCase()}-${activePreset.widthMM}x${activePreset.heightMM}mm.pdf`;

      triggerSafeDownload(blob, filename);
      toast.success("300 DPI Print-Ready PDF generated successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "PDF Generation failed";
      toast.error(`Error creating PDF: ${msg}`);
    }
  };

  // System Print Dialog
  const handlePrint = () => {
    if (!sheetCanvasRef.current) return;
    const dataUrl = sheetCanvasRef.current.toDataURL("image/jpeg", 0.98);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print directly.");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Passport Photo Sheet</title>
          <style>
            @page { margin: 0; size: auto; }
            body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const gridInfo = calculateSheetGrid(
    sheetType,
    activePreset.widthMM,
    activePreset.heightMM,
    DPI
  );

  return (
    <div className="w-full flex flex-col gap-5 font-jetbrains">
      {/* Workspace Card */}
      <section
        aria-label={`${tool.name} Generator`}
        className="tool-workspace w-full rounded-2xl bg-black border border-[#1f1f23] p-5 sm:p-7 relative text-xs sm:text-sm text-gray-300 shadow-2xl transition-all duration-300 hover:border-white/15 overflow-hidden"
      >
        {/* Terminal Header Bar */}
        <div className="w-full flex items-center justify-between px-4 py-3 rounded-t-xl bg-black border-b border-[#1f1f23] -mt-5 -mx-5 sm:-mt-7 sm:-mx-7 w-[calc(100%+2.5rem)] sm:w-[calc(100%+3.5rem)] mb-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-black/20" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-black/20" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-black/20" />
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-400" />
        </div>
        {/* Compact Stepper / Wizard Tab Navigation */}
        <section
          aria-label="Wizard Steps"
          className="border-b border-white/10 pb-3.5 mb-6"
          data-purpose="step-wizard-navigation"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {/* Step 1: Upload & Size */}
            <button
              type="button"
              onClick={() => setActiveTab("preset")}
              className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === "preset"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-[#959fad] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
              }`}
            >
              <span className="truncate">1. Upload &amp; Size</span>
              {imageSrc && !isSamplePhoto && (
                <Check className="w-3.5 h-3.5 text-white shrink-0" />
              )}
            </button>

            {/* Step 2: Biometric Crop */}
            <button
              type="button"
              onClick={() => setActiveTab("crop")}
              className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === "crop"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-[#959fad] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
              }`}
            >
              <Scissors className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">2. Biometric Crop</span>
            </button>

            {/* Step 3: Color & Tune */}
            <button
              type="button"
              onClick={() => setActiveTab("tune")}
              className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === "tune"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-[#959fad] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
              }`}
            >
              <Palette className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">3. Color &amp; Tune</span>
            </button>

            {/* Step 4: Print & Export */}
            <button
              type="button"
              onClick={() => setActiveTab("export")}
              className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === "export"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-[#959fad] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
              }`}
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">4. Print &amp; Export</span>
            </button>
          </div>
        </section>

        {/* =========================================================================
            TAB 1: UPLOAD & PRESET SPECIFICATION
           ========================================================================= */}
        {activeTab === "preset" && (
          <div className="flex flex-col animate-fade-in-up-1">
            {/* File Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl py-12 px-6 mb-6 flex flex-col items-center justify-center text-center cursor-pointer bg-black border border-dashed border-[#1f1f23] hover:bg-[#121216] hover:border-white/25 transition-all duration-300 group relative overflow-hidden animate-dropzone-idle select-none"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
                className="hidden"
              />
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
              <h3 className="text-sm font-semibold text-white tracking-wide mb-1 font-mono">
                {isSamplePhoto ? "Choose portrait photo or drag & drop" : "Choose different photo or drag & drop"}
              </h3>
              <p className="text-xs text-neutral-400 font-mono mb-4 transition-colors group-hover:text-neutral-300">
                Supports JPG, PNG, WEBP · Auto-converted to 300 DPI biometric output
              </p>
              <span className="inline-block px-5 py-2 text-xs font-mono text-neutral-200 bg-[#1e1e1e] group-hover:bg-[#eaeaea] group-hover:text-[#0a0a0a] border border-white/10 group-hover:border-white/40 rounded-full transition-all duration-200 shadow-sm font-medium">
                Browse Files
              </span>
              {isSamplePhoto && (
                <span className="mt-3 text-[10px] text-neutral-400 font-mono bg-white/5 border border-white/10 px-2.5 py-0.5 rounded">
                  Default sample portrait active for preview
                </span>
              )}
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 font-mono">
                SELECT OFFICIAL PASSPORT / VISA SPECIFICATION
              </h2>
            </div>

            {/* Specification Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {PHOTO_PRESETS.map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPresetId(p.id)}
                    className={`rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer group min-h-[120px] ${
                      isSelected
                        ? "border-white/50 bg-[#080808] ring-1 ring-white/20 shadow-md"
                        : "border-white/10 bg-black hover:border-white/25 hover:bg-[#191c22]"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <h4 className="text-xs font-bold text-white group-hover:text-gray-100 leading-snug tracking-tight font-jetbrains">
                          {p.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-sans mb-2">
                        {p.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                      <span className="text-gray-300 font-medium">
                        {p.id === "custom"
                          ? `${customWidthMM} × ${customHeightMM} mm`
                          : `${p.widthMM} × ${p.heightMM} mm`}
                      </span>
                      <span className="text-gray-500">300 DPI</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Dimension Editor (when Custom selected) */}
            {selectedPresetId === "custom" && (
              <div className="mb-6 p-4 rounded-xl bg-black border border-white/15 flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <label className="text-gray-300">Width (mm):</label>
                  <input
                    type="number"
                    min={15}
                    max={150}
                    value={customWidthMM}
                    onChange={(e) => setCustomWidthMM(parseInt(e.target.value) || 35)}
                    className="w-20 px-2 py-1 rounded bg-black border border-white/20 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-300">Height (mm):</label>
                  <input
                    type="number"
                    min={15}
                    max={150}
                    value={customHeightMM}
                    onChange={(e) => setCustomHeightMM(parseInt(e.target.value) || 45)}
                    className="w-20 px-2 py-1 rounded bg-black border border-white/20 text-white"
                  />
                </div>
                <span className="text-[11px] text-gray-500">
                  Resolution: {mmToPixels(customWidthMM)} × {mmToPixels(customHeightMM)} px @ 300 DPI
                </span>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("crop")}
                className="px-6 py-2.5 bg-white text-black font-bold rounded-xl text-xs hover:bg-neutral-200 transition-colors shadow-md cursor-pointer"
              >
                Continue to Biometric Crop →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: BIOMETRIC CROP & FRAMING (EXPANDED & UNIFORM SIZE)
           ========================================================================= */}
        {activeTab === "crop" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-fade-in-up-1">
            {/* Left Column: Uniform Large Preview Viewport */}
            <div className="md:col-span-7 flex flex-col">
              <div className="h-[500px] sm:h-[530px] bg-black border border-white/10 rounded-2xl p-4 flex flex-col justify-between relative shadow-2xl overflow-hidden">
                {/* Active Interactive Crop Canvas */}
                <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden select-none">
                  <div
                    className="relative w-[340px] sm:w-[370px] h-[415px] sm:h-[445px] max-h-full aspect-[4/5] rounded-xl overflow-hidden border border-[#2b3040] bg-black select-none shadow-inner group cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => {
                      setIsDragging(true);
                      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
                    }}
                    onMouseMove={(e) => {
                      if (!isDragging) return;
                      const nextX = e.clientX - dragStartRef.current.x;
                      const nextY = e.clientY - dragStartRef.current.y;
                      if (rafRef.current) cancelAnimationFrame(rafRef.current);
                      rafRef.current = requestAnimationFrame(() => {
                        setPan({ x: nextX, y: nextY });
                      });
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onTouchStart={(e) => {
                      if (e.touches[0]) {
                        setIsDragging(true);
                        dragStartRef.current = {
                          x: e.touches[0].clientX - pan.x,
                          y: e.touches[0].clientY - pan.y,
                        };
                      }
                    }}
                    onTouchMove={(e) => {
                      if (!isDragging || !e.touches[0]) return;
                      const nextX = e.touches[0].clientX - dragStartRef.current.x;
                      const nextY = e.touches[0].clientY - dragStartRef.current.y;
                      if (rafRef.current) cancelAnimationFrame(rafRef.current);
                      rafRef.current = requestAnimationFrame(() => {
                        setPan({ x: nextX, y: nextY });
                      });
                    }}
                    onTouchEnd={() => setIsDragging(false)}
                    onWheel={(e) => {
                      e.preventDefault();
                      const delta = e.deltaY > 0 ? -0.05 : 0.05;
                      setZoom((z) => Math.min(2.5, Math.max(0.4, parseFloat((z + delta).toFixed(2)))));
                    }}
                  >
                    <canvas
                      ref={cropCanvasRef}
                      className="w-full h-full object-contain pointer-events-none select-none"
                    />

                    {/* Monochromatic Biometric Face Overlay */}
                    {showFaceGuide && (
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        fill="none"
                        viewBox="0 0 360 450"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Center Vertical Axis */}
                        <line
                          opacity="0.85"
                          stroke="rgba(255, 255, 255, 0.7)"
                          strokeDasharray="3 3"
                          strokeWidth="1.2"
                          x1="180"
                          x2="180"
                          y1="50"
                          y2="400"
                        />
                        {/* Biometric Oval Face Frame */}
                        <ellipse
                          cx="180"
                          cy="225"
                          opacity="0.9"
                          rx="85"
                          ry="125"
                          stroke="rgba(255, 255, 255, 0.85)"
                          strokeDasharray="4 4"
                          strokeWidth="1.4"
                        />
                        {/* Horizontal Eye Line */}
                        <line
                          opacity="0.85"
                          stroke="rgba(255, 255, 255, 0.7)"
                          strokeDasharray="3 3"
                          strokeWidth="1.2"
                          x1="90"
                          x2="270"
                          y1="205"
                          y2="205"
                        />
                        <text
                          fill="rgba(255, 255, 255, 0.85)"
                          fontFamily="monospace"
                          fontSize="8"
                          letterSpacing="1"
                          x="18"
                          y="209"
                        >
                          EYE LINE
                        </text>
                        {/* Horizontal Chin Line */}
                        <line
                          opacity="0.85"
                          stroke="rgba(255, 255, 255, 0.7)"
                          strokeDasharray="3 3"
                          strokeWidth="1.2"
                          x1="120"
                          x2="240"
                          y1="310"
                          y2="310"
                        />
                        <text
                          fill="rgba(255, 255, 255, 0.85)"
                          fontFamily="monospace"
                          fontSize="8"
                          letterSpacing="1"
                          x="18"
                          y="313"
                        >
                          CHIN
                        </text>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Bottom Uniform Specs Bar */}
                <div className="pt-2.5 mt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400 font-mono tracking-tight">
                  <span>{activePreset.name} • {activePreset.widthMM}×{activePreset.heightMM}mm (300 DPI)</span>
                  <span className="text-gray-500">Drag to align • Scroll to zoom</span>
                </div>
              </div>
            </div>

            {/* Right Column: Controls */}
            <div className="md:col-span-5 flex flex-col justify-between min-h-[500px] sm:min-h-[530px] space-y-3.5">
              <div className="space-y-3.5">
                {/* Zoom Level Card */}
                <div className="bg-black border border-white/10 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <span className="flex items-center space-x-1.5 text-[#959fad]">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Zoom Level</span>
                    </span>
                    <span className="font-bold text-white tracking-wider">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                  <input
                    aria-label="Zoom Level"
                    className="w-full accent-white cursor-pointer"
                    max="250"
                    min="40"
                    type="range"
                    value={Math.round(zoom * 100)}
                    onChange={(e) => setZoom(parseInt(e.target.value) / 100)}
                  />
                </div>

                {/* Orientation & Flip Card */}
                <div className="bg-black border border-white/10 rounded-xl p-3.5">
                  <span className="text-xs text-[#959fad] block mb-2.5">Orientation &amp; Flip</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Rotate -90 Left */}
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                      className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg border border-white/10 bg-black hover:bg-[#232837] hover:border-[#384055] text-white transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#8c96ac]" />
                      <span>-90° Left</span>
                    </button>

                    {/* Rotate +90 Right */}
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg border border-white/10 bg-black hover:bg-[#232837] hover:border-[#384055] text-white transition-all cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-[#8c96ac]" />
                      <span>+90° Right</span>
                    </button>

                    {/* Flip Horizontal */}
                    <button
                      type="button"
                      onClick={() => setFlipH((h) => !h)}
                      className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg border text-white transition-all cursor-pointer ${
                        flipH
                          ? "border-white/50 bg-white/10"
                          : "border-white/10 bg-black hover:bg-[#232837] hover:border-[#384055]"
                      }`}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5 text-[#8c96ac]" />
                      <span>Flip H</span>
                    </button>

                    {/* Flip Vertical */}
                    <button
                      type="button"
                      onClick={() => setFlipV((v) => !v)}
                      className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg border text-white transition-all cursor-pointer ${
                        flipV
                          ? "border-white/50 bg-white/10"
                          : "border-white/10 bg-black hover:bg-[#232837] hover:border-[#384055]"
                      }`}
                    >
                      <FlipVertical className="w-3.5 h-3.5 text-[#8c96ac]" />
                      <span>Flip V</span>
                    </button>
                  </div>
                </div>

                {/* Biometric Guidelines Toggle */}
                <div className="bg-black border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#959fad]">
                    <Eye className="w-3.5 h-3.5 text-neutral-300" />
                    <span>Biometric Guidelines Overlay</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFaceGuide((g) => !g)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      showFaceGuide
                        ? "bg-white/10 text-white border border-white/20"
                        : "bg-black text-gray-400 border border-white/10"
                    }`}
                  >
                    {showFaceGuide ? "VISIBLE" : "HIDDEN"}
                  </button>
                </div>

                {/* Reset Pan & Zoom Button */}
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setRotation(0);
                    setFlipH(false);
                    setFlipV(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-white/10 hover:border-[#383f55] bg-transparent hover:bg-[#181b24] text-xs text-[#8c96ab] hover:text-white flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Reset Pan &amp; Zoom</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("tune")}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer text-xs shadow-md"
              >
                Continue to Color &amp; Tune →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: COLOR & STUDIO TUNING (UNIFORM EXACT SAME SIZE & LOCAL BG REMOVAL)
           ========================================================================= */}
        {activeTab === "tune" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-fade-in-up-1">
            {/* Left Column: Uniform Large Preview Viewport (EXACT SAME SIZED CARD) */}
            <div className="md:col-span-7 flex flex-col">
              <div className="h-[500px] sm:h-[530px] bg-black border border-white/10 rounded-2xl p-4 flex flex-col justify-between relative shadow-2xl overflow-hidden">
                {/* Canvas Photo Display Area */}
                <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden">
                  <canvas
                    ref={singleCanvasRef}
                    className="max-h-[440px] max-w-full rounded-xl shadow-2xl border border-white/10 object-contain"
                  />
                  {isRemovingBg && (
                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full flex items-center gap-2 text-[11px] text-white">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span>AI Refining Cutout...</span>
                    </div>
                  )}
                </div>

                {/* Bottom Uniform Specs Bar */}
                <div className="pt-2.5 mt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400 font-mono tracking-tight">
                  <span>{activePreset.name} • {activePreset.widthMM}×{activePreset.heightMM}mm (300 DPI)</span>
                  <span className="text-gray-400">
                    {replaceBg
                      ? isAiCutout
                        ? "AI Solid Background Active"
                        : "Instant Solid Background Active"
                      : "Original Background"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Controls */}
            <div className="md:col-span-5 flex flex-col justify-between min-h-[500px] sm:min-h-[530px] space-y-3.5">
              <div className="space-y-3.5">
                {/* Background Color Picker Card with Local Background Removal */}
                <div className="bg-black border border-white/10 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-white text-xs font-semibold">
                      <Palette className="w-4 h-4 text-neutral-300" />
                      <span>Solid Background Color</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplaceBg((b) => !b)}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded cursor-pointer transition-colors ${
                        replaceBg
                          ? "bg-white/10 text-white border border-white/20 font-bold"
                          : "bg-black text-gray-400 border border-white/10"
                      }`}
                    >
                      {replaceBg ? "ENABLED" : "OFF"}
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                    Background is removed locally and replaced with compliant solid colors. Real-time, instant &amp; lag-free.
                  </p>

                  {/* Color Swatches Grid */}
                  <div className="flex items-center gap-2.5 pb-3 border-b border-white/5 flex-wrap">
                    {[
                      { label: "White", color: "#ffffff" },
                      { label: "Off-White", color: "#f8fafc" },
                      { label: "Light Blue", color: "#bfdbfe" },
                      { label: "Studio Grey", color: "#e2e8f0" },
                      { label: "Crimson Red", color: "#dc2626" },
                    ].map((swatch) => (
                      <button
                        key={swatch.color}
                        type="button"
                        onClick={() => {
                          setBackgroundColor(swatch.color);
                          setReplaceBg(true);
                        }}
                        className={`w-7 h-7 rounded-full border transition-all cursor-pointer ${
                          replaceBg && backgroundColor === swatch.color
                            ? "ring-2 ring-white scale-110 border-black"
                            : "border-gray-500/50 hover:scale-105"
                        }`}
                        style={{ backgroundColor: swatch.color }}
                        title={swatch.label}
                      />
                    ))}
                    <div className="flex items-center gap-1.5 ml-1">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => {
                          setBackgroundColor(e.target.value);
                          setReplaceBg(true);
                        }}
                        className="w-7 h-7 rounded border border-gray-500/50 bg-transparent cursor-pointer p-0"
                        title="Custom Color Picker"
                      />
                      <span className="text-[11px] text-gray-400 font-mono uppercase">
                        {backgroundColor}
                      </span>
                    </div>
                  </div>

                  {/* Re-process / Refine AI Button */}
                  <div className="pt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => executeBackgroundRemoval()}
                      disabled={isRemovingBg}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-[#2b2f40] border border-white/10 text-white text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isRemovingBg ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span>{isRemovingBg ? "Refining Cutout..." : "Re-segment Cutout"}</span>
                    </button>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {isAiCutout ? "AI Segmentation Active" : "Instant Matte"}
                    </span>
                  </div>
                </div>

                {/* Adjustments Controls Card */}
                <div className="bg-black border border-white/10 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white font-semibold">Studio Adjustments</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleAutoEnhance}
                        className="flex items-center gap-1 text-[#eab308] hover:text-[#facc15] font-medium transition-colors text-[11px] cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto Enhance</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetAdjustments}
                        className="text-gray-400 hover:text-white transition-colors text-[11px] cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Brightness Slider */}
                  <div className="space-y-1 mb-2.5">
                    <div className="flex justify-between text-[11px] text-gray-300">
                      <span>Brightness</span>
                      <span className="text-gray-400 font-mono">{brightness}</span>
                    </div>
                    <input
                      className="w-full accent-white cursor-pointer"
                      max="50"
                      min="-50"
                      type="range"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                    />
                  </div>

                  {/* Contrast Slider */}
                  <div className="space-y-1 mb-2.5">
                    <div className="flex justify-between text-[11px] text-gray-300">
                      <span>Contrast</span>
                      <span className="text-gray-400 font-mono">{contrast}%</span>
                    </div>
                    <input
                      className="w-full accent-white cursor-pointer"
                      max="150"
                      min="50"
                      type="range"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                    />
                  </div>

                  {/* Saturation Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-300">
                      <span>Saturation</span>
                      <span className="text-gray-400 font-mono">{saturation}%</span>
                    </div>
                    <input
                      className="w-full accent-white cursor-pointer"
                      max="160"
                      min="0"
                      type="range"
                      value={saturation}
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("export")}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer text-xs shadow-md"
              >
                Continue to Print &amp; Export →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: PRINT SHEET LAYOUT & EXPORT (EXACT SAME SIZED CARD & EXPANDED)
           ========================================================================= */}
        {activeTab === "export" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-fade-in-up-1">
            {/* Left Column: Uniform Large Preview Viewport (EXACT SAME SIZED CARD) */}
            <div className="md:col-span-7 flex flex-col">
              <div className="h-[500px] sm:h-[530px] bg-black border border-white/10 rounded-2xl p-4 flex flex-col justify-between relative shadow-2xl overflow-hidden">
                {/* Active Printable Sheet Canvas */}
                <div className="flex-1 w-full flex items-center justify-center p-2 relative overflow-hidden">
                  <canvas
                    ref={sheetCanvasRef}
                    className="max-h-[440px] max-w-full rounded-xl shadow-2xl border border-neutral-700 bg-white object-contain"
                  />
                </div>

                {/* Bottom Uniform Specs Bar */}
                <div className="pt-2.5 mt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400 font-mono tracking-tight font-jetbrains">
                  <span>{sheetType === "a4" ? "A4 Document Sheet (210×297 mm)" : "4×6 Photo Paper (102×152 mm)"} • 300 DPI High-Res</span>
                  <span className="text-gray-400">{photoCount} of {gridInfo.maxPhotos} Photos Placed</span>
                </div>
              </div>
            </div>

            {/* Right Column: Settings and Action Controls */}
            <div className="md:col-span-5 flex flex-col justify-between min-h-[500px] sm:min-h-[530px] space-y-3.5">
              <div className="space-y-3">
                {/* Box: Print Sheet Paper Selector */}
                <div className="bg-black border border-white/10 rounded-xl p-3.5">
                  <h3 className="text-xs text-neutral-300 font-mono mb-2.5">Print Sheet Paper</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* A4 Paper */}
                    <button
                      type="button"
                      onClick={() => setSheetType("a4")}
                      className={`rounded-lg p-2.5 text-left transition-all cursor-pointer ${
                        sheetType === "a4"
                          ? "border border-white/40 bg-[#4c525f]/50 shadow-sm"
                          : "border border-white/10 bg-black hover:bg-[#252a35]"
                      }`}
                    >
                      <div className="text-white font-bold text-xs">A4 Paper</div>
                      <div className="text-[10px] text-neutral-300 mt-0.5">210 × 297 mm</div>
                    </button>

                    {/* 4x6 Photo Paper */}
                    <button
                      type="button"
                      onClick={() => setSheetType("4x6")}
                      className={`rounded-lg p-2.5 text-left transition-all cursor-pointer ${
                        sheetType === "4x6"
                          ? "border border-white/40 bg-[#4c525f]/50 shadow-sm"
                          : "border border-white/10 bg-black hover:bg-[#252a35]"
                      }`}
                    >
                      <div className="text-neutral-200 font-bold text-xs">4×6 Photo Paper</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">102 × 152 mm</div>
                    </button>
                  </div>
                </div>

                {/* Box: Photos on Sheet Slider */}
                <div className="bg-black border border-white/10 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-neutral-300 font-mono">Photos on Sheet</span>
                    <span className="text-white font-mono font-bold tracking-wider">
                      {photoCount} / {gridInfo.maxPhotos}
                    </span>
                  </div>
                  <div className="py-0.5">
                    <input
                      aria-label="Photos on Sheet"
                      className="w-full accent-white cursor-pointer"
                      max={gridInfo.maxPhotos}
                      min="1"
                      type="range"
                      value={photoCount}
                      onChange={(e) => setPhotoCount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                {/* Box: Scissor Cut Lines Checkbox */}
                <div className="bg-black border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Scissors className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Print Scissor Cut Lines</span>
                  </div>
                  <input
                    checked={showCutLines}
                    onChange={(e) => setShowCutLines(e.target.checked)}
                    type="checkbox"
                    className="w-4 h-4 rounded bg-[#2a2f3a] border-white/20 text-white focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Box: Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                {/* Download Print-Ready PDF Button */}
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="w-full py-2.5 px-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-lg flex items-center justify-center gap-2 text-xs transition-colors shadow-md cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Print-Ready PDF (300 DPI)</span>
                </button>

                {/* Sheet Image & Single Photo Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSheetJPG}
                    className="py-2 px-2.5 bg-black hover:bg-[#262c37] border border-white/10 text-white rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Sheet Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle("jpeg")}
                    className="py-2 px-2.5 bg-black hover:bg-[#262c37] border border-white/10 text-white rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Single Photo</span>
                  </button>
                </div>

                {/* Print Directly Button */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-2 px-3 bg-black hover:bg-[#262c37] border border-white/10 text-white rounded-lg flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-neutral-400" />
                  <span>Print Directly</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
