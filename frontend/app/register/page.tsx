"use client";

import * as React from "react";
import { WaveBackground } from "@/components/wave-background";
import { Logo, Button, Input, LoadingSpinner } from "@/components/cyber";
import { API_URL } from "@/lib/config";
import { Eye, EyeOff, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const businessTypes = [
  "Retail / Kirana Store",
  "Restaurant",
  "Professional Services",
  "E-commerce",
  "Healthcare",
  "Manufacturing",
  "Other",
];

interface PasswordCheck {
  label: string;
  test: (pw: string) => boolean;
}

const passwordChecks: PasswordCheck[] = [
  { label: "8+ chars", test: (pw) => pw.length >= 8 },
  { label: "Number", test: (pw) => /\d/.test(pw) },
  { label: "Special", test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = React.useState({
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessType: "",
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.businessName || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!passwordChecks.every((c) => c.test(form.password))) {
      setError("Password doesn't meet requirements.");
      return;
    }

    setLoading(true);

    try {
      const backendUrl = API_URL;
      const registerRes = await fetch(`${backendUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json();
        throw new Error(data.detail || "Registration failed.");
      }

      const loginRes = await fetch(`${backendUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (!loginRes.ok) {
        throw new Error("Registration succeeded but automatic login failed. Please sign in manually.");
      }

      const loginData = await loginRes.json();
      localStorage.setItem("cyberguard-token", loginData.access_token);
      localStorage.setItem(
        "cyberguard-user",
        JSON.stringify({
          name: form.businessName,
          email: form.email,
          businessName: form.businessName,
          businessType: form.businessType || "Other",
          memberSince: new Date().toISOString(),
        })
      );

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
      <WaveBackground intensity="low" />

      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center">
        {/* Logo */}
        <Logo size="lg" href="/" className="mb-8" />

        {/* Card */}
        <div className="w-full rounded-[20px] border border-border border-t-[2px] border-t-primary bg-bg-card p-9 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,255,65,0.04)_inset]">
          {success ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-dim">
                <Check className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-lg font-semibold text-primary">
                Account created.
              </h2>
              <p className="mt-2 text-[13px] text-text-muted">
                Heading to your dashboard...
              </p>
              <LoadingSpinner className="mt-4" />
            </div>
          ) : (
            <>
              <h1 className="font-display text-[22px] font-bold text-text-primary">
                Create your account
              </h1>
              <p className="mt-1 text-[13px] text-text-muted">
                Protect your business starting today
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                {/* Business Name */}
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-muted">
                    Business Name
                  </label>
                  <Input
                    placeholder="Your Business Name"
                    value={form.businessName}
                    onChange={(e) => update("businessName", e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-muted">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@business.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
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
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    disabled={loading}
                  />
                  {/* Password hints */}
                  {(passwordFocused || form.password.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {passwordChecks.map((check) => {
                        const met = check.test(form.password);
                        return (
                          <span
                            key={check.label}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-all ${
                              met
                                ? "border-primary bg-primary-dim text-primary"
                                : "border-border bg-bg-input text-text-muted"
                            }`}
                          >
                            {met && <Check className="h-3 w-3" />}
                            {check.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-text-muted">
                    Confirm Password
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
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Business Type */}
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-muted">
                    Business Type
                  </label>
                  <select
                    value={form.businessType}
                    onChange={(e) => update("businessType", e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-border-strong bg-bg-input px-[18px] py-[14px] text-[15px] text-text-primary transition-all duration-150 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary-dim appearance-none"
                  >
                    <option value="" className="bg-bg-card text-text-muted">
                      Select type
                    </option>
                    {businessTypes.map((type) => (
                      <option
                        key={type}
                        value={type}
                        className="bg-bg-card text-text-primary"
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-text-muted">
                    We use this for better security advice tailored to your business
                  </p>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  loadingText="Creating account..."
                >
                  Create Account
                </Button>

                {/* Error */}
                {error && (
                  <p className="text-center text-[13px] text-risk-critical">
                    {error}
                  </p>
                )}

                {/* Link */}
                <p className="pt-1 text-center text-[13px] text-text-muted">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-primary transition-colors hover:text-primary-hover"
                  >
                    Sign in →
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>

        {/* Tagline */}
        <p className="mt-6 text-center text-xs italic text-text-muted">
          &quot;Check Before You Click, Open, or Pay&quot;
        </p>
      </div>
    </div>
  );
}
