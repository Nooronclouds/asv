"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiStartScan } from "@/lib/asv/api";

const STAGES = ["Discovery", "Probe", "Fingerprint", "Scoring"];

function splitList(s: string): string[] {
  return s.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
}

export default function ScanPage() {
  const router = useRouter();
  const [seeds, setSeeds] = useState("");
  const [domains, setDomains] = useState("");
  const [ranges, setRanges] = useState("");
  const [active, setActive] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  // Backend scans are synchronous (no progress stream), so the stage bar is an
  // in-flight indicator: it walks forward while the single request is pending.
  function startProgress() {
    setStage(0);
    let i = 0;
    timer.current = setInterval(() => {
      i = Math.min(i + 1, STAGES.length - 1);
      setStage(i);
    }, 1600);
  }
  function stopProgress() {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  }

  async function start() {
    setError(null);
    const seedList = splitList(seeds);
    const domainList = domains.trim() ? splitList(domains) : seedList;
    if (seedList.length === 0) { setError("Enter at least one seed domain."); return; }
    if (!authorized) { setError("Confirm you are authorized to scan this scope."); return; }

    setScanning(true);
    startProgress();
    try {
      await apiStartScan({
        seeds: seedList,
        authorized_domains: domainList,
        authorized_ip_ranges: splitList(ranges),
        active,
      });
      stopProgress();
      setStage(STAGES.length); // all done
      setTimeout(() => router.push("/findings"), 500);
    } catch (e) {
      stopProgress();
      setScanning(false);
      setError(e instanceof Error ? e.message : "Scan failed.");
    }
  }

  return (
    <>
      <div className="eyebrow">New scan · define the target</div>
      <h2 className="screen">Run A Scan</h2>
      <p className="screen-sub">
        Give the engine seed domains and the scope it&apos;s allowed to touch. It expands, probes, and ranks —
        from the outside only.
      </p>

      <div className="scan-grid">
        <div className="panel ticked">
          <div className="hd"><h3>Target Definition</h3></div>
          <div className="bd">
            {error && <div className="err" style={{ marginBottom: 14 }}>» {error}</div>}
            <div className="field">
              <label className="f">Seed domains</label>
              <textarea className="inp" spellCheck={false} value={seeds} disabled={scanning}
                onChange={(e) => setSeeds(e.target.value)} placeholder="example.com" />
              <div className="hint">Root domains to expand from. One per line, or comma-separated.</div>
            </div>
            <div className="field">
              <label className="f">Authorized scope — domains</label>
              <input className="inp" spellCheck={false} value={domains} disabled={scanning}
                onChange={(e) => setDomains(e.target.value)} placeholder="defaults to your seeds" />
              <div className="hint">Nothing outside this is ever contacted.</div>
            </div>
            <div className="field">
              <label className="f">Authorized scope — IP ranges <span style={{ color: "var(--ink-faint)" }}>(optional)</span></label>
              <input className="inp" spellCheck={false} value={ranges} disabled={scanning}
                onChange={(e) => setRanges(e.target.value)} placeholder="e.g. 45.79.11.0/24" />
            </div>

            <div className={`toggle ${active ? "on" : ""}`} onClick={() => !scanning && setActive((v) => !v)}>
              <div className="sw" />
              <div className="t">Active discovery<small>Brute-force common subdomains (sends traffic). Auto-off on wildcard DNS.</small></div>
            </div>

            <div className="authbox" onClick={() => !scanning && setAuthorized((v) => !v)} style={{ marginTop: 18 }}>
              <div className={`cb ${authorized ? "on" : ""}`} />
              <p>I confirm I own or am authorized to scan every domain and range in this scope.</p>
            </div>

            <button className="btn" onClick={start} disabled={scanning}
              style={{ width: "100%", justifyContent: "center", fontSize: 12, padding: 13 }}>
              {scanning ? "Scanning…" : "▶ Start Scan"}
            </button>
          </div>
        </div>

        <div>
          {scanning ? (
            <div className="scanning">
              <h3>Scanning<span className="caret" /></h3>
              <p style={{ color: "var(--ink-dim)", fontSize: 11, margin: "0 0 14px" }}>
                Synchronous run — hold tight, this takes a few seconds to a minute.
              </p>
              {STAGES.map((s, i) => {
                const cls = i < stage ? "done" : i === stage ? "run" : "";
                const st = i < stage ? "Done" : i === stage ? "Running" : "Queued";
                return (
                  <div className={`stage ${cls}`} key={s}>
                    <span className="ix">{String(i + 1).padStart(2, "0")}</span>
                    <span className="nm">{s}</span>
                    <span className="st">{st}</span>
                    <span className="track"><i /></span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="panel ticked">
              <div className="hd"><h3>What Happens</h3><span className="tag">PIPELINE</span></div>
              <div className="bd" style={{ color: "var(--ink-dim)", fontSize: 11.5, lineHeight: 1.9 }}>
                {[
                  ["Discover", "expand seeds via Certificate Transparency + optional brute-force."],
                  ["Probe", "confirm live HTTP(S) services, capture TLS certs."],
                  ["Fingerprint", "flag login/admin surfaces, cert health."],
                  ["Score", "rank findings worst-first, diff vs last run."],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <span style={{ color: "var(--green)" }}>»</span>
                    <span><b style={{ color: "var(--ink)" }}>{k}</b> — {v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
