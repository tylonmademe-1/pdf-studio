import * as React from "react";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { ToolDefinition } from "@/types/tool";
import { ToolIcon } from "@/components/ui/tool-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToolWorkspace } from "./tool-workspace";

interface ToolPageLayoutProps {
  tool: ToolDefinition;
}

export function ToolPageLayout({ tool }: ToolPageLayoutProps) {
  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/"
          className="hover:text-foreground transition-colors"
        >
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href="/#tools"
          className="hover:text-foreground transition-colors"
        >
          Tools
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate">
          {tool.name}
        </span>
      </nav>

      {/* Back button and Tool Header */}
      <div className="space-y-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground pl-0 pr-3 h-8"
        >
          <Link href="/#tools">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to all tools
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <ToolIcon name={tool.iconName} className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {tool.name}
                </h1>
                <Badge variant="secondary" className="uppercase text-[10px] tracking-wider font-semibold">
                  {tool.category}
                </Badge>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {tool.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tool Interactive Workspace */}
      <ToolWorkspace tool={tool} />
    </div>
  );
}
