import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms of Use | PDF Studio",
  description: "Terms and operational guidance for PDF Studio.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-16 space-y-8">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="pl-0 gap-2 mb-2 text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Scale className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Terms of Use
          </h1>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Operational terms and self-hosted toolkit guidelines.
        </p>
      </div>

      <div className="prose prose-zinc dark:prose-invert max-w-none text-sm space-y-6 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing PDF Studio, you acknowledge that Phase 1 represents a user interface and structural
            preview. Processing functions are strictly simulated via design shells pending backend integration.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">2. Appropriate Document Usage</h2>
          <p>
            When utilizing self-hosted engines in subsequent phases, users are responsible for ensuring that all
            processed documents comply with relevant copyright, intellectual property, and privacy regulations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">3. Open-Source Engine Licensing</h2>
          <p>
            The underlying Stirling-PDF engine is licensed under its respective open-source terms (GPL-3.0).
            Integration components created within this application maintain compatibility with these standards.
          </p>
        </section>
      </div>
    </div>
  );
}
