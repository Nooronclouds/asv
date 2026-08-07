<div align="center">

# 🛡️ Vanguard SME Security Suite

**A unified cybersecurity scanning and posture-monitoring platform for small and medium businesses**

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Unlicensed-lightgrey?style=flat)]()

*Personal portfolio project — not a commercial product*

[Overview](#project-overview) • [Features](#key-features) • [Architecture](#architecture) • [Getting Started](#getting-started) • [Roadmap](#roadmap)

</div>

---

## Project Overview

Small and medium businesses are frequent targets of phishing, malware, network intrusion, and payment fraud, but rarely have the budget or staffing for a dedicated security operations team. Existing tools tend to be either enterprise SIEM platforms priced and built for large security teams, or single-purpose consumer tools (one antivirus, one phishing checker) that never talk to each other.

Vanguard SME Security Suite consolidates five common attack-surface checks — file/malware, malicious URLs, network exposure, phishing email, and UPI payment fraud — into a single authenticated dashboard, then correlates the results into one running security posture score instead of five disconnected reports. High-severity findings are automatically escalated into incidents tagged against real MITRE ATT&CK tactics and techniques.

This project was built as a portfolio/IEEE-track demonstration of full-stack security engineering — API design, authentication, threat-detection integration, and correlation logic — not as a production SOC platform.

---

## Key Features

### Core Detection

| Module | What it does | Backing technology |
|---|---|---|
| File / Malware Scan | Scans uploaded files for known malware signatures | ClamAV |
| URL Scanner | Checks URLs against reputation/threat databases | VirusTotal API |
| Network Scanner | Scans a target for open ports and exposed services | Nmap |
| Email / Phishing Analyzer | Validates SPF/DKIM/DMARC, flags lookalike domains and brand impersonation | Custom heuristic engine |
| UPI Fraud Check | Validates UPI handle format and flags known fraud patterns | Custom heuristic engine (format-level only) |
| Attack Surface Discovery | Expands authorized seed domains into a ranked, explainable inventory of internet-visible exposures, and tracks change between scans | Async pipeline (httpx / dnspython / Certificate Transparency) — see [`backend/app/attack_surface/README.md`](backend/app/attack_surface/README.md) |

### Correlation & Posture

| Feature | Description |
|---|---|
| Security Posture Score | Rolling trend score aggregated from historical scan results across all five tools |
| IOC Correlation Engine | Links related findings across scans and auto-escalates matches into incidents |
| MITRE ATT&CK Mapping | High-severity incidents are tagged with real ATT&CK tactic/technique IDs — verified working against live scan data |

### Explainability

| Feature | Description |
|---|---|
| Detection Signals Panel | Expandable per-result breakdown showing the specific signals behind a verdict, rather than an opaque score |

### Access & Reporting

| Feature | Description |
|---|---|
| JWT Authentication | Token-based auth on all protected routes |
| Role-Based Access Control | Roles include SOC Analyst, Threat Hunter, Admin |
| Rate Limiting | Per-endpoint request throttling via SlowAPI |
| Text Incident Report Export | One-click plain-text report generation for any incident |

> **Note:** This project does not currently include enterprise features (multi-tenant orgs, SSO, SIEM integrations), trained ML/AI models, or scheduled/automated scanning. See Roadmap for what is intentionally out of scope today.

---

## Architecture

```mermaid
flowchart TB
    User([User]) --> FE[Next.js Frontend]
    FE -->|JWT Bearer Auth| API[FastAPI Backend]

    API --> Auth[Auth and RBAC Layer]
    API --> Routes[API Routes]

    Routes --> Scan[Scan Services]
    Scan --> ClamAV[ClamAV Engine]
    Scan --> VT[VirusTotal Client]
    Scan --> Nmap[Nmap Scanner]
    Scan --> Email[Email/Phishing Analyzer]
    Scan --> UPI[UPI Format Checker]

    Scan --> Correlation[IOC Correlation Engine]
    Correlation --> MITRE[MITRE ATT&CK Mapper]
    Correlation --> DB[(PostgreSQL)]

    Routes --> Reports[Text Report Generator]
    Routes --> DB
```

### Request Flow

```
User -> Frontend (Next.js) -> Backend (FastAPI, JWT-verified)
     -> Scan Service (ClamAV / VirusTotal / Nmap / Email / UPI)
     -> Correlation Engine -> MITRE Mapper -> PostgreSQL
     -> Result returned to Dashboard
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Backend Framework | FastAPI (Python 3.12) |
| Database | PostgreSQL via SQLAlchemy |
| Authentication | JWT (python-jose), bcrypt |
| Rate Limiting | SlowAPI |
| Malware Scanning | ClamAV |
| Threat Intelligence | VirusTotal API |
| Network Scanning | Nmap |
| Deployment | Not yet containerized |

---

## Screenshots

> Add real screenshots to `docs/screenshots/` before publishing. Placeholders below.

| View | Image |
|---|---|
| Dashboard | `![Dashboard](docs/screenshots/dashboard.png)` |
| Scan Result | `![Scan Result](docs/screenshots/scan-result.png)` |
| Incident Report | `![Incident](docs/screenshots/incident.png)` |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12
- PostgreSQL 14+

### 1. Clone

```bash
git clone https://github.com/nayefsiddique-eng/vanguard-sme-suite.git
cd vanguard-sme-suite
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
```

Then fill in `backend/.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/vanguard
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
```

### 4. Run

```bash
npm run dev
```

Frontend: `http://localhost:3000`
Backend docs (Swagger): `http://localhost:8000/docs`

---

## API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/register` | Create a new user account | No |
| POST | `/login` | Authenticate and receive a JWT | No |
| POST | `/api/scan/file` | Submit a file for malware scanning | Yes |
| POST | `/api/scan/url` | Submit a URL for reputation check | Yes |
| POST | `/api/scan/network` | Submit a target for port/service scan | Yes |
| POST | `/api/scan/email` | Submit email headers for phishing analysis | Yes |
| POST | `/api/scan/upi` | Submit a UPI handle for fraud check | Yes |
| GET | `/scan-history` | Retrieve the current users scan history | Yes |
| GET | `/incidents` | Retrieve correlated incidents | Yes |
| GET | `/api/reports/{incident_id}/text` | Export a text report for an incident | Yes |
| POST | `/api/attack-surface/scan` | Run an attack-surface scan over authorized seeds | Yes |
| GET | `/api/attack-surface/runs` | List recent scan runs | Yes |
| GET | `/api/attack-surface/findings` | List current findings, worst-first | Yes |

> Attack-surface request/response shapes and the full module design are
> documented in [`backend/app/attack_surface/README.md`](backend/app/attack_surface/README.md).

---

## Folder Structure

```
vanguard-sme-suite/
├── backend/
│   ├── app/
│   │   ├── api/            # Route handlers (scan, auth, incidents, history)
│   │   ├── core/           # Config, security (JWT/hashing), RBAC
│   │   ├── db/              # SQLAlchemy models and database session
│   │   ├── schemas/         # Pydantic request/response models
│   │   ├── services/        # Scanner integrations, correlation, MITRE mapping
│   │   └── main.py          # FastAPI app instance
│   ├── test_main.py
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js pages (dashboard, phishing, ransomware, upi, reports)
│   ├── components/cyber/    # Scan result cards, risk badges, posture chart
│   ├── hooks/ lib/           # Shared frontend utilities
│   └── package.json
├── docs/
│   └── screenshots/          # Place real screenshots here
└── package.json               # Monorepo dev/install scripts
```

---

## Security Modules

**ClamAV File Scanner** — Purpose: detect known malware signatures. Input: uploaded file. Output: verdict + matched signature.

**VirusTotal URL Scanner** — Purpose: check URLs against threat intel. Input: URL string. Output: verdict + detection ratio.

**Nmap Network Scanner** — Purpose: identify open ports/services. Input: target host. Output: port list + exposure summary.

**Email/Phishing Analyzer** — Purpose: detect phishing/impersonation. Input: email headers. Output: SPF/DKIM/DMARC results + flags.

**UPI Fraud Checker** — Purpose: flag suspicious UPI handles. Input: UPI string. Output: format validity + capped-confidence risk verdict. Does not verify real ownership.

**IOC Correlation Engine** — Purpose: link findings across scans into incidents. Input: scan results. Output: incident records with MITRE mapping.

---

## AI & Automated Reasoning

This project does not use trained machine learning models or datasets. "Explainability" refers to structured, rule-based signal surfacing, not a predictive model. This is intentional scoping.

---

## Dashboard

| Widget | What it shows |
|---|---|
| Security Posture Score | Rolling score trend line from scan history |
| Recent Scans | Latest results across all five tools |
| Incidents | Auto-correlated incidents with MITRE ATT&CK tags |
| Detection Signals | Expandable explanation of triggering signals |

---

## Project Highlights

- Five independent detection tools unified behind one authenticated API and one posture score
- Real, verified MITRE ATT&CK mapping confirmed producing actual tactic/technique data from live scans
- Honest scoping: format-only UPI checks and text-only reports documented as limitations rather than glossed over

---

## Roadmap

**Completed**
- [x] JWT auth + RBAC across all protected routes
- [x] Five scan tool integrations
- [x] IOC correlation engine with auto-incident creation
- [x] MITRE ATT&CK mapping (verified end-to-end)
- [x] Security posture trend dashboard
- [x] Explainable detection-signals panel
- [x] Text-based incident report export

**In Progress**
- [ ] Database migration tooling
- [ ] Full audit log wiring for all user actions

**Future**
- [ ] Real UPI ownership verification via PSP-side API
- [ ] PDF report export
- [ ] Docker containerization
- [ ] CI pipeline

---

## Benchmarks

Benchmark results will be published once formal load/accuracy testing is conducted. None are available at this time.

---

## Contributing

This is currently a personal portfolio project and not actively seeking external contributions. Feel free to open an issue for bugs or suggestions.

---

## License

No license file has been added yet. All rights reserved by default until one is chosen.

---

## Acknowledgements

- [ClamAV](https://www.clamav.net/)
- [VirusTotal](https://www.virustotal.com/)
- [Nmap](https://nmap.org/)
- [MITRE ATT&CK](https://attack.mitre.org/)
- [FastAPI](https://fastapi.tiangolo.com/), [Next.js](https://nextjs.org/), [shadcn/ui](https://ui.shadcn.com/)

---

## Authors

1. **Mohammed Nayef Siddique** (Chair, IEEE Computer Society Student Branch | [GitHub](https://github.com/nayefsiddique-eng))
2. **Noor Laiba Maheen**
3. **Sobiya Ayaz**
4. **Nadira Fatima Sireen Sultana**
5. **Mohammed Ameen Ul Haq**

---

## Support

For issues or questions, please open a GitHub issue.

---

<div align="center">

*Built as part of ongoing cybersecurity and AI portfolio development.*

</div>
