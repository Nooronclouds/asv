# Backend Changes

Detailed list of backend correct security hardening fixes and contract alignments:

## Phase 1 — Correctness & Security Bugs
- **Database Enforce**: Modified `database.py` to fetch `DATABASE_URL` via environment variables and raise `RuntimeError` if missing.
- **Environment variables**: Created `.env.example` template config.
- **Plaintext password hashing**: Wired `hash_password` in registration and `verify_password` in login routes using passlib/bcrypt.
- **JWT Authorization Enforced**: Applied HTTP Bearer token decoding and verification (`get_current_user` dependency) to protect all private routes: `/analyze`, `/api/scan/*`, `/scan-history*`, `/reports`, `/dashboard-summary`.
- **CORS Allow-list**: Replaced insecure wildcard origins (`allow_origins=["*"]`) with restricted origins parsed from the `ALLOWED_ORIGINS` environment variable.
- **Pydantic Validation**: Replaced dictionary parameters in API endpoints with Pydantic request models (`URLScanRequest`, `NetworkScanRequest`, `EmailScanRequest`, `UPIScanRequest`, `RegisterRequest`, `LoginRequest`) enforcing formats and email validation.
- **Temp file handling**: Modified file scanning to use unique `uuid4()` names under the system's temp directory and wrapped cleanup in `try ... finally` blocks to prevent disk leaks.
- **Robust AI client**: Load AI URL from env, added 5 seconds timeout, and secure fallback answers.
- **Alerts fixed**: Updated call site to pass entire `result` dict instead of just the risk level string.
- **Removed duplicate routes**: Cleaned duplicate route functions.

## Phase 2 — Contract Alignment
- **Vocabulary mapping**: Standardized risk and severity vocabulary to exactly title-cased `None | Low | Medium | High | Critical`.
- **Unified output response validation**: Created a shared `ScanResult` response model enforced by FastAPI's `response_model` parameter.
- **Verdict enum alignment**: Verified all verdict keys conform strictly to `CLEAN | INFECTED | DANGEROUS | SUSPICIOUS | PHISHING | ERROR`.

## Phase 5-9 — Verification, UI Polish & Differentiation
- **UPI ID Security Hardening**: Restructured `/api/scan/upi` endpoint. It validates address handle format structure (`user@handle`) and caps best-case verdict at `SUSPICIOUS` / `Low` with instructions requiring manual verification on the PSP app, avoiding keyword bypass.
- **Direct Cryptography (Direct Bcrypt)**: Removed dependency on passlib to resolve Python 3.12 compatibility issues, calling the `bcrypt` library directly to handle secure salt generation and password verification.
- **Explainable AI Indicators**: Extended the unified `ScanResult` Pydantic response model to return structured data blocks (such as `raw_ports` lists in `nmap_scanner.py` and email SPF/DKIM validation outputs) to enable explainable indicators in the UI.
- **Test validation suite**: Expanded pytest suite checking auth middleware, JWT tokens validation, user signup, login, and validation error status codes. All tests pass.
