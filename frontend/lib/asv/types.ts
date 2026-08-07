// Shapes mirror the FastAPI responses in backend/app/attack_surface.

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Finding {
  asset: string;        // asset_value
  port?: number;
  scheme?: string;
  title: string;
  severity: Severity;
  rationale: string;
  evidence: Record<string, string | number>;
  first_seen: string;   // ISO; "this scan" when === latest run
  isNew?: boolean;
}

export interface Asset {
  value: string;        // hostname
  resolved_ip: string;
  source: string;       // "seed" | "ct/bruteforce" | ...
  ports: number[];
  first_seen: string;
  isNew?: boolean;
}

export interface Run {
  id: number;
  started_at: string;
  status: "done" | "failed" | "running";
  duration_s?: number;
  delta: { added: number; removed: number; persisting: number };
  counts: { assets: number; findings: number };
}

export interface Overview {
  scope: string;
  lastScan: string;
  counts: Record<Severity, number>;
  totalFindings: number;
  delta: { added: number; removed: number; persisting: number };
  hostsLive: number;
  services: number;
}

export const SEV_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];
export const sevClass: Record<Severity, string> = {
  critical: "crit", high: "high", medium: "med", low: "low", info: "info",
};
