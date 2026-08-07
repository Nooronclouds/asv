"use client";

import * as React from "react";
import { WaveBackground } from "@/components/wave-background";
import { Logo, Button, Input, LoadingSpinner } from "@/components/cyber";
import { Check } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [countdown, setCountdown] = React.useState(60);
  const [canResend, setCanResend] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    await new Promise((res) => setTimeout(res, 1200));
    setLoading(false);
    setSent(true);
    setCountdown(60);
    setCanResend(false);
  };

  const handleResend = async () => {
    setCanResend(false);
    setCountdown(60);
    // Simulate resend
    await new Promise((res) => setTimeout(res, 500));
  };

  React.useEffect(() => {
    if (!sent || canResend) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sent, canResend]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <WaveBackground intensity="low" />

      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center">
        <Logo size="lg" href="/" className="mb-8" />

        <div className="w-full rounded-[20px] border border-border bg-bg-card p-9 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,255,65,0.04)_inset]">
          {sent ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-dim">
                <Check className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-lg font-semibold text-primary">
                Check your inbox
              </h2>
              <p className="mt-2 text-[13px] text-text-muted">
                Sent to: {email}
              </p>

              <div className="mt-6 text-[13px] text-text-muted">
                <p>Didn&apos;t get it?</p>
                {canResend ? (
                  <button
                    onClick={handleResend}
                    className="mt-1 text-primary transition-colors hover:text-primary-hover"
                  >
                    Resend →
                  </button>
                ) : (
                  <p className="mt-1">Resend in {formatTime(countdown)}</p>
                )}
              </div>

              <Link
                href="/login"
                className="mt-6 text-[13px] text-primary transition-colors hover:text-primary-hover"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-[22px] font-bold text-text-primary">
                Reset your password
              </h1>
              <p className="mt-1 text-[13px] text-text-muted">
                We&apos;ll send a reset link to your email address.
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-muted">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  loadingText="Sending..."
                >
                  Send Reset Link
                </Button>

                <Link
                  href="/login"
                  className="block text-[13px] text-primary transition-colors hover:text-primary-hover"
                >
                  ← Back to sign in
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
