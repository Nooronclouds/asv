"use client";

import { WaveBackground } from "@/components/wave-background";
import { Logo, Button } from "@/components/cyber";
import { Link2, Shield, CreditCard, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-screen">
      <WaveBackground intensity="low" />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-10 sm:py-6">
        <Logo size="md" href="/" />
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center px-4 pt-8 text-center sm:px-6 sm:pt-16">
        <div className="max-w-[640px]">
          <h1 className="font-display text-2xl font-bold leading-tight text-text-primary sm:text-4xl md:text-5xl">
            Your business is a target.
          </h1>
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-text-secondary sm:text-4xl md:text-5xl">
            Most don&apos;t find out until it&apos;s too late.
          </h2>
          <p className="mx-auto mt-4 max-w-[480px] text-sm text-text-secondary sm:mt-6 sm:text-base">
            CyberGuard checks your links, files, and UPI payments and tells you exactly what to do — in plain language.
          </p>

          <Link href="/register" className="mt-6 inline-block sm:mt-8">
            <Button size="lg" className="min-w-[180px] px-6 sm:min-w-[200px] sm:px-10">
              Get Started — It&apos;s Free
            </Button>
          </Link>
        </div>

        {/* Divider */}
        <div className="mt-12 w-full max-w-4xl border-t border-border sm:mt-20" />

        {/* Features */}
        <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-6 px-4 sm:mt-16 sm:gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <Link2 className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            <h3 className="mt-3 font-display text-sm font-semibold text-text-primary sm:mt-4">
              Phishing
            </h3>
            <p className="mt-1.5 text-xs text-text-muted sm:mt-2 sm:text-[13px]">
              Check links before you click
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <Shield className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            <h3 className="mt-3 font-display text-sm font-semibold text-text-primary sm:mt-4">
              Ransomware
            </h3>
            <p className="mt-1.5 text-xs text-text-muted sm:mt-2 sm:text-[13px]">
              Scan files before you open them
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <CreditCard className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            <h3 className="mt-3 font-display text-sm font-semibold text-text-primary sm:mt-4">
              UPI Fraud
            </h3>
            <p className="mt-1.5 text-xs text-text-muted sm:mt-2 sm:text-[13px]">
              Verify payments before you pay
            </p>
          </div>
        </div>

        {/* Spacer */}
        <div className="pb-20" />
      </main>
    </div>
  );
}
