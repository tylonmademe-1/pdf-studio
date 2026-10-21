"use client";

import * as React from "react";
import { AnalyticsKPIs, EngineDistribution } from "./types";
import { formatBytes } from "./utils";
import { Zap, Cpu, HardDriveDownload, HardDriveUpload } from "lucide-react";

interface SavingsChartProps {
  kpis: AnalyticsKPIs;
  engineDistribution: EngineDistribution[];
  loading?: boolean;
}

export function SavingsChart({ kpis, engineDistribution, loading = false }: SavingsChartProps) {
  const bytesIn = kpis.totalBytesIn;
  const bytesOut = kpis.totalBytesOut;
  const bytesSaved = kpis.bytesSaved;
  const savingsPercent = kpis.savingsPercent;

  // Percentage calculations
  const totalBar = Math.max(bytesIn, 1);
  const outRatio = Math.min(100, Math.round((bytesOut / totalBar) * 100));
  const savedRatio = Math.min(100, Math.round((bytesSaved / totalBar) * 100));

  return (
    <div className="flex flex-col bg-white dark:bg-black border border-slate-200 dark:border-[#1f1f23] rounded-2xl overflow-hidden shadow-xs">
      {/* Terminal Window Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 dark:bg-[#09090b] border-b border-slate-200 dark:border-[#1f1f23]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-[#e0443e]/40" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-[#dea123]/40" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-[#1aab29]/40" />
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-[#222226]" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
              PAYLOAD_SAVINGS_&_ENGINES.SYS
            </span>
          </div>
        </div>

        <span className="font-mono text-[10px] text-emerald-500 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          +{savingsPercent}% REDUCTION
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-6">
        {loading ? (
          <div className="space-y-4 py-8">
            <div className="h-14 bg-slate-100 dark:bg-[#151518] rounded animate-pulse" />
            <div className="h-20 bg-slate-100 dark:bg-[#151518] rounded animate-pulse" />
          </div>
        ) : (
          <>
            {/* Visual Delta Bandwidth Comparison */}
            <div className="space-y-3">
              <div className="flex items-center justify-between font-mono text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <HardDriveUpload className="w-3.5 h-3.5 text-blue-500" />
                  Raw Ingested: <strong className="text-slate-900 dark:text-white">{formatBytes(bytesIn)}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <HardDriveDownload className="w-3.5 h-3.5 text-purple-500" />
                  Output Payload: <strong className="text-slate-900 dark:text-white">{formatBytes(bytesOut)}</strong>
                </span>
              </div>

              {/* Dual-bar delta visualizer */}
              <div className="h-4 w-full bg-slate-100 dark:bg-[#151518] rounded-md overflow-hidden flex border border-slate-200 dark:border-[#222229]">
                <div
                  className="bg-purple-500 h-full transition-all duration-500"
                  style={{ width: `${outRatio}%` }}
                  title={`Output: ${formatBytes(bytesOut)} (${outRatio}%)`}
                />
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${savedRatio}%` }}
                  title={`Storage Saved: ${formatBytes(bytesSaved)} (${savedRatio}%)`}
                />
              </div>

              <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-purple-500" />
                  <span>Emitted ({outRatio}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  <span className="text-emerald-500 font-bold">Saved ({savedRatio}%)</span>
                </div>
              </div>
            </div>

            {/* Execution Engine Distribution */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-[#19191e]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                  RUNTIME ENGINE DISTRIBUTION
                </span>
                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                  WASM &middot; NATIVE &middot; HYBRID
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {engineDistribution.map((eng) => (
                  <div
                    key={eng.engine}
                    className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-[#0d0d0f] border border-slate-200/60 dark:border-[#1a1a20] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between font-mono text-xs mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                        {eng.engine}
                      </span>
                      <span className="font-mono text-slate-900 dark:text-white font-semibold">
                        {eng.count}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-[#1f1f26] rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${Math.max(5, eng.percentage)}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-right">
                      {eng.percentage}% of workload
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
