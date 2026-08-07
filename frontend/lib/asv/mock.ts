import type { Asset, Finding, Overview, Run } from "./types";

// Placeholder data so the UI runs before the backend is wired.
// Swap these for live calls in lib/asv/data.ts once the API is reachable.

export const SCOPE = "northwind-labs.com";

export const overview: Overview = {
  scope: SCOPE,
  lastScan: "08 AUG 2026 · 14:22",
  counts: { critical: 1, high: 3, medium: 5, low: 6, info: 9 },
  totalFindings: 24,
  delta: { added: 4, removed: 1, persisting: 18 },
  hostsLive: 12,
  services: 31,
};

export const findings: Finding[] = [
  {
    asset: "admin.northwind-labs.com", port: 80, scheme: "http",
    title: "Administrative interface exposed to the internet",
    severity: "critical", isNew: true, first_seen: "this scan",
    rationale:
      "An admin/console surface is reachable from the public internet over plaintext HTTP. These are prime targets for credential-stuffing and default-password attacks, and credentials submitted here can be intercepted in transit. Put it behind a VPN or IP allow-list, and force HTTPS.",
    evidence: { URL: "http://admin.northwind-labs.com:80/", STATUS: 200, IP: "45.79.11.24", SOURCE: "brute-force" },
  },
  {
    asset: "portal.northwind-labs.com", port: 80, scheme: "http",
    title: "Login form served over plaintext HTTP",
    severity: "high", isNew: true, first_seen: "this scan",
    rationale:
      "A sign-in surface is served without TLS, so submitted credentials travel in cleartext and can be captured on any intermediate network.",
    evidence: { URL: "http://portal.northwind-labs.com:80/", STATUS: 200 },
  },
  {
    asset: "jenkins.northwind-labs.com", port: 443, scheme: "https",
    title: "Administrative interface exposed to the internet",
    severity: "high", first_seen: "02 AUG",
    rationale:
      "A CI/console surface is reachable from the public internet. Served over HTTPS, but still exposed — restrict it to a VPN or allow-list.",
    evidence: { URL: "https://jenkins.northwind-labs.com/", STATUS: 403 },
  },
  {
    asset: "legacy.northwind-labs.com", port: 443, scheme: "https",
    title: "Expired TLS certificate",
    severity: "medium", isNew: true, first_seen: "this scan",
    rationale:
      "The certificate has expired. Beyond breaking trust for users, an expired cert usually signals an unmaintained or forgotten host — exactly the kind of drift that hides bigger problems.",
    evidence: { "NOT AFTER": "2024-11-03", ISSUER: "Let's Encrypt" },
  },
  {
    asset: "files.northwind-labs.com", port: 443, scheme: "https",
    title: "Directory listing / public index exposed",
    severity: "medium", first_seen: "21 JUL",
    rationale:
      "The server returns a browsable file index. Directory listings leak file names and structure and frequently expose backups or configs.",
    evidence: { URL: "https://files.northwind-labs.com/" },
  },
  {
    asset: "vpn.northwind-labs.com", port: 8443, scheme: "https",
    title: "Self-signed TLS certificate",
    severity: "low", first_seen: "21 JUL",
    rationale:
      "The certificate is self-signed, so clients cannot verify the host's identity. Common on test/staging boxes never meant to be public — confirm this host is supposed to exist.",
    evidence: { ISSUER: "self" },
  },
  {
    asset: "staging.northwind-labs.com", port: 443, scheme: "https",
    title: "Previously-unlisted live host discovered",
    severity: "info", first_seen: "21 JUL",
    rationale:
      "Found via discovery rather than your seed list. Confirm it's a known, intended asset — forgotten hosts are the most common source of surprise exposure.",
    evidence: { SOURCE: "ct/bruteforce", IP: "45.79.11.88" },
  },
];

export const assets: Asset[] = [
  { value: "northwind-labs.com", resolved_ip: "45.79.11.10", source: "seed", ports: [80, 443], first_seen: "12 JUN" },
  { value: "admin.northwind-labs.com", resolved_ip: "45.79.11.24", source: "brute-force", ports: [80], first_seen: "this scan", isNew: true },
  { value: "portal.northwind-labs.com", resolved_ip: "45.79.11.24", source: "ct/bruteforce", ports: [80, 443], first_seen: "this scan", isNew: true },
  { value: "jenkins.northwind-labs.com", resolved_ip: "45.79.11.31", source: "ct/bruteforce", ports: [443], first_seen: "02 AUG" },
  { value: "legacy.northwind-labs.com", resolved_ip: "45.79.11.52", source: "ct/bruteforce", ports: [443, 8443], first_seen: "21 JUL" },
  { value: "files.northwind-labs.com", resolved_ip: "45.79.11.60", source: "brute-force", ports: [443], first_seen: "21 JUL" },
  { value: "vpn.northwind-labs.com", resolved_ip: "45.79.11.77", source: "ct/bruteforce", ports: [8443], first_seen: "21 JUL" },
  { value: "staging.northwind-labs.com", resolved_ip: "45.79.11.88", source: "ct/bruteforce", ports: [443], first_seen: "21 JUL" },
];

export const runs: Run[] = [
  { id: 6, started_at: "08 AUG 2026 · 14:22", status: "done", duration_s: 41, delta: { added: 4, removed: 1, persisting: 18 }, counts: { assets: 12, findings: 24 } },
  { id: 5, started_at: "02 AUG 2026 · 09:10", status: "done", duration_s: 38, delta: { added: 1, removed: 2, persisting: 20 }, counts: { assets: 11, findings: 21 } },
  { id: 4, started_at: "26 JUL 2026 · 09:08", status: "failed", delta: { added: 0, removed: 0, persisting: 0 }, counts: { assets: 0, findings: 0 } },
  { id: 3, started_at: "21 JUL 2026 · 09:05", status: "done", duration_s: 33, delta: { added: 7, removed: 0, persisting: 15 }, counts: { assets: 12, findings: 22 } },
];
