import Link from "next/link";
import { HelpCircle, ArrowLeft, Cpu, Shield, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Help & FAQ | PDF Studio",
  description: "Frequently asked questions and technical documentation for PDF Studio.",
};

const faqs = [
  {
    q: "How does PDF Studio process documents?",
    a: "PDF Studio is designed around a self-hosted Stirling-PDF engine accessed via server-side Next.js route handlers. This provides high-performance document operations without relying on third-party cloud conversion APIs.",
  },
  {
    q: "Which tools are available in Phase 1?",
    a: "Phase 1 provides the complete UI design system, responsive dashboard, real-time tool search, category navigation, theme system, and individual tool page shells for 8 core tools across 5 categories.",
  },
  {
    q: "When will document processing be enabled?",
    a: "Actual PDF manipulation will be connected in Phase 2 via self-hosted Docker Stirling-PDF instances upon explicit phase approval.",
  },
  {
    q: "How is document security handled?",
    a: "Because processing will occur on your own self-hosted engine, documents remain within your infrastructure. In future phases, strict temporary retention and auto-delete schedules will govern temporary files.",
  },
];

export default function HelpPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-16 space-y-10">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="pl-0 gap-2 mb-2 text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Help & Technical FAQ
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Learn about PDF Studio architecture, operational roadmap, and supported features.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <Cpu className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Self-Hosted Engine</h3>
          <p className="text-xs text-muted-foreground">
            Backed by a containerized Stirling-PDF instance for local processing.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Direct API Proxy</h3>
          <p className="text-xs text-muted-foreground">
            Next.js Route Handlers act as a secure server-side boundary.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Modern Stack</h3>
          <p className="text-xs text-muted-foreground">
            Built with Next.js App Router, Tailwind CSS, TypeScript, and shadcn tokens.
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="p-5 rounded-xl border border-border bg-card space-y-2"
            >
              <h3 className="font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                {faq.q}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
