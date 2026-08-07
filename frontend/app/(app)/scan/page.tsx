"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STAGES = ["Discovery", "Probe", "Fingerprint", "Scoring"];

export default function ScanPage() {
  const router = useRouter();
  const [active, setActive] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(0); // index of currently running stage

  function start() {
    if (!authorized) return;
    setScanning(true);
    setStage(0);
    let i = 0;
    const tick = () => {
      i += 1;
      if (i <= STAGES.length) {
        setStage(i);
        setTimeout(tick, 1300);
      } else {
        setTimeout(() => router.push("/findings"), 600);
      }
    };
    setTimeout(tick, 1300);
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
            <div className="field">
              <label className="f">Seed domains</label>
              <textarea className="inp" spellCheck={false} defaultValue="northwind-labs.com" />
              <div className="hint">Root domains to expand from. One per line.</div>
            </div>
            <div className="field">
              <label className="f">Authorized scope — domains</label>
              <input className="inp" defaultValue="northwind-labs.com" spellCheck={false} />
              <div className="hint">Nothing outside this is ever contacted.</div>
            </div>
            <div className="field">
              <label className="f">Authorized scope — IP ranges <span style={{ color: "var(--ink-faint)" }}>(optional)</span></label>
              <input className="inp" placeholder="e.g. 45.79.11.0/24" spellCheck={false} />
            </div>

            <div className={`toggle ${active ? "on" : ""}`} onClick={() => setActive((v) => !v)}>
              <div className="sw" />
              <div className="t">Active discovery<small>Brute-force common subdomains (sends traffic). Auto-off on wildcard DNS.</small></div>
            </div>

            <div className="authbox" onClick={() => setAuthorized((v) => !v)} style={{ marginTop: 18 }}>
              <div className={`cb ${authorized ? "on" : ""}`} />
              <p>I confirm I own or am authorized to scan every domain and range in this scope.</p>
            </div>

            <button className="btn" onClick={start} disabled={!authorized || scanning} style={{ width: "100%", justifyContent: "center", fontSize: 12, padding: 13 }}>
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
                const st = i < stage ? (i === 0 ? "18 hosts" : "Done") : i === stage ? "Running" : "Queued";
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
