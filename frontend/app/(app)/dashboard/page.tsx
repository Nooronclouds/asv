"use client";

import { EmptyState, ErrorState, Loading } from "@/components/asv/States";
import { apiGetOverview } from "@/lib/asv/api";
import { useResource } from "@/lib/asv/useResource";
import { SEV_ORDER, sevClass, type Severity } from "@/lib/asv/types";

const SEV_LABEL: Record<Severity, string> = {
  critical: "Critical", high: "High", medium: "Medium", low: "Low", info: "Info",
};

export default function OverviewPage() {
  const { data: o, loading, error } = useResource(apiGetOverview);

  return (
    <>
      <div className="eyebrow">Posture · external exposure</div>
      <h2 className="screen">Command Overview</h2>
      <p className="screen-sub">
        Current internet-visible exposure, worst-first. Baseline is calm green; real risk breaks to amber and red.
      </p>

      {loading && <Loading label="READING POSTURE" />}
      {error && <ErrorState msg={error} />}
      {!loading && !error && o && !o.hasData && (
        <EmptyState
          title="NO SCANS YET"
          hint="Your attack surface hasn't been mapped. Define a scope and run the first scan to populate this dashboard."
          ctaHref="/scan"
          ctaLabel="Run your first scan"
        />
      )}

      {!loading && !error && o && o.hasData && (
        <>
          <div className="grid-sev">
            {SEV_ORDER.map((s) => (
              <div key={s} className={`sev ${sevClass[s]}`}>
                <span className="bar" />
                <div className="n">{o.counts[s] ?? 0}</div>
                <div className="lbl"><span className="swatch" />{SEV_LABEL[s]}</div>
              </div>
            ))}
          </div>

          <div className="delta">
            <div><span className="v up">+{o.delta.added}</span><span className="k">New this scan</span></div>
            <div><span className="v down">−{o.delta.removed}</span><span className="k">Resolved</span></div>
            <div><span className="v flat">{o.delta.persisting}</span><span className="k">Persisting</span></div>
            <div><span className="v flat">{o.totalFindings}</span><span className="k">Total findings</span></div>
          </div>

          <div className="ov-grid">
            <div className="panel ticked">
              <div className="hd"><h3>Severity Distribution</h3><span className="tag">n={o.totalFindings}</span></div>
              <div className="bd distro">
                {SEV_ORDER.map((s) => {
                  const max = Math.max(...SEV_ORDER.map((x) => o.counts[x] ?? 0), 1);
                  return (
                    <div className="row" key={s}>
                      <span>{SEV_LABEL[s]}</span>
                      <span className="track">
                        <i className="fill" style={{ width: `${((o.counts[s] ?? 0) / max) * 100}%`, background: `var(--${sevClass[s] === "info" ? "green-dim" : sevClass[s]})` }} />
                      </span>
                      <span className="num">{o.counts[s] ?? 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="panel ticked">
              <div className="hd"><h3>Scan Scope</h3><span className="tag">AUTHORIZED</span></div>
              <div className="bd">
                <div className="radar-wrap">
                  <svg width="150" height="150" viewBox="0 0 200 200" fill="none" stroke="#28331a" strokeWidth="1" aria-hidden="true">
                    <circle cx="100" cy="100" r="88" /><circle cx="100" cy="100" r="62" /><circle cx="100" cy="100" r="34" />
                    <path d="M100 12v176M12 100h176" />
                    <g className="sweep">
                      <path d="M100 100 L100 12 A88 88 0 0 1 172 60 Z" fill="#3dff8712" stroke="none" />
                      <line x1="100" y1="100" x2="100" y2="12" stroke="#3dff87" strokeWidth="1.4" />
                    </g>
                  </svg>
                </div>
                <div className="kv">
                  <div className="r"><span className="k">Seed</span><span className="val"><b>{o.scope}</b></span></div>
                  <div className="r"><span className="k">Hosts live</span><span className="val">{o.hostsLive}</span></div>
                  <div className="r"><span className="k">Services</span><span className="val">{o.services}</span></div>
                  <div className="r"><span className="k">Last scan</span><span className="val">{o.lastScan}</span></div>
                  <div className="r"><span className="k">Mode</span><span className="val" style={{ color: "var(--green)" }}>EXTERNAL · PASSIVE+</span></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
