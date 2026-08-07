// Single swap-point between the UI and its data source.
//
// Today these return placeholder data from mock.ts so the UI runs with no
// backend. To go live, replace each body with a fetch to the FastAPI API —
// the response shapes already match lib/asv/types.ts. Example:
//
//   const res = await fetch(`${API}/api/attack-surface/findings`, {
//     headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
//   });
//   return res.json();
//
// API base is read from NEXT_PUBLIC_API_URL (see .env.example).

import type { Asset, Finding, Overview, Run } from "./types";
import * as mock from "./mock";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getOverview(): Promise<Overview> {
  return mock.overview;
}

export async function getFindings(): Promise<Finding[]> {
  return mock.findings;
}

export async function getAssets(): Promise<Asset[]> {
  return mock.assets;
}

export async function getRuns(): Promise<Run[]> {
  return mock.runs;
}
