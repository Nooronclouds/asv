import { getOverview } from "@/lib/asv/data";
import { SEV_ORDER, sevClass, type Severity } from "@/lib/asv/types";

const SEV_LABEL: Record<Severity, string> = {
  critical: "Critical", high: "High", medium: "Medium", low: "Low", info: "Info",
};

export default async function OverviewPage() {
  const o = await getOverview();
  const max = Math.max(...Object.values(o.counts), 1);

  return (
    <>
      <div className="eyebrow">Posture · external exposure</div>
      <h2 className="screen">Command Overview</h2>
      <p className="screen-sub">
        Current internet-visible exposure for <b>{o.scope}</b>, worst-first. Baseline is calm green;
        real risk breaks to amber and red.
      </p>

      <div className="grid-sev">
        {SEV_ORDER.map((s) => (
          <div key={s} className={`sev ${sevClass[s]}`}>
            <span className="bar" />
            <div className="n">{o.counts[s]}</div>
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
            {SEV_ORDER.map((s) => (
              <div className="row" key={s}>
                <span>{SEV_LABEL[s]}</span>
                <span className="track">
                  <i className="fill" style={{ width: `${(o.counts[s] / max) * 100}%`, background: `var(--${sevClass[s] === "info" ? "green-dim" : sevClass[s]})` }} />
                </span>
                <span className="num">{o.counts[s]}</span>
              </div>
            ))}
            <div className="divider" style={{ margin: "14px 0 4px" }}><span>Exposure trend · 6 scans</span></div>
            <svg viewBox="0 0 300 60" width="100%" height="56" preserveAspectRatio="none" fill="none">
              <path d="M0,44 L60,40 L120,46 L180,30 L240,34 L300,18" stroke="#3dff87" strokeWidth="1.5" />
              <path d="M0,44 L60,40 L120,46 L180,30 L240,34 L300,18 L300,60 L0,60 Z" fill="#3dff8714" />
              <circle cx="300" cy="18" r="3" fill="#3dff87" />
            </svg>
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
                <circle cx="138" cy="70" r="2.4" fill="#ff3b30" /><circle cx="74" cy="132" r="2.4" fill="#ffc21a" />
                <circle cx="120" cy="128" r="2.4" fill="#3dff87" /><circle cx="66" cy="78" r="2.4" fill="#3dff87" />
              </svg>
            </div>
            <div className="kv">
              <div className="r"><span className="k">Seed</span><span className="val"><b>{o.scope}</b></span></div>
              <div className="r"><span className="k">Hosts live</span><span className="val">{o.hostsLive}</span></div>
              <div className="r"><span className="k">Services</span><span className="val">{o.services}</span></div>
              <div className="r"><span className="k">Discovery</span><span className="val">CT + brute-force</span></div>
              <div className="r"><span className="k">Mode</span><span className="val" style={{ color: "var(--green)" }}>EXTERNAL · PASSIVE+</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="foot-note">
        Placeholder data shaped to the live API (<b>GET /api/attack-surface/findings</b> · <b>/runs</b>).
        Green = structure &amp; baseline · Amber/Red = medium/high/critical severity only.
      </div>
    </>
  );
}
