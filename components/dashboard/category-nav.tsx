"use client";

import * as React from "react";
import { CategoryDefinition, ToolCategory } from "@/types/tool";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: CategoryDefinition[];
  activeCategory: ToolCategory | "all";
  onSelectCategory: (category: ToolCategory | "all") => void;
  counts: Record<string, number>;
}

export function CategoryNav({
  categories,
  activeCategory,
  onSelectCategory,
  counts,
}: CategoryNavProps) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <nav
      aria-label="Filter tools by category"
      className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none"
    >
      <button
        onClick={() => onSelectCategory("all")}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer",
          activeCategory === "all"
            ? "bg-foreground text-background shadow-xs"
            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <span>All Tools</span>
        <span
          className={cn(
            "text-xs px-1.5 py-0.2 rounded-full font-mono",
            activeCategory === "all"
              ? "bg-background/20 text-background"
              : "bg-background/80 text-muted-foreground"
          )}
        >
          {totalCount}
        </span>
      </button>

      {categories.map((cat) => {
        const count = counts[cat.id] || 0;
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer",
              isActive
                ? "bg-foreground text-background shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span>{cat.name}</span>
            <span
              className={cn(
                "text-xs px-1.5 py-0.2 rounded-full font-mono",
                isActive
                  ? "bg-background/20 text-background"
                  : "bg-background/80 text-muted-foreground"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
