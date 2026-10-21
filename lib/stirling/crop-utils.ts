/**
 * Crop coordinate translation utility for Stirling-PDF.
 *
 * Web UI inputs use CSS top-left origin (mm), whereas PDFBox and Stirling-PDF
 * evaluate crop boxes in PostScript Points (1/72 inch) with a bottom-left origin.
 */

export interface CropMarginsMm {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface StirlingCropBoxPoints {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MM_TO_POINTS = 72 / 25.4; // 2.834645669...

/**
 * Translates user-facing CSS top-left millimeter margins into
 * PDF standard bottom-left PostScript points bounding box coordinates.
 */
export function convertMarginsToStirlingPoints(
  marginsMm: CropMarginsMm,
  pageWidthPoints = 595.28, // Standard A4 points default
  pageHeightPoints = 841.89
): StirlingCropBoxPoints {
  const topPoints = (marginsMm.top || 0) * MM_TO_POINTS;
  const bottomPoints = (marginsMm.bottom || 0) * MM_TO_POINTS;
  const leftPoints = (marginsMm.left || 0) * MM_TO_POINTS;
  const rightPoints = (marginsMm.right || 0) * MM_TO_POINTS;

  // X coordinate starts from the left margin
  const x = Math.max(0, leftPoints);

  // Y coordinate in PDFBox starts from the bottom!
  // Bottom-left Y = bottomMargin
  const y = Math.max(0, bottomPoints);

  // Width is total width minus both horizontal margins
  const width = Math.max(10, pageWidthPoints - leftPoints - rightPoints);

  // Height is total height minus both vertical margins
  const height = Math.max(10, pageHeightPoints - topPoints - bottomPoints);

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}
