"use client";

import * as React from "react";
import { WaveBackground } from "@/components/wave-background";
import { Logo, Button, Input, LoadingSpinner } from "@/components/cyber";
import { Eye, EyeOff, Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PageState = "form" | "success" | "expired";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = React.useState<PageState>("form");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    await new Promise((res) => setTimeout(res, 1200));
    setLoading(false);
    setState("success");

    setTimeout(() => {
      router.push("/login");
    }, 2000);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <WaveBackground intensity="low" />

      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center">
        <Logo size="lg" href="/" className="mb-8" />

        <div className="w-full rounded-[20px] border border-border bg-bg-card p-9 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,255,65,0.04)_inset]">
          {state === "success" ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-dim">
                <Check className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-lg font-semibold text-primary">
                Password updated.
              </h2>
              <p className="mt-2 text-[13px] text-text-muted">
                Redirecting to sign in...
              </p>
              <LoadingSpinner className="mt-4" />
            </div>
          ) : state === "expired" ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-risk-critical-dim">
                <X className="h-7 w-7 text-risk-critical" />
              </div>
              <h2 className="font-display text-lg font-semibold text-risk-critical">
                This link has expired.
              </h2>
              <p className="mt-2 text-[13px] text-text-muted">
                Links are only valid for 30 mins.
              </p>
              <Link href="/forgot-password" className="mt-6 w-full">
                <Button fullWidth>Request a new link</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-[22px] font-bold text-text-primary">
                Set a new password
              </h1>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-text-muted">
                    New Password
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-text-muted transition-colors hover:text-text-primary"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-text-muted">
                    Confirm New Password
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="text-text-muted transition-colors hover:text-text-primary"
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </label>
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  loadingText="Updating..."
                >
                  Set New Password
                </Button>

                {error && (
                  <p className="text-center text-[13px] text-risk-critical">
                    {error}
                  </p>
                )}

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
