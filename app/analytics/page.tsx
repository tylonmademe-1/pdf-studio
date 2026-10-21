import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Activity, Cpu } from "lucide-react";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const metadata: Metadata = {
  title: "Processing Analytics & Telemetry | PDF Studio",
  description:
    "Interactive dark/light telemetry dashboard tracking document operations, storage efficiency, latency, and engine distribution.",
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#1f1f23]">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-2.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Tools
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono flex items-center gap-2">
                PROCESSING_ANALYTICS
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Real-time telemetry, bandwidth optimization, and engine execution distribution
              </p>
            </div>
          </div>
        </div>

        {/* Live Badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE TELEMETRY</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-[#222228] text-slate-600 dark:text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-blue-500" />
            <span>WASM / NATIVE</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Dashboard */}
      <Suspense
        fallback={
          <div className="py-20 text-center font-mono text-xs text-slate-500 dark:text-slate-400 animate-pulse">
            Loading telemetry metrics...
          </div>
        }
      >
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}
