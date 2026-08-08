"use client";

import { EmptyState, ErrorState, Loading } from "@/components/asv/States";
import { apiGetAssets } from "@/lib/asv/api";
import { useResource } from "@/lib/asv/useResource";

function sourceLabel(s: string) {
  if (s === "seed") return "Seed";
  if (s.includes("ct")) return "CT log";
  if (s.includes("brute")) return "Brute-force";
  return s;
}

export default function AssetsPage() {
  const { data, loading, error } = useResource(apiGetAssets);

  return (
    <>
      <div className="eyebrow">Inventory · the discovered surface</div>
      <h2 className="screen">Assets</h2>
      <p className="screen-sub">
        Everything reachable under your scope. A <b>discovered</b> host you don&apos;t recognize is the signal to investigate.
      </p>

      {loading && <Loading label="LOADING ASSETS" />}
      {error && <ErrorState msg={error} />}
      {!loading && !error && data && data.length === 0 && (
        <EmptyState title="NO ASSETS" hint="No hosts have been discovered yet. Run a scan to map your surface." ctaHref="/scan" ctaLabel="Run a scan" />
      )}
      {!loading && !error && data && data.length > 0 && (
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
              {data.map((a) => (
                <tr key={a.value}>
                  <td className="host mono">{a.value}{a.isNew && <span className="newtag">New</span>}</td>
                  <td className="mono">{a.resolved_ip}</td>
                  <td><span className={`srcchip ${a.source === "seed" ? "seed" : ""}`}>{sourceLabel(a.source)}</span></td>
                  <td className="mono">{a.ports.length ? a.ports.join(" · ") : "—"}</td>
                  <td className="mono" style={{ color: a.first_seen === "this scan" ? "var(--green)" : "var(--ink-dim)" }}>{a.first_seen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
