import { RecentOperation } from "./types";

export function formatBytes(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i] || "B"}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 10_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

export function formatLatency(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${Math.round(ms)}ms`;
}

export function exportOperationsToCsv(operations: RecentOperation[]): void {
  if (!operations || operations.length === 0) return;

  const headers = [
    "ID",
    "Timestamp",
    "Date",
    "Tool Slug",
    "Tool Name",
    "Original Filename",
    "Output Filename",
    "Status",
    "Input Size (Bytes)",
    "Output Size (Bytes)",
    "Engine",
  ];

  const rows = operations.map((op) => [
    op.id,
    op.created_at,
    new Date(op.created_at).toISOString(),
    `"${op.tool_slug}"`,
    `"${op.tool_name.replace(/"/g, '""')}"`,
    `"${op.original_filename.replace(/"/g, '""')}"`,
    `"${op.output_filename.replace(/"/g, '""')}"`,
    op.status,
    op.file_size,
    op.output_size ?? "",
    `"${op.engine || ""}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `pdf_studio_operations_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
