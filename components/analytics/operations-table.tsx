"use client";

import * as React from "react";
import { RecentOperation } from "./types";
import { formatBytes, exportOperationsToCsv } from "./utils";
import {
  FileText,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Terminal,
} from "lucide-react";

interface OperationsTableProps {
  operations: RecentOperation[];
  loading?: boolean;
}

export function OperationsTable({ operations, loading = false }: OperationsTableProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "completed" | "failed">("all");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const filtered = (operations || []).filter((item) => {
    const matchesSearch =
      search.trim() === "" ||
      item.tool_name.toLowerCase().includes(search.toLowerCase()) ||
      item.tool_slug.toLowerCase().includes(search.toLowerCase()) ||
      item.original_filename.toLowerCase().includes(search.toLowerCase()) ||
      (item.output_filename && item.output_filename.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCsv = () => {
    exportOperationsToCsv(filtered);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-black border border-slate-200 dark:border-[#1f1f23] rounded-2xl overflow-hidden shadow-xs">
      {/* Terminal Window Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50/70 dark:bg-[#09090b] border-b border-slate-200 dark:border-[#1f1f23]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-[#e0443e]/40" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-[#dea123]/40" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-[#1aab29]/40" />
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-[#222226]" />
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
              OPERATIONS_LOG.JOURNAL
            </span>
            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
              ({filtered.length} entries)
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-[#151518] hover:bg-slate-200 dark:hover:bg-[#202026] text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold rounded-lg border border-slate-300/80 dark:border-[#26262e] transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:px-4 bg-slate-50/30 dark:bg-[#070709] border-b border-slate-100 dark:border-[#141418] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search operations, filenames, tools..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-[#0f0f12] border border-slate-200 dark:border-[#222228] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-[#121215] p-0.5 rounded-lg border border-slate-300/60 dark:border-[#222229]">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              statusFilter === "all"
                ? "bg-white dark:bg-black text-slate-900 dark:text-white font-bold shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("completed");
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              statusFilter === "completed"
                ? "bg-white dark:bg-black text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("failed");
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              statusFilter === "failed"
                ? "bg-white dark:bg-black text-rose-600 dark:text-rose-400 font-bold shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1a1a20] bg-slate-50/50 dark:bg-[#0a0a0d] text-slate-500 dark:text-slate-400 text-[11px]">
              <th className="py-2.5 px-4 font-semibold">TOOL / ENGINE</th>
              <th className="py-2.5 px-4 font-semibold">ORIGINAL FILE</th>
              <th className="py-2.5 px-4 font-semibold">SIZE (IN &rarr; OUT)</th>
              <th className="py-2.5 px-4 font-semibold">STATUS</th>
              <th className="py-2.5 px-4 font-semibold text-right">TIMESTAMP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#141419]">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500 animate-pulse">
                  Querying database execution records...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  No matching execution records found.
                </td>
              </tr>
            ) : (
              paginated.map((item) => {
                const dateStr = new Date(item.created_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#0e0e12] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.tool_name}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            {item.engine || "wasm"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-[180px] sm:max-w-xs truncate text-slate-700 dark:text-slate-300">
                      <span title={item.original_filename}>
                        {item.original_filename}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-900 dark:text-white">
                        {formatBytes(item.file_size)}
                        {item.output_size !== null && (
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-1">
                            &rarr; {formatBytes(item.output_size)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {item.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          FAILED
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {dateStr}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 bg-slate-50/60 dark:bg-[#070709] border-t border-slate-100 dark:border-[#141418] flex items-center justify-between font-mono text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-white dark:bg-[#121216] border border-slate-200 dark:border-[#22222a] text-slate-700 dark:text-slate-300 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded bg-white dark:bg-[#121216] border border-slate-200 dark:border-[#22222a] text-slate-700 dark:text-slate-300 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
