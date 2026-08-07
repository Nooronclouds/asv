import { getRuns } from "@/lib/asv/data";

export default async function RunsPage() {
  const runs = await getRuns();
  return (
    <>
      <div className="eyebrow">History · change over time</div>
      <h2 className="screen">Scan Runs</h2>
      <p className="screen-sub">
        Each scan is a snapshot. The delta between snapshots is what tells you your surface moved.
      </p>

      <div className="timeline">
        {runs.map((r, i) => (
          <div className={`run ${i === 0 ? "latest" : ""}`} key={r.id}>
            <div className="card">
              <div className="top">
                <span className="when"><b>{r.started_at}</b> — run #{String(r.id).padStart(2, "0")}</span>
                {r.status === "failed" ? (
                  <span className="status fail">✕ Failed · timeout</span>
                ) : (
                  <span className="status">✓ Done · {r.duration_s}s</span>
                )}
              </div>
              {r.status === "failed" ? (
                <div className="mini"><div>Partial<b style={{ color: "var(--ink-dim)", fontSize: 12, letterSpacing: ".08em" }}>discovery only</b></div></div>
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
    </>
  );
}
