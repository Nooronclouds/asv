"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGetOverview, clearToken, getToken } from "@/lib/asv/api";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/findings", label: "Findings" },
  { href: "/assets", label: "Assets" },
  { href: "/scan", label: "New Scan" },
  { href: "/runs", label: "Runs" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [scope, setScope] = useState<string>("—");
  const [lastScan, setLastScan] = useState<string>("—");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Auth guard: no token -> back to sign-in.
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
    // Topbar summary from the latest run (best-effort; stays "—" if none yet).
    apiGetOverview()
      .then((o) => {
        if (o.hasData) {
          setScope(o.scope);
          setLastScan(o.lastScan);
        } else {
          setScope("no scope set");
          setLastScan("no scans yet");
        }
      })
      .catch(() => { /* topbar just stays neutral */ });
  }, [router]);

  function signOut() {
    clearToken();
    router.replace("/login");
  }

  if (!ready) return null;

  return (
    <div className="asv-app">
      <aside className="rail">
        <div className="brand">
          <div className="mark">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="#3dff87" strokeWidth="1" aria-hidden="true">
              <circle cx="15" cy="15" r="13" /><circle cx="15" cy="15" r="8" /><circle cx="15" cy="15" r="3" />
              <path d="M15 2v26M2 15h26" stroke="#28331a" /><path d="M15 15L26 6" stroke="#3dff87" strokeWidth="1.4" />
            </svg>
            <h1>ASV</h1>
          </div>
          <div className="sub">Attack Surface</div>
        </div>
        <nav className="nav">
          {NAV.map((n) => {
            const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href} className={active ? "active" : ""}>
                <span className="chev">›</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="foot">
          <button onClick={signOut} style={{ all: "unset", cursor: "pointer", color: "var(--ink-dim)", letterSpacing: ".18em" }}>
            <span className="dot">●</span> SIGN OUT
          </button>
          <br />v0.1 · EXTERNAL
        </div>
      </aside>

      <div>
        <div className="topbar">
          <div className="scope"><span className="klabel">Scope</span> <b>{scope}</b></div>
          <div className="stat-inline">
            <span className="klabel">Last scan</span>
            <span className="mono" style={{ color: "var(--ink)" }}>{lastScan}</span>
          </div>
          <div className="stat-inline"><span className="livedot" /><span className="klabel">Idle</span></div>
          <div className="spacer" />
          <Link href="/scan" className="btn">▶ Run Scan</Link>
        </div>
        <main className="screen-main">{children}</main>
      </div>
    </div>
  );
}
