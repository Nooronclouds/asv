"use client";

import { useMemo, useState } from "react";
import { sevClass, type Finding, type Severity } from "@/lib/asv/types";

type Filter = "all" | "new" | Severity;

export default function FindingsView({ findings }: { findings: Finding[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const c = { all: findings.length, new: findings.filter((f) => f.isNew).length } as Record<string, number>;
    for (const f of findings) c[f.severity] = (c[f.severity] ?? 0) + 1;
    return c;
  }, [findings]);

  const rows = useMemo(() => {
    if (filter === "all") return findings;
    if (filter === "new") return findings.filter((f) => f.isNew);
    return findings.filter((f) => f.severity === filter);
  }, [findings, filter]);

  const chip = (id: Filter, label: string, style?: React.CSSProperties) => (
    <button className={`chipbtn ${filter === id ? "on" : ""}`} style={style} onClick={() => setFilter(id)}>
      {label} · {counts[id] ?? 0}
    </button>
  );

  return (
    <>
      <div className="filters">
        {chip("all", "All")}
        {chip("new", "New only")}
        {chip("critical", "Critical", { color: "var(--crit)", borderColor: filter === "critical" ? "var(--crit)" : undefined })}
        {chip("high", "High", { color: "var(--high)" })}
        {chip("medium", "Medium", { color: "var(--med)" })}
      </div>

      <div className="tablewrap">
        <table className="asv">
          <thead>
            <tr>
              <th style={{ width: 120 }}>Severity</th>
              <th>Finding</th>
              <th>Asset</th>
              <th style={{ width: 96 }}>First seen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => (
              <RowGroup key={`${f.asset}-${f.title}`} f={f} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} style={{ color: "var(--ink-faint)", padding: "22px", letterSpacing: ".1em" }}>NO FINDINGS MATCH THIS FILTER.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RowGroup({ f, open, onToggle }: { f: Finding; open: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="rowline" onClick={onToggle}>
        <td><span className={`sevchip ${sevClass[f.severity]}`}>{f.severity}</span></td>
        <td>{f.title}{f.isNew && <span className="newtag">New</span>}</td>
        <td className="host mono">{f.asset}{f.port && <span className="port">:{f.port}</span>}</td>
        <td className="mono" style={{ color: f.first_seen === "this scan" ? "var(--green)" : "var(--ink-dim)" }}>{f.first_seen}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={4} className="rationale-cell">
            <div className="why">{f.rationale}</div>
            <div className="ev">
              {Object.entries(f.evidence).map(([k, v]) => (
                <span key={k}>{k} <b>{String(v)}</b></span>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
