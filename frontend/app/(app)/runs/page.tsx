"use client";

import { EmptyState, ErrorState, Loading } from "@/components/asv/States";
import { apiGetRuns } from "@/lib/asv/api";
import { useResource } from "@/lib/asv/useResource";

export default function RunsPage() {
  const { data, loading, error } = useResource(apiGetRuns);

  return (
    <>
      <div className="eyebrow">History · change over time</div>
      <h2 className="screen">Scan Runs</h2>
      <p className="screen-sub">
        Each scan is a snapshot. The delta between snapshots is what tells you your surface moved.
      </p>

      {loading && <Loading label="LOADING RUNS" />}
      {error && <ErrorState msg={error} />}
      {!loading && !error && data && data.length === 0 && (
        <EmptyState title="NO RUNS" hint="No scans have been run yet." ctaHref="/scan" ctaLabel="Run a scan" />
      )}
      {!loading && !error && data && data.length > 0 && (
        <div className="timeline">
          {data.map((r, i) => (
            <div className={`run ${i === 0 ? "latest" : ""}`} key={r.id}>
              <div className="card">
                <div className="top">
                  <span className="when"><b>{r.started_at}</b> — run #{String(r.id).padStart(2, "0")}</span>
                  {r.status === "failed" ? (
                    <span className="status fail">✕ Failed</span>
                  ) : r.status === "running" ? (
                    <span className="status" style={{ color: "var(--med)" }}>● Running</span>
                  ) : (
                    <span className="status">✓ Done{r.duration_s != null ? ` · ${r.duration_s}s` : ""}</span>
                  )}
                </div>
                {r.status === "failed" ? (
                  <div className="mini"><div>Partial<b style={{ color: "var(--ink-dim)", fontSize: 12, letterSpacing: ".08em" }}>see logs</b></div></div>
                ) : (
                  <div className="mini">
                    <div className="add">New<b>+{r.delta.added}</b></div>
                    <div className="rem">Resolved<b>−{r.delta.removed}</b></div>
                    <div className="tot">Findings<b>{r.counts.findings}</b></div>
                    <div>Assets<b>{r.counts.assets}</b></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
