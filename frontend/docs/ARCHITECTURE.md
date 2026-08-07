# Frontend Architecture - Vanguard SME Security Suite

Vanguard SME Security Suite Frontend is built with Next.js (App Router), React, Tailwind CSS, Lucide icons, and Recharts.

## Directory Structure

- `app/`: Next.js pages representing the user dashboard and individual security scanners:
  - `dashboard/`: Overview card stats, Threat of the Day facts, and Recharts-based Security Posture trend calculations.
  - `login/` / `register/`: Authenticated user flows connecting directly to live backend hashing routes.
  - `phishing/`: Scanners for URLs and raw email headers.
  - `ransomware/`: Scanner for file signatures and open network port vulnerability diagnostics.
  - `upi/`: Syntactic and security keyword checking for payment handles.
  - `reports/`: Historical logs showing detailed cards for completed checks.
- `components/cyber/`:
  - `posture-chart.tsx`: Client-side Recharts chart plotting security trend data.
  - `result-card.tsx`: Display card showing scan verdicts, severities, actions lists, and expandable technical explainers.
  - `logo.tsx`: Consolidated Vanguard SME branding.
  - `sidebar.tsx` / `top-bar.tsx` / `app-layout.tsx`: General page layout structure.
- `lib/`:
  - `config.ts`: Centralized configuration variables (such as `API_URL`).
  - `utils.ts`: Helper tailwind merging methods.
