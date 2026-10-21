export type TimeRange = "24h" | "7d" | "30d" | "all";

export interface AnalyticsKPIs {
  totalJobs: number;
  totalBytesIn: number;
  totalBytesOut: number;
  bytesSaved: number;
  savingsPercent: number;
  successRate: number;
  completedCount: number;
  failedCount: number;
  avgLatencyMs: number;
}

export interface TimeSeriesPoint {
  date: string;
  timestamp: number;
  jobs: number;
  bytesIn: number;
  bytesOut: number;
  bytesSaved: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
  bytesProcessed: number;
}

export interface EngineDistribution {
  engine: string;
  count: number;
  percentage: number;
}

export interface RecentOperation {
  id: string;
  tool_slug: string;
  tool_name: string;
  original_filename: string;
  output_filename: string;
  status: "completed" | "failed";
  file_size: number;
  output_size: number | null;
  engine: string | null;
  created_at: number;
}

export interface AnalyticsData {
  kpis: AnalyticsKPIs;
  timeSeries: TimeSeriesPoint[];
  categoryDistribution: CategoryDistribution[];
  engineDistribution: EngineDistribution[];
  recentOperations: RecentOperation[];
}
