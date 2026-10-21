"use client";

import * as React from "react";
import { CategorySection } from "./category-section";
import { CATEGORIES, TOOLS } from "@/config/tools";
import { ToolCategory } from "@/types/tool";

// Pre-compute tools per category outside component render loop
const CATEGORY_TOOLS_MAP = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = TOOLS.filter((t) => t.category === cat.id);
  return acc;
}, {} as Record<string, typeof TOOLS>);

const CATEGORY_COUNTS = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = (CATEGORY_TOOLS_MAP[cat.id] || []).length;
  return acc;
}, {} as Record<string, number>);

export function DashboardView() {
  const [selectedCategory, setSelectedCategory] = React.useState<
    ToolCategory | "all"
  >("all");

  return (
    <div id="all-tools" className="space-y-8 scroll-mt-28">
      {/* Category Navigation Bar */}
      <section
        className="py-2 transition-all duration-300"
        data-purpose="category-nav-bar"
        id="categories-anchor"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-1 overflow-x-auto text-[11px] font-mono no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`min-h-[32px] inline-flex items-center justify-center px-3 py-1.5 rounded transition-colors cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-ink text-canvas font-bold shadow-xs"
                  : "text-body hover:text-ink hover:bg-surface-container font-medium"
              }`}
            >
              [All Tools ({TOOLS.length})]
            </button>
            {CATEGORIES.map((cat) => {
              const count = CATEGORY_COUNTS[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-[32px] inline-flex items-center justify-center px-3 py-1.5 rounded transition-colors uppercase cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-ink text-canvas font-bold shadow-xs"
                      : "text-body hover:text-ink hover:bg-surface-container font-medium"
                  }`}
                >
                  {cat.id} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Catalog */}
      <main className="max-w-7xl mx-auto space-y-12">
        {selectedCategory === "all"
          ? CATEGORIES.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                tools={CATEGORY_TOOLS_MAP[category.id] || []}
              />
            ))
          : (() => {
              const category = CATEGORIES.find((c) => c.id === selectedCategory);
              if (!category) return null;
              return (
                <CategorySection
                  key={category.id}
                  category={category}
                  tools={CATEGORY_TOOLS_MAP[category.id] || []}
                />
              );
            })()}
      </main>
    </div>
  );
}
