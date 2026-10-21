"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface HistoryItem {
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

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    fetch("/api/history")
      .then((res) => {
        if (res.status === 401) {
          if (isMounted) {
            setAuthenticated(false);
            setLoading(false);
          }
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data) {
          setHistory(data.history || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
          toast.error("Failed to load processing history.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        toast.success("Record deleted.");
      }
    } catch {
      toast.error("Failed to delete record.");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear your entire processing history?")) {
      return;
    }

    try {
      const res = await fetch("/api/history", { method: "DELETE" });
      if (res.ok) {
        setHistory([]);
        toast.success("History cleared.");
      }
    } catch {
      toast.error("Failed to clear history.");
    }
  };

  if (!loading && !authenticated) {
    return (
      <div className="container mx-auto max-w-md px-4 py-20 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
          <Clock className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Sign In Required</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            You must be signed in to view and manage your document processing history.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <Button asChild variant="ghost" size="sm" className="pl-0 gap-2 mb-2 text-muted-foreground">
            <Link href="/account">
              <ArrowLeft className="h-4 w-4" />
              Back to Account
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-primary" />
            Processing History
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Metadata records for document operations executed by your account.
          </p>
        </div>

        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 self-start sm:self-auto"
          >
            <Trash2 className="h-4 w-4" />
            Clear All History
          </Button>
        )}
      </div>

      {/* Retention Policy Notice */}
      <div className="p-4 rounded-xl border border-border/80 bg-muted/40 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-primary shrink-0" />
          Document Retention Policy Notice:
        </p>
        <p className="leading-relaxed">
          In alignment with our strict document privacy architecture, history records store
          operation <strong>metadata only</strong> (timestamps, filenames, and byte sizes).
          Original binary files and processed outputs are never retained on persistent server
          storage and must be downloaded during your active processing session.
        </p>
      </div>

      {/* History Records Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading history records...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl p-8 space-y-4">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
          <h3 className="font-semibold text-foreground">No processing history yet</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            Operations you run while signed in will automatically be recorded here.
          </p>
          <Button asChild variant="outline">
            <Link href="/#tools">Explore Tools</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground font-medium uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Tool</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                    <Link
                      href={`/tools/${item.tool_slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {item.tool_name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground max-w-xs truncate" title={item.original_filename}>
                    {item.original_filename}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {formatBytes(item.file_size)}
                    {item.output_size ? ` → ${formatBytes(item.output_size)}` : ""}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.status === "completed" ? (
                      <Badge variant="success" className="gap-1 font-normal text-[11px]">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 font-normal text-[11px]">
                        <XCircle className="h-3 w-3" />
                        Failed
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(item.id)}
                      aria-label="Delete history record"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
