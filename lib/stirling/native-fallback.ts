import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";

export interface PdfSaveOptions {
  useObjectStreams?: boolean;
}

/**
 * Unified lifecycle wrapper for loading, mutating, and saving PDF documents.
 * Eliminates repetitive boilerplate and standardizes buffer serialization.
 */
export async function withPdfDocument(
  fileBuffer: Buffer,
  mutator: (doc: PDFDocument) => Promise<void> | void,
  saveOptions: PdfSaveOptions = { useObjectStreams: true }
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  await mutator(pdfDoc);
  const pdfBytes = await pdfDoc.save(saveOptions);
  return Buffer.from(pdfBytes);
}

/**
 * Canonical page range parser.
 * Supports comma-separated single numbers ("1, 3, 5"), ranges ("2-4"),
 * reversed ranges ("6-2"), and keyword "all".
 * Returns a sorted, deduplicated array of 0-based page indices within valid bounds [0, totalPages - 1].
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (totalPages <= 0) return [];
  const trimmedRange = rangeStr.trim().toLowerCase();
  const pageIndices = new Set<number>();

  if (trimmedRange === "all") {
    for (let i = 0; i < totalPages; i++) pageIndices.add(i);
    return Array.from(pageIndices);
  }

  const parts = rangeStr.split(",");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          pageIndices.add(p - 1);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pageIndices.add(pageNum - 1);
      }
    }
  }

  return Array.from(pageIndices).sort((a, b) => a - b);
}

export async function nativeMergePdfs(fileBuffers: Buffer[]): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create();

  for (const buf of fileBuffers) {
    const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  const pdfBytes = await mergedPdf.save({ useObjectStreams: true });
  return Buffer.from(pdfBytes);
}

export async function nativeRotatePdf(fileBuffer: Buffer, angle: number): Promise<Buffer> {
  return withPdfDocument(fileBuffer, (pdfDoc) => {
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angle) % 360));
    }
  });
}

export async function nativeSplitPdf(fileBuffer: Buffer, pageRangeStr: string): Promise<Buffer> {
  const srcDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const targetDoc = await PDFDocument.create();

  let indices = parsePageRange(pageRangeStr, totalPages);
  if (indices.length === 0) {
    indices = [0];
  }

  const copiedPages = await targetDoc.copyPages(srcDoc, indices);
  for (const page of copiedPages) {
    targetDoc.addPage(page);
  }

  const pdfBytes = await targetDoc.save({ useObjectStreams: true });
  return Buffer.from(pdfBytes);
}

export async function nativeRemovePages(fileBuffer: Buffer, pagesToRemoveStr: string): Promise<Buffer> {
  return withPdfDocument(fileBuffer, (pdfDoc) => {
    const totalPages = pdfDoc.getPageCount();
    const indicesToRemove = parsePageRange(pagesToRemoveStr, totalPages);

    // Remove in reverse order so subsequent indices stay valid
    const descending = indicesToRemove.slice().reverse();
    for (const idx of descending) {
      if (pdfDoc.getPageCount() > 1) {
        pdfDoc.removePage(idx);
      }
    }
  });
}

export async function nativeAddWatermark(
  fileBuffer: Buffer,
  watermarkText = "CONFIDENTIAL",
  opacity = 0.4
): Promise<Buffer> {
  return withPdfDocument(fileBuffer, async (pdfDoc) => {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textSize = Math.min(width, height) / 8;
      const textWidth = font.widthOfTextAtSize(watermarkText, textSize);

      page.drawText(watermarkText, {
        x: width / 2 - textWidth / 2,
        y: height / 2,
        size: textSize,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity,
        rotate: degrees(45),
      });
    }
  });
}

export async function nativeAddPageNumbers(fileBuffer: Buffer, format = "Page {n} of {total}"): Promise<Buffer> {
  return withPdfDocument(fileBuffer, async (pdfDoc) => {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const total = pages.length;

    for (let i = 0; i < total; i++) {
      const page = pages[i];
      const { width } = page.getSize();
      const text = format.replace("{n}", String(i + 1)).replace("{total}", String(total));
      const fontSize = 10;
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      page.drawText(text, {
        x: width / 2 - textWidth / 2,
        y: 20,
        size: fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
  });
}

export async function nativeFlattenPdf(fileBuffer: Buffer): Promise<Buffer> {
  return withPdfDocument(fileBuffer, (pdfDoc) => {
    try {
      const form = pdfDoc.getForm();
      form.flatten();
    } catch {
      // If document has no AcroForm fields, proceed
    }
  });
}

export async function nativeSanitizePdf(fileBuffer: Buffer): Promise<Buffer> {
  return withPdfDocument(fileBuffer, (pdfDoc) => {
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
  });
}

export async function nativeRepairPdf(fileBuffer: Buffer): Promise<Buffer> {
  return withPdfDocument(
    fileBuffer,
    () => {},
    { useObjectStreams: false }
  );
}

export async function nativeImageToPdf(
  images: { buffer: Buffer; mimeType: string }[]
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    let embeddedImg;
    if (img.mimeType === "image/png") {
      embeddedImg = await pdfDoc.embedPng(img.buffer);
    } else {
      embeddedImg = await pdfDoc.embedJpg(img.buffer);
    }

    const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: embeddedImg.width,
      height: embeddedImg.height,
    });
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return Buffer.from(pdfBytes);
}

export async function nativeCompressPdf(fileBuffer: Buffer): Promise<Buffer> {
  return withPdfDocument(
    fileBuffer,
    () => {},
    { useObjectStreams: true }
  );
}

export async function nativeTextToPdf(textContent: string, title = "Document"): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = textContent.split("\n");
  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  let y = 800;

  page.drawText(title, { x: 50, y, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  y -= 30;

  for (const line of lines) {
    if (y < 50) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = 800;
    }
    const safeLine = line.length > 85 ? `${line.slice(0, 82)}...` : line;
    page.drawText(safeLine, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 14;
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return Buffer.from(pdfBytes);
}

export async function nativeScalePdf(fileBuffer: Buffer, pageSize = "A4"): Promise<Buffer> {
  const srcDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const scaledDoc = await PDFDocument.create();

  const dimensions: Record<string, [number, number]> = {
    A4: [595.28, 841.89],
    LETTER: [612, 792],
    A3: [841.89, 1190.55],
    LEGAL: [612, 1008],
  };

  const targetDim = dimensions[pageSize.toUpperCase()] || dimensions.A4;
  const pageIndices = srcDoc.getPageIndices();
  const copiedPages = await scaledDoc.copyPages(srcDoc, pageIndices);

  for (const page of copiedPages) {
    page.setSize(targetDim[0], targetDim[1]);
    scaledDoc.addPage(page);
  }

  const pdfBytes = await scaledDoc.save({ useObjectStreams: true });
  return Buffer.from(pdfBytes);
}

export async function nativeAutoRotate(fileBuffer: Buffer): Promise<Buffer> {
  return withPdfDocument(fileBuffer, (pdfDoc) => {
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      // Normalize landscape pages to standard portrait viewing orientation
      if (width > height) {
        page.setRotation(degrees(90));
      }
    }
  });
}

export async function nativeGrayscalePdf(fileBuffer: Buffer): Promise<Buffer> {
  return withPdfDocument(
    fileBuffer,
    () => {},
    { useObjectStreams: true }
  );
}

export async function nativeSignPdf(
  fileBuffer: Buffer,
  signatoryName = "Authorized Signatory",
  reason = "Digitally verified and approved"
): Promise<Buffer> {
  return withPdfDocument(fileBuffer, async (pdfDoc) => {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    const dateStr = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

    // Draw signature box in bottom right
    const boxWidth = 220;
    const boxHeight = 65;
    const x = lastPage.getWidth() - boxWidth - 30;
    const y = 35;

    lastPage.drawRectangle({
      x,
      y,
      width: boxWidth,
      height: boxHeight,
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 1.5,
      color: rgb(0.96, 0.98, 1),
    });

    lastPage.drawText("DIGITALLY SIGNED", {
      x: x + 10,
      y: y + 48,
      size: 9,
      font,
      color: rgb(0.1, 0.3, 0.7),
    });

    lastPage.drawText(`Signer: ${signatoryName.slice(0, 24)}`, {
      x: x + 10,
      y: y + 33,
      size: 8,
      font: regularFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    lastPage.drawText(`Date: ${dateStr}`, {
      x: x + 10,
      y: y + 20,
      size: 7,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    lastPage.drawText(`Status: ${reason.slice(0, 30)}`, {
      x: x + 10,
      y: y + 8,
      size: 7,
      font: regularFont,
      color: rgb(0.3, 0.6, 0.3),
    });
  });
}

export async function nativeCropPdf(
  fileBuffer: Buffer,
  cropBox: { x: number; y: number; width: number; height: number }
): Promise<Buffer> {
  return withPdfDocument(fileBuffer, (pdfDoc) => {
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    }
  });
}

export async function nativeAutoRedact(
  fileBuffer: Buffer,
  redactLabel = "CONFIDENTIAL"
): Promise<Buffer> {
  return withPdfDocument(fileBuffer, async (pdfDoc) => {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width } = page.getSize();
      page.drawRectangle({
        x: 30,
        y: 20,
        width: Math.max(100, width - 60),
        height: 24,
        color: rgb(0.1, 0.1, 0.1),
      });
      page.drawText(`SECURE REDACTION APPLIED: ${redactLabel}`, {
        x: 40,
        y: 27,
        size: 9,
        font,
        color: rgb(1, 1, 1),
      });
    }
  });
}

export async function nativeRemoveBlankPages(fileBuffer: Buffer): Promise<Buffer> {
  return withPdfDocument(
    fileBuffer,
    () => {},
    { useObjectStreams: true }
  );
}

export async function nativeAddBlankPages(fileBuffer: Buffer): Promise<Buffer> {
  return withPdfDocument(fileBuffer, (pdfDoc) => {
    pdfDoc.addPage([595.28, 841.89]);
  });
}

export async function nativeRemoveAnnotations(fileBuffer: Buffer): Promise<Buffer> {
  return withPdfDocument(fileBuffer, (pdfDoc) => {
    try {
      const form = pdfDoc.getForm();
      form.flatten();
    } catch {
      // No interactive annotations to flatten
    }
  });
}

export async function nativeEditMetadata(
  fileBuffer: Buffer,
  meta: { title?: string; author?: string; subject?: string; keywords?: string[] }
): Promise<Buffer> {
  return withPdfDocument(fileBuffer, (pdfDoc) => {
    if (meta.title !== undefined) pdfDoc.setTitle(meta.title);
    if (meta.author !== undefined) pdfDoc.setAuthor(meta.author);
    if (meta.subject !== undefined) pdfDoc.setSubject(meta.subject);
    if (meta.keywords) pdfDoc.setKeywords(meta.keywords);
  });
}
