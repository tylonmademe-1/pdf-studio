"use client";

import * as React from "react";
import { Info, FileUp, CheckCircle2 } from "lucide-react";
import { ToolDefinition } from "@/types/tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ToolPlaceholderProps {
  tool: ToolDefinition;
}

export function ToolPlaceholder({ tool }: ToolPlaceholderProps) {
  return (
    <div className="space-y-6">
      {/* Informational banner explaining Phase 1 status */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-4 text-amber-900 dark:text-amber-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-foreground">
              Phase 1 Interface Shell
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This is the visual layout foundation for <strong className="text-foreground">{tool.name}</strong>.
              Actual document processing is powered by our self-hosted Stirling-PDF engine, scheduled
              for implementation in Phase 2 upon explicit approval.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Upload Zone Shell (strictly disabled/labeled as placeholder) */}
      <div className="relative rounded-2xl border-2 border-dashed border-border bg-card/60 p-8 sm:p-12 text-center transition-colors">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <FileUp className="h-8 w-8" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Drop your {tool.supportsMultipleFiles ? "files" : "file"} here
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Supports {tool.acceptedFileTypes.join(", ")} up to 100MB
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              disabled
              className="rounded-xl opacity-75 cursor-not-allowed text-xs font-mono"
            >
              Upload Engine Disconnected (Phase 1)
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground/80">
            {tool.supportsMultipleFiles
              ? "Multiple files can be merged or rearranged in Phase 2."
              : "Single document processing pipeline will activate in Phase 2."}
          </p>
        </div>
      </div>

      {/* Planned Options and Capabilities Matrix */}
      {tool.features && tool.features.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h4 className="text-sm font-semibold text-foreground">
              Planned Engine Features for {tool.name}
            </h4>
            <Badge variant="outline" className="text-xs">
              Stirling-PDF Ready
            </Badge>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
            {tool.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
