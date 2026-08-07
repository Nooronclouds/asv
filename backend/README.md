# Vanguard SME Security Suite — Backend API

This directory contains the FastAPI-powered backend API for the Vanguard SME Security Suite. It provides endpoints for JWT authentication, role-based access control (RBAC), multi-vector security scanners, correlation telemetry, and incident response tracking.

## Table of Contents
- [Tech Stack & Dependencies](#tech-stack--dependencies)
- [Database Schema & Models](#database-schema--models)
- [API Route Reference](#api-route-reference)
- [Threat Correlation & Scoring Heuristics](#threat-correlation--scoring-heuristics)
- [Setup & Local Development](#setup--local-development)
- [Known Limitations & Architecture Constraints](#known-limitations--architecture-constraints)

---

## Tech Stack & Dependencies
* **Core Framework**: [FastAPI](https://fastapi.tiangolo.com/) (0.110.0) & [Uvicorn](https://www.uvicorn.org/) (0.28.0)
* **ORM & Database Connection**: [SQLAlchemy](https://www.sqlalchemy.org/) (2.0.28) & PostgreSQL connector `psycopg2-binary` (2.9.9)
* **Security & Auth**: JWT decoding via `python-jose` (3.3.0) and password hashing via direct standard `bcrypt` (4.1.2)
* **Rate Limiter**: [SlowAPI](https://github.com/laurentS/slowapi) (0.1.9) wrapping token buckets on endpoints

---

## Database Schema & Models
The data layer is managed with SQLAlchemy (configured in [app/db/database.py](./app/db/database.py)). Schema definitions include (see [app/db/models.py](./app/db/models.py)):

1. **`User`**: Account records with hashed credentials. Defines roles: `Admin`, `SOC Analyst`, `Threat Hunter`, `Auditor`, and `Read Only`.
2. **`ScanHistory`**: Historical records of all initiated scans, including type, target, and JSON string results.
3. **`Asset`**: Discovered machines/hosts. Maps hostname, IP address, OS, open ports, status, and criticality.
4. **`IOC`**: Correlated Indicators of Compromise (IP, Domain, URL, Hash, Wallet) with reputation scores and metadata.
5. **`Incident`**: Security tickets created automatically on threat detection. Contains severity, timeline, and mitigation actions.
6. **`IncidentTimeline`**: Incremental milestones associated with an incident (e.g. log creation, status shifts).
7. **`RiskReport`**: Host posture metadata used to compute dashboard risk-level distribution charts.
8. **`AuditLog`**: Model representing administrator actions (e.g. login, role updates). *Note: Currently modeled but not actively populated by routes.*

---

## API Route Reference

| Method | Route | Description | Auth / Role Scope |
| :--- | :--- | :--- | :--- |
| **POST** | `/register` | Register a new user profile | Open (Defaults to `SOC Analyst` role) |
| **POST** | `/login` | Submit credentials to receive JWT token | Open |
| **POST** | `/api/scan/file` | Scan file for malware signatures (ClamAV) | Authenticated User |
| **POST** | `/api/scan/url` | Check reputation of web link (VirusTotal) | Authenticated User |
| **POST** | `/api/scan/network` | Port-scan target IP (Nmap / socket fallback) | Authenticated User |
| **POST** | `/api/scan/email` | Verify SPF/DKIM/DMARC in headers | Authenticated User |
| **POST** | `/api/scan/upi` | Check format and keyword flags on UPI ID | Authenticated User |
| **GET** | `/scan-history` | List scan history entries | Authenticated User |
| **GET** | `/scan-history/{scan_id}`| Get details of a single historical scan | Authenticated User |
| **DELETE**| `/scan-history/{scan_id}`| Remove a single scan history item | Authenticated User |
| **GET** | `/dashboard-summary`| Fetch device risk summaries | Authenticated User |
| **GET** | `/api/v1/incidents` | List all open and resolved incidents | `Admin`, `SOC Analyst`, `Threat Hunter` |
| **GET** | `/api/v1/incidents/{id}` | Get detail timeline for a specific incident | `Admin`, `SOC Analyst` |
| **PATCH**| `/api/v1/incidents/{id}` | Modify status/analyst and append timeline | `Admin`, `SOC Analyst` |
| **GET** | `/api/v1/incidents/{id}/text`| Export plain-text incident report | `Admin`, `SOC Analyst`, `Threat Hunter` |
| **GET** | `/api/v1/assets` | Retrieve registered assets | `Admin`, `SOC Analyst`, `Threat Hunter`, `Read Only` |
| **GET** | `/api/v1/iocs` | Retrieve correlated Indicators of Compromise | `Admin`, `SOC Analyst`, `Threat Hunter` |
| **GET** | `/api/v1/metrics/health`| Health status and uptime endpoint | Open |
| **GET** | `/api/v1/metrics/prometheus`| Prometheus format application metrics | Open |

---

## Threat Correlation & Scoring Heuristics
1. **Correlation Engine** ([app/services/correlation.py](./app/services/correlation.py)): When a scan yields a critical threat verdict (`DANGEROUS`, `INFECTED`, or `PHISHING`), the platform:
   - Stores the scanned target value as an `IOC` with designated reputation scores.
   - Registers/updates target IPs in the `Asset` table.
   - Automatically opens a new `Incident` ticket.
   - Maps the tool output to its matching MITRE ATT&CK tactic (defined in [app/services/mitre_mapper.py](./app/services/mitre_mapper.py)).
2. **Explainable AI Local Risk Scoring** ([app/services/scoring.py](./app/services/scoring.py)): If an external AI classification service is unavailable, local risk weights are evaluated deterministically to calculate the threat score (0 to 100):
   * VirusTotal scan detections: Weight **25%**
   * AbuseIPDB reported threat count: Weight **15%**
   * Nmap open ports: Weight **20%**
   * Reverse DNS hostname lookup mismatches: Weight **10%**
   * Invalid/Expired SSL certificates: Weight **10%**
   * CISA Known Exploited Vulnerability (KEV) flag: Weight **10%**
   * Domain WHOIS age checks: Weight **10%**

---

## Setup & Local Development

### 1. Requirements
* Python 3.10+
* SQLite (configured by default) or PostgreSQL server

### 2. Configuration
Create a `.env` file inside the `backend` folder matching `.env.example`:
```env
DATABASE_URL=sqlite:///./cyber_risk_dashboard.db
SECRET_KEY=insecure-default-dev-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
AI_SERVICE_URL=http://localhost:5000/analyze
```

### 3. Execution
To run the backend server individually:
```bash
# Install packages
pip install -r requirements.txt

# Launch development server
uvicorn app.main:app --reload --port 8000
```
API endpoints are exposed on [http://localhost:8000](http://localhost:8000). Interactive Swagger documentation can be accessed directly at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## Known Limitations & Architecture Constraints
* **Format-Only UPI Verifier**: Checks structure format correctness and screens for keyword matches (`fraud`, `scam`, etc.) completely offline. It cannot check active banking registry logs.
* **Database Migrations**: No migrations setup. SQLAlchemy auto-generates tables on boot. Schema upgrades require manual database drops or resets.
* **Audit Logging**: The `AuditLog` model is present in `models.py`, but it is not currently hooked into active API route handlers.
* **Local Fallback Heuristics**: Designed to function completely offline if the optional external AI service is unreachable, using standard regular expressions and reputation weights.
