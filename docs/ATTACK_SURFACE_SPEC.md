# Attack Surface Visibility — One-Page Spec

**Module:** Attack Surface Discovery, built on top of the Vanguard SME Security Suite.
**Audience:** Startups / SMBs who can't afford enterprise ASM tooling.
**Author:** Noor Laiba Maheen · **Status:** Draft v1

---

## What it does

Given a single seed (a root domain, e.g. `acme.com`), the tool **discovers the assets an
organization has exposed to the public internet, scores each exposure by risk, and keeps the
picture current** — turning "we think we know what we run" into an evidence-backed inventory.

1. **Discover** — passive OSINT to enumerate assets without touching anyone else's systems intrusively:
   - Subdomains via Certificate Transparency (crt.sh) + public DNS resolution
   - Resolves live hosts, IPs, and hosting/ASN via existing IOC/WHOIS store
   - Fingerprints exposed services (HTTP banners, open-port sweep via the existing Nmap service)
2. **Assess** — flags the exposures that matter: forgotten subdomains, dev/staging hosts reachable
   from the internet, expired/misconfigured TLS, open storage buckets, unexpected open ports.
3. **Prioritize** — an **Exposure Risk Score** per asset (severity × exposure × asset criticality),
   feeding the existing posture score, correlation engine, and MITRE ATT&CK mapping.
4. **Track over time** — re-runs discovery and **diffs against the last snapshot**, so *newly appeared*
   assets ("a new subdomain went live last night") raise an alert/incident automatically.

All results land in the existing `assets` + `iocs` tables and surface in a new
**Attack Surface Map** view alongside the current dashboard.

---

## What it does NOT do

- **No active exploitation** — it does not attack, brute-force, or attempt intrusion on any host.
- **No scanning of assets you don't own** — the seed domain is assumed to be the operator's own;
  passive sources only for third parties.
- **No trained ML/AI** — risk scoring is transparent, rule-based (consistent with the suite's honest scoping).
- **No real credential retrieval** — leaked-credential checks are heuristic/indicator-level, not live dumps.
- **Not a replacement for a pentest or a commercial ASM platform** — it is a lightweight visibility layer.
- **No guaranteed completeness** — passive discovery finds what public sources reveal, not everything.

---

## Attack / defense scenario it addresses

**Attacker's move (reconnaissance):** Before exploiting a target, an attacker enumerates its public
footprint — cert-transparency logs, DNS, port sweeps — hunting for the *weakest, least-watched* asset:
a forgotten `staging.acme.com`, an abandoned test box with an open admin port, a mislabeled cloud bucket.
These are found and exploited precisely because the organization forgot they existed.

**Defender's move (this tool):** Run the *same* passive reconnaissance an attacker would, but for
yourself — continuously. See your attack surface the way an attacker sees it, get the forgotten and
newly-appeared assets ranked by risk, and close the gap **before** it's found externally.
Maps to MITRE ATT&CK **Reconnaissance (TA0043)** — Active/Passive scanning and Gather Victim Host/Network
Information — reusing the suite's existing MITRE mapper.

---

## What "done" looks like

Done for the portfolio/IEEE-demo target means an end-to-end, demonstrable flow:

- [ ] **Input:** authenticated user submits a seed domain via a new discovery endpoint + UI panel.
- [ ] **Discovery:** subdomains enumerated from crt.sh + DNS; live hosts resolved; services fingerprinted.
      Works against a real domain; falls back to a seeded dataset when offline/rate-limited.
- [ ] **Persistence:** discovered assets written to the `assets` table; domains/IPs to `iocs` — no duplicates.
- [ ] **Risk:** every discovered asset carries an Exposure Risk Score with an explainable signals breakdown
      (why it's risky), reusing the existing detection-signals panel pattern.
- [ ] **Visibility:** an **Attack Surface Map** page lists/graphs assets grouped by exposure and risk,
      filterable by criticality and status.
- [ ] **Continuity:** a re-scan diffs against the prior snapshot; *new* assets are surfaced and can raise
      an incident via the existing correlation engine.
- [ ] **Prioritization proven:** the top-risk exposure in the demo dataset is correctly ranked #1 and maps
      to a MITRE Reconnaissance technique.
- [ ] **Honesty:** limitations above are documented in the README, matching the project's existing tone.

**Demo acceptance:** From a fresh login, enter one domain → within a minute see a ranked list of
discovered exposures, a map view, and a "3 new assets since last scan" diff — with no manual asset entry.
