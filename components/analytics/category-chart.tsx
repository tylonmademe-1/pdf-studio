"use client";

import * as React from "react";
import { CategoryDistribution } from "./types";
import { formatBytes, formatNumber } from "./utils";
import { PieChart, Filter } from "lucide-react";

interface CategoryChartProps {
  data: CategoryDistribution[];
  loading?: boolean;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const CATEGORY_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  ORGANIZE: { bar: "bg-blue-500", text: "text-blue-500", bg: "bg-blue-500/10" },
  CONVERT: { bar: "bg-indigo-500", text: "text-indigo-500", bg: "bg-indigo-500/10" },
  OPTIMIZE: { bar: "bg-emerald-500", text: "text-emerald-500", bg: "bg-emerald-500/10" },
  SECURITY: { bar: "bg-rose-500", text: "text-rose-500", bg: "bg-rose-500/10" },
  OCR: { bar: "bg-amber-500", text: "text-amber-500", bg: "bg-amber-500/10" },
  VIDEO: { bar: "bg-purple-500", text: "text-purple-500", bg: "bg-purple-500/10" },
  PHOTO: { bar: "bg-teal-500", text: "text-teal-500", bg: "bg-teal-500/10" },
};

const DEFAULT_COLOR = { bar: "bg-sky-500", text: "text-sky-500", bg: "bg-sky-500/10" };

export function CategoryChart({
  data,
  loading = false,
  selectedCategory = "all",
  onSelectCategory,
}: CategoryChartProps) {
  const categories = data || [];
  const maxCount = Math.max(...categories.map((c) => c.count), 1);

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
            <PieChart className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
              CATEGORY_DISTRIBUTION.MATRIX
            </span>
          </div>
        </div>

        {selectedCategory !== "all" && onSelectCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className="flex items-center gap-1 font-mono text-[11px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <Filter className="w-3 h-3" />
            Clear Filter
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-3.5">
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-full bg-slate-100 dark:bg-[#151518] rounded animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-slate-500 dark:text-slate-400">
            No category execution logs available.
          </div>
        ) : (
          categories.map((item) => {
            const catKey = item.category.toUpperCase();
            const color = CATEGORY_COLORS[catKey] || DEFAULT_COLOR;
            const barWidth = Math.max(4, Math.round((item.count / maxCount) * 100));
            const isSelected = selectedCategory.toUpperCase() === catKey;

            return (
              <div
                key={item.category}
                onClick={() => onSelectCategory && onSelectCategory(catKey.toLowerCase())}
                className={`group p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-100 dark:bg-[#16161b] border-blue-500/50 dark:border-blue-500/50"
                    : "bg-slate-50/50 dark:bg-[#0c0c0e] border-slate-200/60 dark:border-[#1a1a1f] hover:border-slate-300 dark:hover:border-[#272730]"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${color.bar}`} />
                    <span className="font-bold text-slate-800 dark:text-slate-200 tracking-wide">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      ({formatBytes(item.bytesProcessed)})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatNumber(item.count)} ops
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 w-10 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full h-2 bg-slate-200/80 dark:bg-[#1a1a20] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color.bar} rounded-full transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
