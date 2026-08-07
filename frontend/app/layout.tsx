import type { Metadata, Viewport } from "next";
import { Anton, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Condensed heavy display face — the brutalist poster voice.
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
});

// Technical monospace for all data, labels, and numerals.
const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jbmono",
});

export const metadata: Metadata = {
  title: "ASV — Attack Surface Visibility",
  description:
    "Discover, rank, and track your internet-facing attack surface. External, authorized-only reconnaissance with ranked, explainable findings.",
};

export const viewport: Viewport = {
  themeColor: "#0a0c06",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${jbMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="dark" storageKey="asv-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
