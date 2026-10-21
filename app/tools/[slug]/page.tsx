import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllTools, getToolBySlug } from "@/config/tools";
import { ToolIcon } from "@/components/ui/tool-icon";
import { siteConfig } from "@/config/site";
import { GenericToolWorkspace } from "@/components/tools/generic-tool-workspace";
import { SignPdfWorkspace } from "@/components/tools/sign-pdf-workspace";
import { AutoRedactWorkspace } from "@/components/tools/auto-redact-workspace";
import { VideoDownloaderWorkspace } from "@/components/tools/video-downloader-workspace";
import { PhotoToolWorkspace } from "@/components/tools/photo-tool-workspace";

interface ToolPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {
      title: `Tool Not Found | ${siteConfig.name}`,
    };
  }

  return {
    title: `${tool.name} | ${siteConfig.name}`,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const activeTool = getToolBySlug(slug);

  // 1. Tool Validation: return 404 if slug does not match any registered tool
  if (!activeTool) {
    notFound();
  }

  // 2. Dynamic Component Switcher
  const renderWorkspace = () => {
    switch (activeTool.id) {
      case "sign-pdf":
        return <SignPdfWorkspace tool={activeTool} />;

      case "auto-redact":
      case "redact-pdf":
        return <AutoRedactWorkspace tool={activeTool} />;

      case "video-downloader":
        return <VideoDownloaderWorkspace tool={activeTool} />;

      case "photo-tool":
      case "passport-photo":
        return <PhotoToolWorkspace tool={activeTool} />;

      default:
        return <GenericToolWorkspace tool={activeTool} />;
    }
  };

  const isExpandedTool = activeTool.id === "photo-tool" || activeTool.id === "passport-photo";

  return (
    <div className="w-full flex flex-col items-center pb-24 pt-4 sm:pt-6">
      <main className={`w-full ${isExpandedTool ? "max-w-5xl" : "max-w-3xl"} px-4 flex flex-col`} data-purpose="tool-content">
        {/* Breadcrumb and Back */}
        <section aria-label="Breadcrumb navigation" className="flex flex-col gap-3 mb-6 animate-fade-in-up-1">
          <Link
            href="/#all-tools"
            className="back-link inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors w-fit font-mono group"
          >
            <span className="arrow-icon inline-block">←</span>
            <span>Back to Dashboard</span>
          </Link>
        </section>

        {/* Tool Header */}
        <section className="flex flex-col gap-4 pb-6 animate-fade-in-up-2" data-purpose="tool-header">
          <div className="flex items-start gap-4">
            {/* Tool Outline Icon Card */}
            <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center shrink-0 shadow-inner group transition-all duration-300 hover:border-white/25 hover:bg-[#1b1b1b]">
              <ToolIcon
                name={activeTool.iconName}
                className="w-6 h-6 text-neutral-200 stroke-[1.5] transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            {/* Tool Title & Category Tag */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
                  {activeTool.name}
                </h1>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-black border border-white/10 text-neutral-400 transition-colors hover:border-white/20">
                  {activeTool.category}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 font-mono mt-1">
                {activeTool.description}
              </p>
            </div>
          </div>
          {/* Hairline Divider */}
          <hr className="border-t border-white/10 w-full mt-2" />
        </section>

        {/* Dynamic Workspace Card */}
        <section className="w-full mt-2 animate-card-in" data-purpose="tool-action-workspace">
          {renderWorkspace()}
        </section>
      </main>
    </div>
  );
}
