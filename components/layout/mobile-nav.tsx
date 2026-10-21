"use client";

import * as React from "react";
import Link from "next/link";
import { X, FileText } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md md:hidden animate-in fade-in-0 duration-200"
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2.5 font-bold text-lg text-foreground"
        >
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <span>{siteConfig.name}</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <nav className="flex flex-col space-y-3 font-mono text-xs">
          <Link
            href="/#all-tools"
            onClick={onClose}
            className="py-2 px-3 rounded-lg text-foreground hover:bg-surface-container transition-colors"
          >
            [All Tools (54)]
          </Link>
          <Link
            href="/#organize"
            onClick={onClose}
            className="py-2 px-3 rounded-lg text-foreground hover:bg-surface-container transition-colors"
          >
            01 // Organize
          </Link>
          <Link
            href="/#convert"
            onClick={onClose}
            className="py-2 px-3 rounded-lg text-foreground hover:bg-surface-container transition-colors"
          >
            02 // Convert
          </Link>
          <Link
            href="/#optimize"
            onClick={onClose}
            className="py-2 px-3 rounded-lg text-foreground hover:bg-surface-container transition-colors"
          >
            03 // Optimize
          </Link>
          <Link
            href="/#security"
            onClick={onClose}
            className="py-2 px-3 rounded-lg text-foreground hover:bg-surface-container transition-colors"
          >
            04 // Security
          </Link>
          <Link
            href="/#ocr"
            onClick={onClose}
            className="py-2 px-3 rounded-lg text-foreground hover:bg-surface-container transition-colors"
          >
            05 // OCR
          </Link>
          <Link
            href="/#video"
            onClick={onClose}
            className="py-2 px-3 rounded-lg text-foreground hover:bg-surface-container transition-colors"
          >
            06 // Video
          </Link>
          <Link
            href="/analytics"
            onClick={onClose}
            className="py-2 px-3 rounded-lg text-foreground hover:bg-surface-container transition-colors"
          >
            07 // Analytics
          </Link>
          <Link
            href="/history"
            onClick={onClose}
            className="py-2 px-3 rounded-lg text-foreground hover:bg-surface-container transition-colors"
          >
            Processing History
          </Link>
          <Link
            href="/account"
            onClick={onClose}
            className="py-2 px-3 rounded-lg text-foreground hover:bg-surface-container transition-colors"
          >
            My Account
          </Link>
        </nav>
      </div>

      <div className="p-4 border-t border-border text-center text-xs text-muted-foreground font-mono">
        PDF Studio // Core Architecture
      </div>
    </div>
  );
}
