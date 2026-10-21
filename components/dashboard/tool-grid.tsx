import * as React from "react";
import { ToolDefinition } from "@/types/tool";
import { ToolCard } from "./tool-card";
import { cn } from "@/lib/utils";

interface ToolGridProps {
  tools: ToolDefinition[];
  className?: string;
}

export function ToolGrid({ tools, className }: ToolGridProps) {
  if (tools.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5",
        className
      )}
    >
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
