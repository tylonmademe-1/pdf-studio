"use client";

import * as React from "react";
import { TimeSeriesPoint } from "./types";
import { formatBytes, formatNumber } from "./utils";
import { BarChart3, TrendingUp, Layers } from "lucide-react";

interface ActivityChartProps {
  data: TimeSeriesPoint[];
  loading?: boolean;
}

export function ActivityChart({ data, loading = false }: ActivityChartProps) {
  const [metric, setMetric] = React.useState<"jobs" | "bytesIn">("jobs");
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  const points = data || [];
  const values = points.map((p) => (metric === "jobs" ? p.jobs : p.bytesIn));
  const maxVal = Math.max(...values, 1);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingBottom = 30;
  const paddingTop = 20;
  const paddingLeft = 10;
  const paddingRight = 10;

  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const count = points.length;

  const getX = (idx: number) => {
    if (count <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (idx / (count - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const ratio = val / maxVal;
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  // Build SVG path for smooth line and area
  const linePoints = points.map((p, idx) => ({
    x: getX(idx),
    y: getY(metric === "jobs" ? p.jobs : p.bytesIn),
  }));

  const pathD =
    linePoints.length > 0
      ? linePoints.reduce(
          (acc, curr, idx) => (idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
          ""
        )
      : "";

  const areaD =
    linePoints.length > 0
      ? `${pathD} L ${linePoints[linePoints.length - 1].x} ${paddingTop + chartHeight} L ${
          linePoints[0].x
        } ${paddingTop + chartHeight} Z`
      : "";

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="flex flex-col bg-white dark:bg-black border border-slate-200 dark:border-[#1f1f23] rounded-2xl overflow-hidden shadow-xs">
      {/* Terminal Window Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50/70 dark:bg-[#09090b] border-b border-slate-200 dark:border-[#1f1f23]">
        <div className="flex items-center gap-3">
          {/* Mac 3-Dot Controls */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-[#e0443e]/40" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-[#dea123]/40" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-[#1aab29]/40" />
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-[#222226]" />
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
              ACTIVITY_TIMELINE.SVG
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] text-slate-500 dark:text-slate-500">
              [REALTIME WASM TELEMETRY]
            </span>
          </div>
        </div>

        {/* Metric Toggles */}
        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-[#141417] p-1 rounded-lg border border-slate-300/60 dark:border-[#26262d]">
          <button
            type="button"
            onClick={() => setMetric("jobs")}
            className={`px-2.5 py-1 font-mono text-xs font-semibold rounded-md transition-all ${
              metric === "jobs"
                ? "bg-white dark:bg-black text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              Operations
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMetric("bytesIn")}
            className={`px-2.5 py-1 font-mono text-xs font-semibold rounded-md transition-all ${
              metric === "bytesIn"
                ? "bg-white dark:bg-black text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              Data Volume
            </span>
          </button>
        </div>
      </div>

      {/* Hover Inspection Bar */}
      <div className="px-5 py-2.5 bg-slate-50/40 dark:bg-[#070708] border-b border-slate-100 dark:border-[#141417] flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span className="text-slate-400 dark:text-slate-600">Hover probe:</span>
          {activePoint ? (
            <span className="text-slate-900 dark:text-white font-bold">
              {activePoint.date} &rarr;{" "}
              {metric === "jobs"
                ? `${formatNumber(activePoint.jobs)} operations`
                : `${formatBytes(activePoint.bytesIn)} processed`}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic">
              Move cursor across timeline to inspect buckets
            </span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Peak:{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {metric === "jobs" ? formatNumber(maxVal) : formatBytes(maxVal)}
            </strong>
          </span>
          <span>&middot;</span>
          <span>
            Buckets: <strong className="text-slate-800 dark:text-slate-200">{points.length}</strong>
          </span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative p-4 sm:p-6 w-full overflow-hidden select-none">
        {loading ? (
          <div className="h-56 w-full flex items-center justify-center font-mono text-xs text-slate-500 dark:text-slate-400 animate-pulse">
            Compiling time-series telemetry...
          </div>
        ) : points.length === 0 ? (
          <div className="h-56 w-full flex items-center justify-center font-mono text-xs text-slate-500 dark:text-slate-400">
            No telemetry records detected for the selected period.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 sm:h-64 overflow-visible"
              preserveAspectRatio="none"
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="80%" stopColor="#3b82f6" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Horizontal benchmark gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = paddingTop + chartHeight * (1 - pct);
                const benchmarkVal = maxVal * pct;
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      className="text-slate-200 dark:text-[#1c1c22]"
                      strokeWidth="1"
                    />
                    <text
                      x={svgWidth - paddingRight}
                      y={y - 4}
                      textAnchor="end"
                      className="font-mono text-[9px] fill-slate-400 dark:fill-slate-600"
                    >
                      {metric === "jobs"
                        ? formatNumber(Math.round(benchmarkVal))
                        : formatBytes(benchmarkVal)}
                    </text>
                  </g>
                );
              })}

              {/* Shaded Area fill */}
              {areaD && <path d={areaD} fill="url(#activityGradient)" />}

              {/* Vector line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive nodes & Columns */}
              {linePoints.map((pt, idx) => {
                const isHovered = hoverIndex === idx;
                const p = points[idx];
                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(idx)}
                  >
                    {/* Hover vertical guideline */}
                    {isHovered && (
                      <line
                        x1={pt.x}
                        y1={paddingTop}
                        x2={pt.x}
                        y2={paddingTop + chartHeight}
                        stroke="#60a5fa"
                        strokeDasharray="2 2"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Node circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 3.5}
                      className="transition-all duration-150"
                      fill={isHovered ? "#60a5fa" : "#3b82f6"}
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 2.5 : 1.5}
                    />

                    {/* Date label at bottom */}
                    {(idx % Math.ceil(count / 8) === 0 || idx === count - 1) && (
                      <text
                        x={pt.x}
                        y={svgHeight - 6}
                        textAnchor="middle"
                        className="font-mono text-[10px] fill-slate-400 dark:fill-slate-500"
                      >
                        {p.date}
                      </text>
                    )}

                    {/* Invisible hover hitbox */}
                    <rect
                      x={pt.x - chartWidth / (count * 2)}
                      y={paddingTop}
                      width={Math.max(12, chartWidth / count)}
                      height={chartHeight + paddingBottom}
                      fill="transparent"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
