// Live API client for the ASV backend. Runs in the browser and attaches the
// JWT from localStorage to every request. Maps the raw API JSON onto the UI
// types in ./types (snake_case -> camelCase, derived labels).

import type { Asset, Finding, Overview, Run, Severity } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "asv-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(`Can't reach the API at ${API}. Is the backend running?`, 0);
  }
  if (res.status === 401) throw new ApiError("Session expired — please sign in again.", 401);
  if (!res.ok) {
    const d = await res.json().catch(() => ({} as { detail?: string }));
    throw new ApiError(d.detail || `Request failed (${res.status}).`, res.status);
  }
  return res.json() as Promise<T>;
}

// ---- formatting helpers -------------------------------------------------
function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}
function seenLabel(iso: string, isNew?: boolean): string {
  if (isNew) return "this scan";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
}
function durationS(start?: string | null, end?: string | null): number | undefined {
  if (!start || !end) return undefined;
  const a = new Date(start).getTime(), b = new Date(end).getTime();
  if (isNaN(a) || isNaN(b)) return undefined;
  return Math.max(0, Math.round((b - a) / 1000));
}
function portFromEvidence(ev: Record<string, unknown>): number | undefined {
  const url = (ev.URL || ev.url) as string | undefined;
  if (typeof url === "string") {
    const m = url.match(/:(\d+)\//);
    if (m) return parseInt(m[1], 10);
  }
  return undefined;
}
function scopeLabel(seeds?: string): string {
  if (!seeds) return "—";
  return seeds.split(",")[0]?.trim() || "—";
}

// ---- auth ---------------------------------------------------------------
export async function apiLogin(email: string, password: string): Promise<void> {
  const d = await req<{ access_token: string }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(d.access_token);
}
export async function apiRegister(email: string, password: string): Promise<void> {
  await req("/register", { method: "POST", body: JSON.stringify({ email, password }) });
}

// ---- resources ----------------------------------------------------------
export interface OverviewResult extends Overview {
  hasData: boolean;
  seeds: string;
}

export async function apiGetOverview(): Promise<OverviewResult> {
  const o = await req<{
    hasData: boolean; scope: string; seeds: string; lastScan: string | null;
    counts: Record<Severity, number>; totalFindings: number;
    delta: { added: number; removed: number; persisting: number };
    hostsLive: number; services: number;
  }>("/api/attack-surface/overview");
  return {
    hasData: o.hasData,
    scope: scopeLabel(o.seeds),
    seeds: o.seeds,
    lastScan: fmtDateTime(o.lastScan),
    counts: o.counts,
    totalFindings: o.totalFindings,
    delta: o.delta,
    hostsLive: o.hostsLive,
    services: o.services,
  };
}

export async function apiGetFindings(): Promise<Finding[]> {
  const rows = await req<Array<{
    asset: string; title: string; severity: Severity; rationale: string;
    evidence: Record<string, string | number>; first_seen: string; is_new: boolean;
  }>>("/api/attack-surface/findings");
  return rows.map((r) => ({
    asset: r.asset,
    title: r.title,
    severity: r.severity,
    rationale: r.rationale,
    evidence: r.evidence || {},
    port: portFromEvidence(r.evidence || {}),
    first_seen: seenLabel(r.first_seen, r.is_new),
    isNew: !!r.is_new,
  }));
}

export async function apiGetAssets(): Promise<Asset[]> {
  const rows = await req<Array<{
    value: string; resolved_ip: string; source: string; ports: number[];
    first_seen: string; is_new: boolean;
  }>>("/api/attack-surface/assets");
  return rows.map((r) => ({
    value: r.value,
    resolved_ip: r.resolved_ip,
    source: r.source,
    ports: r.ports || [],
    first_seen: seenLabel(r.first_seen, r.is_new),
    isNew: !!r.is_new,
  }));
}

export async function apiGetRuns(): Promise<Run[]> {
  const rows = await req<Array<{
    id: number; status: Run["status"]; started_at: string; finished_at: string | null;
    delta: Run["delta"]; counts: Run["counts"];
  }>>("/api/attack-surface/runs");
  return rows.map((r) => ({
    id: r.id,
    started_at: fmtDateTime(r.started_at),
    status: r.status,
    duration_s: durationS(r.started_at, r.finished_at),
    delta: r.delta,
    counts: r.counts,
  }));
}

export interface ScanPayload {
  seeds: string[];
  authorized_domains: string[];
  authorized_ip_ranges: string[];
  active: boolean;
}
export interface ScanResult {
  run_id: number;
  counts: { assets: number; services: number; findings: number };
  delta: { added: number; removed: number; persisting: number };
}
export async function apiStartScan(payload: ScanPayload): Promise<ScanResult> {
  return req<ScanResult>("/api/attack-surface/scan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
