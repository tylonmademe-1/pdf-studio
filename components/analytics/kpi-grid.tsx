"use client";

import * as React from "react";
import {
  Activity,
  ArrowDownCircle,
  Zap,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { AnalyticsKPIs } from "./types";
import { formatBytes, formatNumber, formatLatency } from "./utils";

interface KpiGridProps {
  kpis: AnalyticsKPIs;
  loading?: boolean;
}

export function KpiGrid({ kpis, loading = false }: KpiGridProps) {
  const cards = [
    {
      id: "jobs",
      label: "TOTAL OPERATIONS",
      value: formatNumber(kpis.totalJobs),
      sub: `${formatNumber(kpis.completedCount)} completed · ${kpis.failedCount} failed`,
      icon: Activity,
      accent: "text-blue-500 dark:text-blue-400",
      pill: "BATCH / ATOMIC",
    },
    {
      id: "volume",
      label: "DATA INGESTED",
      value: formatBytes(kpis.totalBytesIn),
      sub: `Output volume: ${formatBytes(kpis.totalBytesOut)}`,
      icon: ArrowDownCircle,
      accent: "text-purple-500 dark:text-purple-400",
      pill: "BANDWIDTH",
    },
    {
      id: "savings",
      label: "STORAGE SAVED",
      value: formatBytes(kpis.bytesSaved),
      sub: `${kpis.savingsPercent}% compression yield`,
      icon: Zap,
      accent: "text-emerald-500 dark:text-emerald-400",
      pill: "EFFICIENCY",
    },
    {
      id: "reliability",
      label: "SUCCESS RATE",
      value: `${kpis.successRate}%`,
      sub: `${kpis.failedCount === 0 ? "Zero runtime errors" : `${kpis.failedCount} error encounters`}`,
      icon: ShieldCheck,
      accent: "text-amber-500 dark:text-amber-400",
      pill: "HEALTH",
    },
    {
      id: "latency",
      label: "AVG LATENCY",
      value: formatLatency(kpis.avgLatencyMs),
      sub: "WASM / Native execution",
      icon: Cpu,
      accent: "text-cyan-500 dark:text-cyan-400",
      pill: "PERFORMANCE",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="group relative flex flex-col justify-between p-4 bg-white dark:bg-black border border-slate-200 dark:border-[#1f1f23] rounded-xl hover:border-slate-300 dark:hover:border-[#2f2f35] transition-all duration-200 shadow-2xs"
          >
            {/* Top row with dots and indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 group-hover:bg-emerald-500 transition-colors" />
                <span className="font-mono text-[10px] tracking-wider font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  {card.label}
                </span>
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#111113] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#26262b]">
                {card.pill}
              </span>
            </div>

            {/* Metric Value */}
            <div className="my-1 flex items-baseline justify-between">
              <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {loading ? (
                  <span className="inline-block w-20 h-7 bg-slate-200 dark:bg-[#1f1f23] rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </div>
              <div className={`p-1.5 rounded-lg bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-[#222228] ${card.accent}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Bottom Subtext */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#19191e] font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {loading ? (
                <span className="inline-block w-28 h-3.5 bg-slate-200 dark:bg-[#1f1f23] rounded animate-pulse" />
              ) : (
                card.sub
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
