"use client";

import * as React from "react";
import { AnalyticsData, TimeRange } from "./types";
import { KpiGrid } from "./kpi-grid";
import { ActivityChart } from "./activity-chart";
import { CategoryChart } from "./category-chart";
import { SavingsChart } from "./savings-chart";
import { OperationsTable } from "./operations-table";
import {
  RotateCw,
  Calendar,
  Filter,
  AlertCircle,
  Globe,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Past 7 Days" },
  { value: "30d", label: "Past 30 Days" },
  { value: "all", label: "All Time" },
];

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "organize", label: "Organize" },
  { value: "convert", label: "Convert" },
  { value: "optimize", label: "Optimize" },
  { value: "security", label: "Security" },
  { value: "ocr", label: "OCR" },
  { value: "video", label: "Video" },
  { value: "photo", label: "Photo" },
];

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = React.useState<TimeRange>("7d");
  const [category, setCategory] = React.useState<string>("all");
  const [scope, setScope] = React.useState<"global" | "user">("global");
  const [hasUserSession, setHasUserSession] = React.useState(false);

  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = React.useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Check auth session
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((userRes) => {
        if (userRes?.user) {
          setHasUserSession(true);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({
      timeRange,
      category,
      scope,
    });

    fetch(`/api/analytics?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load analytics: ${res.statusText}`);
        return res.json();
      })
      .then((json: AnalyticsData) => {
        if (!ignore) {
          setData(json);
          setLastRefreshed(new Date());
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Error querying telemetry engine";
          setError(msg);
          setLoading(false);
          toast.error(msg);
        }
      });

    return () => {
      ignore = true;
    };
  }, [timeRange, category, scope, refreshTrigger]);

  const handleManualRefresh = () => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Control / Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white dark:bg-black border border-slate-200 dark:border-[#1f1f23] rounded-2xl shadow-xs">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#121215] p-1 rounded-xl border border-slate-200 dark:border-[#222228]">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {TIME_RANGES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTimeRange(t.value)}
                className={`px-3 py-1 font-mono text-xs font-semibold rounded-lg transition-all ${
                  timeRange === t.value
                    ? "bg-white dark:bg-black text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-[#2b2b34]"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-[#222228] font-mono text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-mono text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                {CATEGORIES.map((c) => (
                  <option
                    key={c.value}
                    value={c.value}
                    className="bg-white dark:bg-[#121215] text-slate-900 dark:text-white"
                  >
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scope Selector (Global vs My Account) */}
          {hasUserSession && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#121215] p-1 rounded-xl border border-slate-200 dark:border-[#222228]">
              <button
                type="button"
                onClick={() => setScope("global")}
                className={`flex items-center gap-1 px-2.5 py-1 font-mono text-xs rounded-lg transition-all ${
                  scope === "global"
                    ? "bg-white dark:bg-black text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200 dark:border-[#2b2b34]"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Globe className="w-3 h-3" />
                Global
              </button>
              <button
                type="button"
                onClick={() => setScope("user")}
                className={`flex items-center gap-1 px-2.5 py-1 font-mono text-xs rounded-lg transition-all ${
                  scope === "user"
                    ? "bg-white dark:bg-black text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200 dark:border-[#2b2b34]"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <UserCheck className="w-3 h-3" />
                My Account
              </button>
            </div>
          )}
        </div>

        {/* Right: Refresh button and status */}
        <div className="flex items-center gap-3 justify-end font-mono text-xs">
          <span className="hidden sm:inline-block text-slate-400 dark:text-slate-500 text-[11px]">
            {lastRefreshed
              ? `Updated ${lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : "Syncing..."}
          </span>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#121215] hover:bg-slate-200 dark:hover:bg-[#1a1a20] border border-slate-200 dark:border-[#222228] text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-500" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error notification banner if any */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-mono text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Error loading live telemetry: {error}</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      <KpiGrid
        kpis={
          data?.kpis || {
            totalJobs: 0,
            totalBytesIn: 0,
            totalBytesOut: 0,
            bytesSaved: 0,
            savingsPercent: 0,
            successRate: 100,
            completedCount: 0,
            failedCount: 0,
            avgLatencyMs: 0,
          }
        }
        loading={loading && !data}
      />

      {/* Time-Series Chart */}
      <ActivityChart data={data?.timeSeries || []} loading={loading && !data} />

      {/* Category Breakdown & Storage Savings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart
          data={data?.categoryDistribution || []}
          loading={loading && !data}
          selectedCategory={category}
          onSelectCategory={(cat) => setCategory(cat)}
        />
        <SavingsChart
          kpis={
            data?.kpis || {
              totalJobs: 0,
              totalBytesIn: 0,
              totalBytesOut: 0,
              bytesSaved: 0,
              savingsPercent: 0,
              successRate: 100,
              completedCount: 0,
              failedCount: 0,
              avgLatencyMs: 0,
            }
          }
          engineDistribution={data?.engineDistribution || []}
          loading={loading && !data}
        />
      </div>

      {/* Detailed Operations Log Table */}
      <OperationsTable operations={data?.recentOperations || []} loading={loading && !data} />
    </div>
  );
}
