import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { siteConfig } from "@/config/site";
import { Toaster } from "sonner";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} // Open-Engine Document Workspace`,
    template: `%s | ${siteConfig.name}`,
  },
  description: "Deterministic, client-side PDF manipulation engine compiled to WebAssembly with zero network egress and verified air-gapped privacy.",
  keywords: [
    "PDF tools",
    "merge PDF",
    "split PDF",
    "rotate PDF",
    "compress PDF",
    "convert PDF",
    "OCR PDF",
    "password PDF",
    "Stirling-PDF",
  ],
  authors: [{ name: siteConfig.author }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${spaceMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-canvas text-ink antialiased font-mono">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <div className="flex-1 w-full overflow-x-hidden">{children}</div>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
