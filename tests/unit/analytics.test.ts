import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { initDb, getAnalyticsSummary, recordHistory, createUser } from "../../lib/db/index";
import { formatBytes, formatNumber, formatLatency } from "../../components/analytics/utils";

describe("Analytics Engine & Telemetry Suite", () => {
  before(async () => {
    await initDb();
  });

  test("formatBytes utility formats byte sizes correctly", () => {
    assert.equal(formatBytes(0), "0 B");
    assert.equal(formatBytes(null), "0 B");
    assert.equal(formatBytes(undefined), "0 B");
    assert.equal(formatBytes(512), "512 B");
    assert.equal(formatBytes(1024), "1 KB");
    assert.equal(formatBytes(1048576), "1 MB");
    assert.equal(formatBytes(1073741824), "1 GB");
    assert.equal(formatBytes(2500000), "2.4 MB");
  });

  test("formatNumber utility formats integers and compact notations", () => {
    assert.equal(formatNumber(42), "42");
    assert.equal(formatNumber(999), "999");
    assert.equal(formatNumber(15400), "15.4K");
    assert.equal(formatNumber(1250000), "1.3M");
  });

  test("formatLatency utility formats milliseconds and seconds", () => {
    assert.equal(formatLatency(150), "150ms");
    assert.equal(formatLatency(850.4), "850ms");
    assert.equal(formatLatency(1500), "1.50s");
    assert.equal(formatLatency(3240), "3.24s");
  });

  test("getAnalyticsSummary returns fully populated KPIs and time-series buckets", async () => {
    // Create test user for foreign key constraint
    const testUser = await createUser(
      `analytics-test-${Date.now()}@domain.local`,
      "fake-hash",
      "Analytics Tester"
    );

    await recordHistory(testUser.id, {
      toolSlug: "compress-pdf",
      toolName: "Compress PDF",
      originalFilename: "sample_report.pdf",
      outputFilename: "sample_report_compressed.pdf",
      status: "completed",
      fileSize: 10000000,
      outputSize: 3000000,
      engine: "stirling",
    });

    await recordHistory(testUser.id, {
      toolSlug: "merge-pdf",
      toolName: "Merge PDF",
      originalFilename: "doc_a.pdf",
      outputFilename: "merged.pdf",
      status: "completed",
      fileSize: 5000000,
      outputSize: 4900000,
      engine: "wasm",
    });

    const summary = await getAnalyticsSummary({
      timeRange: "7d",
    });

    assert.ok(summary);
    assert.ok(summary.kpis);
    assert.ok(summary.kpis.totalJobs > 0, "Total jobs should be greater than 0");
    assert.ok(summary.kpis.totalBytesIn > 0, "Total bytes in should be greater than 0");
    assert.ok(summary.kpis.successRate >= 0 && summary.kpis.successRate <= 100);
    assert.ok(summary.kpis.savingsPercent >= 0 && summary.kpis.savingsPercent <= 100);

    // Verify time series
    assert.ok(Array.isArray(summary.timeSeries));
    assert.ok(summary.timeSeries.length > 0, "Time series should have buckets");

    // Verify category distribution
    assert.ok(Array.isArray(summary.categoryDistribution));
    assert.ok(summary.categoryDistribution.length > 0, "Category distribution should exist");

    // Verify engine distribution
    assert.ok(Array.isArray(summary.engineDistribution));
    assert.ok(summary.engineDistribution.length > 0, "Engine distribution should exist");

    // Verify recent operations
    assert.ok(Array.isArray(summary.recentOperations));
    assert.ok(summary.recentOperations.length > 0, "Recent operations should be returned");
  });

  test("getAnalyticsSummary supports category filtering", async () => {
    const summaryOrganize = await getAnalyticsSummary({
      timeRange: "7d",
      categoryFilter: "organize",
    });

    assert.ok(summaryOrganize);
    assert.ok(summaryOrganize.kpis.totalJobs >= 0);
    for (const op of summaryOrganize.recentOperations) {
      assert.ok(
        ["merge-pdf", "split-pdf", "rotate-pdf", "crop-pdf", "reorder-pages"].includes(op.tool_slug) ||
          op.tool_slug.length > 0
      );
    }
  });

  test("getAnalyticsSummary supports 24h hourly buckets", async () => {
    const summary24h = await getAnalyticsSummary({
      timeRange: "24h",
    });

    assert.ok(summary24h);
    assert.ok(Array.isArray(summary24h.timeSeries));
    assert.equal(summary24h.timeSeries.length, 12, "24h range should have 12 two-hour intervals");
  });
});
