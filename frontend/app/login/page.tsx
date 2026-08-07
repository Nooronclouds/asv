"use client";

import * as React from "react";
import { WaveBackground } from "@/components/wave-background";
import { Logo, Button, Input } from "@/components/cyber";
import { API_URL } from "@/lib/config";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const backendUrl = API_URL;
      const res = await fetch(`${backendUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Invalid email or password.");
      }

      const data = await res.json();
      localStorage.setItem("cyberguard-token", data.access_token);
      localStorage.setItem(
        "cyberguard-user",
        JSON.stringify({
          name: email.split("@")[0].replace(/[._]/g, " "),
          email,
          businessName: "My Business",
          businessType: "Retail / Kirana Store",
          memberSince: new Date().toISOString(),
        })
      );
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <WaveBackground intensity="low" />

      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center">
        {/* Logo */}
        <Logo size="lg" href="/" className="mb-8" />

        {/* Card */}
        <div className="w-full rounded-[20px] border border-border bg-bg-card p-9 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,255,65,0.04)_inset]">
          <h1 className="font-display text-[22px] font-bold text-text-primary">
            Welcome back
          </h1>
          <p className="mt-1 text-[13px] text-text-muted">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-text-muted">
                Password
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

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              loading={loading}
              loadingText="Signing in..."
            >
              Sign In
            </Button>

            {/* Error */}
            {error && (
              <p className="text-center text-[13px] text-risk-critical">
                {error}
              </p>
            )}

            {/* Links */}
            <div className="flex items-center justify-between pt-1 text-[13px]">
              <Link
                href="/forgot-password"
                className="text-primary transition-colors hover:text-primary-hover"
              >
                Forgot password?
              </Link>
              <Link
                href="/register"
                className="text-primary transition-colors hover:text-primary-hover"
              >
                Sign up →
              </Link>
            </div>
          </form>
        </div>

        {/* Tagline */}
        <p className="mt-6 text-center text-xs italic text-text-muted">
          &quot;Check Before You Click, Open, or Pay&quot;
        </p>
      </div>
    </div>
  );
}
