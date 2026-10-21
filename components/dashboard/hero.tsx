import * as React from "react";
import Link from "next/link";

export function Hero() {
  return (
    <section
      className="w-full pt-10 pb-12 hairline-b bg-surface-soft px-4 sm:px-6 lg:px-8 mb-6"
      data-purpose="hero-container"
    >
      <div className="max-w-7xl mx-auto">
        <div className="space-y-5 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink font-mono leading-tight">
            EVERYTHING YOU NEED
            <br />
            TO PROCESS DOCUMENTS.
          </h1>

          <p className="text-sm font-mono text-body leading-relaxed font-code">
            Deterministic, client-side PDF manipulation engine compiled to WebAssembly.
            Execute atomic merges, format conversions, cryptographic signing, and OCR
            extractions locally with zero network egress and verified air-gapped privacy.
          </p>

          {/* Primary Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="#all-tools"
              className="btn-interactive inline-flex items-center gap-2 px-4 py-2 bg-ink text-canvas font-mono text-xs font-bold hover:bg-charcoal shadow-xs"
              style={{ borderRadius: "6px" }}
            >
              <span>EXPLORE ALL TOOLS</span>
              <span className="font-normal opacity-80">→</span>
            </Link>
            <Link
              href="#categories-anchor"
              className="btn-interactive inline-flex items-center gap-2 px-4 py-2 hairline-all bg-canvas text-ink font-mono text-xs font-bold hover:bg-surface hover:border-ink"
              style={{ borderRadius: "6px" }}
            >
              <span>BROWSE TAXONOMY</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
