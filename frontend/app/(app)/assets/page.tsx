import { getAssets } from "@/lib/asv/data";

export default async function AssetsPage() {
  const assets = await getAssets();
  const sourceLabel = (s: string) =>
    s === "seed" ? "Seed" : s.includes("brute") && !s.includes("ct") ? "Brute-force" : s.includes("ct") ? "CT log" : s;

  return (
    <>
      <div className="eyebrow">Inventory · the discovered surface</div>
      <h2 className="screen">Assets</h2>
      <p className="screen-sub">
        Everything reachable under your scope. A <b>discovered</b> host you don&apos;t recognize is the signal to investigate.
      </p>

      <div className="tablewrap">
        <table className="asv">
          <thead>
            <tr>
              <th>Host</th>
              <th style={{ width: 120 }}>IP</th>
              <th style={{ width: 110 }}>Source</th>
              <th style={{ width: 120 }}>Services</th>
              <th style={{ width: 96 }}>First seen</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.value}>
                <td className="host mono">{a.value}{a.isNew && <span className="newtag">New</span>}</td>
                <td className="mono">{a.resolved_ip}</td>
                <td><span className={`srcchip ${a.source === "seed" ? "seed" : ""}`}>{sourceLabel(a.source)}</span></td>
                <td className="mono">{a.ports.join(" · ")}</td>
                <td className="mono" style={{ color: a.first_seen === "this scan" ? "var(--green)" : "var(--ink-dim)" }}>{a.first_seen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
