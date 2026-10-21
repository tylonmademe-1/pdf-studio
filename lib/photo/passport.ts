/**
 * Passport Photo Generator Core Logic
 * Based on rizwansoaib/passport-photo-generator
 * Provides biometric presets, 300 DPI canvas rendering, suit overlays, and printable sheet generators.
 */

export const DPI = 300;
export const MM_TO_INCH = 25.4;

export interface PhotoPreset {
  id: string;
  name: string;
  country: string;
  widthMM: number;
  heightMM: number;
  description: string;
}

export const PHOTO_PRESETS: PhotoPreset[] = [
  {
    id: "india_uk_eu",
    name: "India / UK / Schengen / Europe",
    country: "IN / GB / EU",
    widthMM: 35,
    heightMM: 45,
    description: "Standard 35×45mm for India, UK, Schengen, EU, Singapore",
  },
  {
    id: "usa_visa",
    name: "United States (2×2 in / 51×51 mm)",
    country: "US / OCI",
    widthMM: 51,
    heightMM: 51,
    description: "2×2 inches (51×51mm) for US Passport, US Visa, India OCI",
  },
  {
    id: "canada",
    name: "Canada Passport & Visa",
    country: "CA",
    widthMM: 50,
    heightMM: 70,
    description: "50×70mm for Canadian passport applications",
  },
  {
    id: "china",
    name: "China Passport & Visa",
    country: "CN",
    widthMM: 33,
    heightMM: 48,
    description: "33×48mm official standard for China passport and visa",
  },
  {
    id: "australia",
    name: "Australia & New Zealand",
    country: "AU / NZ",
    widthMM: 35,
    heightMM: 45,
    description: "35×45mm for Australian passport and travel documents",
  },
  {
    id: "japan",
    name: "Japan Passport",
    country: "JP",
    widthMM: 35,
    heightMM: 45,
    description: "35×45mm standard for Japanese travel credentials",
  },
  {
    id: "custom",
    name: "Custom Dimensions",
    country: "Custom",
    widthMM: 35,
    heightMM: 45,
    description: "Enter your own custom width and height in millimeters",
  },
];

export interface SuitStyleConfig {
  id: string;
  label: string;
  suit: string;
  lapel: string;
  shirt: string;
  tie: string | null;
  hasTie: boolean;
  hasLapel: boolean;
}

export const SUIT_STYLES: Record<string, SuitStyleConfig> = {
  blackSuit: {
    id: "blackSuit",
    label: "Black Suit & Tie",
    suit: "#1a1a1a",
    lapel: "#0d0d0d",
    shirt: "#f5f5f5",
    tie: "#7a0000",
    hasTie: true,
    hasLapel: true,
  },
  navySuit: {
    id: "navySuit",
    label: "Navy Blue Suit",
    suit: "#1c2b4a",
    lapel: "#122036",
    shirt: "#f5f5f5",
    tie: "#8a1c1c",
    hasTie: true,
    hasLapel: true,
  },
  greyBlazer: {
    id: "greyBlazer",
    label: "Charcoal Grey Blazer",
    suit: "#5b5f66",
    lapel: "#454851",
    shirt: "#f5f5f5",
    tie: "#2b3a55",
    hasTie: true,
    hasLapel: true,
  },
  maroonBlazer: {
    id: "maroonBlazer",
    label: "Women's Maroon Blazer",
    suit: "#5e2129",
    lapel: "#4a1a20",
    shirt: "#efe6d8",
    tie: null,
    hasTie: false,
    hasLapel: true,
  },
  blouse: {
    id: "blouse",
    label: "Formal White Blouse",
    suit: "#e7e2da",
    lapel: "#d8d0c0",
    shirt: "#ffffff",
    tie: null,
    hasTie: false,
    hasLapel: false,
  },
};

export interface SheetPreset {
  id: "a4" | "4x6";
  name: string;
  widthMM: number;
  heightMM: number;
  marginMM: number;
  spacingMM: number;
}

export const SHEET_PRESETS: Record<"a4" | "4x6", SheetPreset> = {
  a4: {
    id: "a4",
    name: "A4 Document Sheet (210×297 mm)",
    widthMM: 210,
    heightMM: 297,
    marginMM: 8,
    spacingMM: 4,
  },
  "4x6": {
    id: "4x6",
    name: "4×6 Photo Paper (102×152 mm)",
    widthMM: 102,
    heightMM: 152,
    marginMM: 5,
    spacingMM: 3,
  },
};

/**
 * Converts millimeters to pixels at specified DPI (defaults to 300 DPI print quality)
 */
export function mmToPixels(mm: number, dpi: number = DPI): number {
  return Math.round((mm / MM_TO_INCH) * dpi);
}

/**
 * Converts pixels to millimeters at specified DPI
 */
export function pixelsToMM(pixels: number, dpi: number = DPI): number {
  return parseFloat(((pixels / dpi) * MM_TO_INCH).toFixed(1));
}

/**
 * Draws the vector formal attire overlay (suit/blazer/blouse) from rizwansoaib/passport-photo-generator
 */
