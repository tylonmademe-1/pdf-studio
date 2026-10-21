import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  mmToPixels,
  pixelsToMM,
  PHOTO_PRESETS,
  SUIT_STYLES,
  calculateSheetGrid,
} from "../../lib/photo/passport";
import { getToolBySlug, getToolsByCategory } from "../../config/tools";

describe("Passport & Visa Photo Generator Suite", () => {
  test("mmToPixels and pixelsToMM perform accurate 300 DPI conversions", () => {
    // 25.4 mm = 1 inch = 300 px at 300 DPI
    assert.equal(mmToPixels(25.4, 300), 300);
    assert.equal(pixelsToMM(300, 300), 25.4);

    // Standard 35x45mm (India / UK / Europe)
    assert.equal(mmToPixels(35, 300), 413);
    assert.equal(mmToPixels(45, 300), 531);

    // Standard 2x2 inches (51x51mm USA / OCI)
    assert.equal(mmToPixels(51, 300), 602);

    // Canada 50x70mm
    assert.equal(mmToPixels(50, 300), 591);
    assert.equal(mmToPixels(70, 300), 827);
  });

  test("PHOTO_PRESETS contains all official country standards", () => {
    const ids = PHOTO_PRESETS.map((p) => p.id);
    assert.ok(ids.includes("india_uk_eu"));
    assert.ok(ids.includes("usa_visa"));
    assert.ok(ids.includes("canada"));
    assert.ok(ids.includes("china"));
    assert.ok(ids.includes("custom"));

    for (const preset of PHOTO_PRESETS) {
      assert.ok(preset.widthMM > 0, `Invalid width for ${preset.id}`);
      assert.ok(preset.heightMM > 0, `Invalid height for ${preset.id}`);
      assert.ok(preset.name.length > 0);
      assert.ok(preset.description.length > 0);
    }
  });

  test("SUIT_STYLES provides official formal suit and blazer templates", () => {
    const expectedSuits = [
      "blackSuit",
      "navySuit",
      "greyBlazer",
      "maroonBlazer",
      "blouse",
    ];

    for (const suit of expectedSuits) {
      const cfg = SUIT_STYLES[suit];
      assert.ok(cfg, `Missing suit style: ${suit}`);
      assert.ok(cfg.suit.startsWith("#"));
      assert.ok(cfg.shirt.startsWith("#"));
      assert.equal(typeof cfg.hasTie, "boolean");
      assert.equal(typeof cfg.hasLapel, "boolean");
    }
  });

  test("calculateSheetGrid calculates sheet layout and cut positions accurately", () => {
    // A4 sheet with 35x45mm photos
    const a4Grid = calculateSheetGrid("a4", 35, 45, 300);
    assert.ok(a4Grid.cols >= 4);
    assert.ok(a4Grid.rows >= 5);
    assert.ok(a4Grid.maxPhotos >= 20);
    assert.equal(a4Grid.positions.length, a4Grid.maxPhotos);

    // 4x6 photo paper with 35x45mm photos
    const photoPaperGrid = calculateSheetGrid("4x6", 35, 45, 300);
    assert.ok(photoPaperGrid.cols >= 2);
    assert.ok(photoPaperGrid.rows >= 2);
    assert.ok(photoPaperGrid.maxPhotos >= 4);
    assert.equal(photoPaperGrid.positions.length, photoPaperGrid.maxPhotos);

    // Verify positions do not collide
    const first = a4Grid.positions[0];
    const second = a4Grid.positions[1];
    assert.ok(second.x >= first.x + a4Grid.photoWidthPx);
  });

  test("Photo Tool is registered and accessible via slug and alias", () => {
    const directTool = getToolBySlug("photo-tool");
    assert.ok(directTool);
    assert.equal(directTool.name, "Photo Tool");
    assert.equal(directTool.category, "convert");
    assert.equal(directTool.iconName, "Camera");
    assert.equal(directTool.route, "/tools/photo-tool");
    assert.ok(directTool.features && directTool.features.length >= 3);

    // Check alias
    const aliasTool = getToolBySlug("passport-photo");
    assert.ok(aliasTool);
    assert.equal(aliasTool.id, "photo-tool");

    const convertTools = getToolsByCategory("convert");
    assert.ok(convertTools.some((t) => t.id === "photo-tool"));
  });
});
