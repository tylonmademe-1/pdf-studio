import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-xl px-4 py-24 sm:py-32 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
        <FileQuestion className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Tool or page not found
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          The requested tool route does not exist or may have been moved. Check the
          tools catalog to find available PDF operations.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-center gap-3">
        <Button asChild variant="default" className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/#tools">
            <ArrowLeft className="h-4 w-4" />
            Browse all tools
          </Link>
        </Button>
      </div>
    </div>
  );
}
