import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Notice | PDF Studio",
  description: "Data handling and privacy architecture for PDF Studio.",
};

export default function PrivacyPage() {
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
            <Shield className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Privacy Architecture
          </h1>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          How PDF Studio manages information, processing privacy, and infrastructure boundaries.
        </p>
      </div>

      <div className="prose prose-zinc dark:prose-invert max-w-none text-sm space-y-6 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">1. Phase 1 Architecture Boundary</h2>
          <p>
            In Phase 1, PDF Studio operates strictly as a front-end client interface. No files are
            uploaded to any server, no telemetry cookies are placed on documents, and no personal data is collected.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">2. Self-Hosted Engine Processing</h2>
          <p>
            When server-side processing is activated in future phases, operations will be routed through your
            own self-hosted Stirling-PDF engine. Documents will remain within your designated environment
            rather than being relayed to commercial third-party conversion clouds.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">3. Retention Distinction</h2>
          <p>
            Future storage configurations will strictly delineate between processing metadata (logs of operation timestamps and status)
            and binary document storage. Automated file purge schedules will be configurable prior to production deployment.
          </p>
        </section>
      </div>
    </div>
  );
}
