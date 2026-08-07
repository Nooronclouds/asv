"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Invalid email or password.");
      }
      const data = await res.json();
      localStorage.setItem("asv-token", data.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Check the API is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card ticked">
        <div className="cap">
          <svg width="34" height="34" viewBox="0 0 30 30" fill="none" stroke="#3dff87" strokeWidth="1" aria-hidden="true">
            <circle cx="15" cy="15" r="13" /><circle cx="15" cy="15" r="8" /><circle cx="15" cy="15" r="3" />
            <path d="M15 2v26M2 15h26" stroke="#28331a" /><path d="M15 15L26 6" stroke="#3dff87" strokeWidth="1.4" />
          </svg>
          <h1>ASV</h1>
          <div className="sub">Attack Surface · Access</div>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="err">» {error}</div>}
          <div className="field">
            <label className="f" htmlFor="email">Operator email</label>
            <input id="email" className="inp" type="email" value={email} autoComplete="username"
              onChange={(e) => setEmail(e.target.value)} required spellCheck={false} />
          </div>
          <div className="field">
            <label className="f" htmlFor="pw">Password</label>
            <input id="pw" className="inp" type="password" value={password} autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn" type="submit" disabled={loading}
            style={{ width: "100%", justifyContent: "center", fontSize: 12, padding: 13, marginTop: 4 }}>
            {loading ? "Authenticating…" : "▶ Sign In"}
          </button>
          <div style={{ marginTop: 16, fontSize: 10.5, letterSpacing: ".08em", color: "var(--ink-faint)", textTransform: "uppercase" }}>
            No account? <Link href="/register" style={{ color: "var(--green)" }}>Request access »</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
