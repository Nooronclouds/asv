# Frontend Changes

Detailed list of frontend integration and verification modifications:

## Phase 3 — Frontend Wiring
- **Active API fetch integration**: Replaced mock timeout calls inside `app/phishing/page.tsx`, `app/ransomware/page.tsx`, and `app/upi/page.tsx` with actual `fetch` queries using `NEXT_PUBLIC_API_URL` environment base URL.
- **Authorization header mapping**: Extracted authentication tokens from `localStorage` (`cyberguard-token`) and set active `Authorization: Bearer <token>` authorization headers on all private scans and reports page requests.
- **Backend error surfacing**: Captured API non-2xx failures, parsed custom error messages, and returned `verdict: "ERROR"` to display clean error explanations directly in the UI.
- **Compatibility enhancements**: Updated the `RiskDot` design component to accept both `severity` and `risk` props for seamless UI mapping.
- **ResultCard details support**: Enhanced `ResultCard` to display custom scan failure titles and explanations if the scan verdict is `ERROR`.

## Phase 5-9 — Verification, UI Polish & Differentiation
- **Unified Risk Posture score**: Created a `PostureChart` client-side component (using `recharts`) plotting a rolling security posture score over time derived from user's live scan history entries.
- **Explainable AI Signals Panel**: Enhanced the global `ResultCard` component with an expandable "Detection Signals" panel. Reads and formats structured scan indicators (SPF/DKIM statuses, Open ports lists, and malware threat names) dynamically.
- **Session Expiration Redirection**: Updated dashboard client calls to catch 401 token expired/invalid session codes, clear localStorage, and redirect to the `/login` route.
- **ResultCard Props Alignment**: Reconciled the props interface across the scan modules (phishing, ransomware, upi, reports) to pass correct design token payloads (`verdict`, `severity`, `rawResult`) to `ResultCard`.
- **Empty Scan States**: Added clean empty dashboard state widgets indicating zero checks are found when logging in with a new user.