export function drawSuitOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: string
) {
  if (style === "none" || !SUIT_STYLES[style]) return;
  const cfg = SUIT_STYLES[style];
  const shoulderY = height * 0.66;

  ctx.save();

  // Shoulders / chest silhouette
  ctx.beginPath();
  ctx.moveTo(-width * 0.05, height + 5);
  ctx.lineTo(-width * 0.05, shoulderY + height * 0.05);
  ctx.quadraticCurveTo(
    width * 0.5,
    shoulderY - height * 0.06,
    width * 1.05,
    shoulderY + height * 0.05
  );
  ctx.lineTo(width * 1.05, height + 5);
  ctx.closePath();
  ctx.fillStyle = cfg.suit;
  ctx.fill();

  // Shirt / blouse triangle at the neckline
  const neckHalf = width * 0.11;
  ctx.beginPath();
  ctx.moveTo(width * 0.5 - neckHalf, shoulderY + height * 0.015);
  ctx.lineTo(width * 0.5, shoulderY - height * 0.03);
  ctx.lineTo(width * 0.5 + neckHalf, shoulderY + height * 0.015);
  ctx.lineTo(width * 0.5, height * 0.92);
  ctx.closePath();
  ctx.fillStyle = cfg.shirt;
  ctx.fill();

  // Lapels
  if (cfg.hasLapel) {
    ctx.beginPath();
    ctx.moveTo(width * 0.5 - neckHalf, shoulderY + height * 0.015);
    ctx.lineTo(width * 0.5 - width * 0.02, shoulderY + height * 0.02);
    ctx.lineTo(width * 0.5 - width * 0.16, height * 0.9);
    ctx.lineTo(width * 0.5 - width * 0.05, height * 0.55);
    ctx.closePath();
    ctx.fillStyle = cfg.lapel;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(width * 0.5 + neckHalf, shoulderY + height * 0.015);
    ctx.lineTo(width * 0.5 + width * 0.02, shoulderY + height * 0.02);
    ctx.lineTo(width * 0.5 + width * 0.16, height * 0.9);
    ctx.lineTo(width * 0.5 + width * 0.05, height * 0.55);
    ctx.closePath();
    ctx.fillStyle = cfg.lapel;
    ctx.fill();
  }

  // Tie
  if (cfg.hasTie && cfg.tie) {
    ctx.beginPath();
    ctx.moveTo(width * 0.5 - width * 0.028, shoulderY + height * 0.035);
    ctx.lineTo(width * 0.5 + width * 0.028, shoulderY + height * 0.035);
    ctx.lineTo(width * 0.5 + width * 0.014, height * 0.86);
    ctx.lineTo(width * 0.5, height * 0.9);
    ctx.lineTo(width * 0.5 - width * 0.014, height * 0.86);
    ctx.closePath();
    ctx.fillStyle = cfg.tie;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws official biometric ICAO 9303 face guide overlay on canvas
 */
export function drawBiometricGuide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  ctx.strokeStyle = "rgba(0, 220, 130, 0.75)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);

  const centerX = width / 2;
  const centerY = height * 0.45;
  const radiusX = width * 0.28;
  const radiusY = height * 0.32;

  // Head Oval
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Eye line guide (typically 56% to 65% from bottom)
  const eyeY = height * 0.42;
  ctx.beginPath();
  ctx.moveTo(centerX - radiusX * 0.9, eyeY);
  ctx.lineTo(centerX + radiusX * 0.9, eyeY);
  ctx.stroke();

  // Chin line guide
  const chinY = height * 0.77;
  ctx.beginPath();
  ctx.moveTo(centerX - radiusX * 0.5, chinY);
  ctx.lineTo(centerX + radiusX * 0.5, chinY);
  ctx.stroke();

  // Center vertical axis
  ctx.beginPath();
  ctx.moveTo(centerX, height * 0.1);
  ctx.lineTo(centerX, height * 0.85);
  ctx.stroke();

  // Text labels
  ctx.setLineDash([]);
  ctx.font = "10px monospace";
  ctx.fillStyle = "rgba(0, 220, 130, 0.85)";
  ctx.fillText("EYE LINE", 6, eyeY - 4);
  ctx.fillText("CHIN", 6, chinY - 4);

  ctx.restore();
}

export interface SheetGridCalculation {
  sheetWidthPx: number;
  sheetHeightPx: number;
  photoWidthPx: number;
  photoHeightPx: number;
  marginPx: number;
  spacingPx: number;
  cols: number;
  rows: number;
  maxPhotos: number;
  positions: { x: number; y: number }[];
}

/**
 * Calculates optimal grid layout for a given sheet size and photo dimensions
 */
export function calculateSheetGrid(
  sheetType: "a4" | "4x6",
  photoWidthMM: number,
  photoHeightMM: number,
  dpi: number = DPI
): SheetGridCalculation {
  const sheet = SHEET_PRESETS[sheetType];
  const sheetWidthPx = mmToPixels(sheet.widthMM, dpi);
  const sheetHeightPx = mmToPixels(sheet.heightMM, dpi);
  const photoWidthPx = mmToPixels(photoWidthMM, dpi);
  const photoHeightPx = mmToPixels(photoHeightMM, dpi);
  const marginPx = mmToPixels(sheet.marginMM, dpi);
  const spacingPx = mmToPixels(sheet.spacingMM, dpi);

  const availableWidth = sheetWidthPx - 2 * marginPx;
  const availableHeight = sheetHeightPx - 2 * marginPx;

  const cols = Math.max(
    1,
    Math.floor((availableWidth + spacingPx) / (photoWidthPx + spacingPx))
  );
  const rows = Math.max(
    1,
    Math.floor((availableHeight + spacingPx) / (photoHeightPx + spacingPx))
  );
  const maxPhotos = cols * rows;

  const positions: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({
        x: marginPx + c * (photoWidthPx + spacingPx),
        y: marginPx + r * (photoHeightPx + spacingPx),
      });
    }
  }

  return {
    sheetWidthPx,
    sheetHeightPx,
    photoWidthPx,
    photoHeightPx,
    marginPx,
    spacingPx,
    cols,
    rows,
    maxPhotos,
    positions,
  };
}
