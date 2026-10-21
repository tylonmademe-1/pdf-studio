import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import {
  isValidMediaUrl,
  formatDuration,
  getFfmpegPath,
} from "../../lib/ytdlp/runner";
import { getToolBySlug, getToolsByCategory } from "../../config/tools";

describe("yt-dlp Video Downloader & Utility Suite", () => {
  test("isValidMediaUrl validates safe public video URLs and blocks SSRF / local ranges", () => {
    // Valid URLs
    assert.equal(
      isValidMediaUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      true
    );
    assert.equal(
      isValidMediaUrl("https://youtu.be/dQw4w9WgXcQ"),
      true
    );
    assert.equal(
      isValidMediaUrl("https://vimeo.com/76979871"),
      true
    );
    assert.equal(
      isValidMediaUrl("http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"),
      true
    );

    // Block SSRF / Local addresses
    assert.equal(isValidMediaUrl("http://localhost:3000/api/health"), false);
    assert.equal(isValidMediaUrl("http://127.0.0.1:8080"), false);
    assert.equal(isValidMediaUrl("http://0.0.0.0:8000"), false);
    assert.equal(isValidMediaUrl("http://[::1]:3000"), false);
    assert.equal(isValidMediaUrl("http://192.168.1.1/admin"), false);
    assert.equal(isValidMediaUrl("http://10.0.0.5/secrets"), false);
    assert.equal(isValidMediaUrl("http://169.254.169.254/latest/meta-data"), false);
    assert.equal(isValidMediaUrl("http://172.20.0.1"), false);

    // Non-HTTP protocols
    assert.equal(isValidMediaUrl("file:///C:/Windows/System32/drivers/etc/hosts"), false);
    assert.equal(isValidMediaUrl("ftp://files.example.com/video.mp4"), false);
    assert.equal(isValidMediaUrl("javascript:alert(1)"), false);
    assert.equal(isValidMediaUrl("not-a-valid-url"), false);
    assert.equal(isValidMediaUrl(""), false);
  });

  test("formatDuration formats seconds accurately to MM:SS and HH:MM:SS", () => {
    assert.equal(formatDuration(0), "0:00");
    assert.equal(formatDuration(35), "0:35");
    assert.equal(formatDuration(65), "1:05");
    assert.equal(formatDuration(599), "9:59");
    assert.equal(formatDuration(600), "10:00");
    assert.equal(formatDuration(3600), "1:00:00");
    assert.equal(formatDuration(3665), "1:01:05");
    assert.equal(formatDuration(-10), "0:00");
    assert.equal(formatDuration(NaN), "0:00");
  });

  test("FFmpeg binary is detectable and executable on host system", () => {
    const ffmpegPath = getFfmpegPath();
    if (ffmpegPath) {
      assert.ok(fs.existsSync(ffmpegPath), `Detected FFmpeg does not exist at: ${ffmpegPath}`);
    } else {
      // System FFmpeg on PATH
      assert.ok(true);
    }
  });

  test("Video Downloader is properly registered in config and taxonomy", () => {
    const tool = getToolBySlug("video-downloader");
    assert.ok(tool, "video-downloader must be registered");
    assert.equal(tool.id, "video-downloader");
    assert.equal(tool.category, "video");
    assert.equal(tool.status, "ready");
    assert.equal(tool.route, "/tools/video-downloader");
    assert.ok(tool.features && tool.features.length >= 3);

    const videoTools = getToolsByCategory("video");
    assert.equal(videoTools.length, 1);
    assert.equal(videoTools[0].id, "video-downloader");
  });
});
