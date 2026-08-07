# Vanguard SME Security Suite — Frontend Dashboard

This directory contains the Next.js React client application for the Vanguard SME Security Suite. It provides an intuitive, high-fidelity security console for small businesses to trigger security scans, review assets/threat indicators, monitor security postures, and investigate incident reports.

## Table of Contents
- [Tech Stack & Package Dependencies](#tech-stack--package-dependencies)
- [Key Features & UI Layout](#key-features--ui-layout)
- [Explainable AI Signals & Result Cards](#explainable-ai-signals--result-cards)
- [Setup & Local Development](#setup--local-development)
- [Deployment Scripts](#deployment-scripts)

---

## Tech Stack & Package Dependencies
* **Core Framework**: [Next.js](https://nextjs.org/) 16 (App Router) & [React](https://react.dev/) 19
* **Language**: [TypeScript](https://www.typescriptlang.org/) (5.7.3)
* **Styling**: [TailwindCSS](https://tailwindcss.com/) (4.2.0)
* **Visual Data Charts**: [Recharts](https://recharts.org/) (2.15.0)
* **UI Components & Icons**: Radix UI primitives, Lucide React (0.564.0), and Embla Carousel
* **State & Forms**: React Hook Form (7.54.1), Zod validation schemas (3.24.1)

---

## Key Features & UI Layout
The dashboard layout is structured as follows (see [app](./app) routes):

1. **Dashboard Overview** (`/dashboard`): Displays counts of active risks (Critical, High, Medium, Low), host distribution counts, and the **Posture Trend Chart**.
2. **Scan Tools**:
   * **URL Scan** (`/phishing`): Input field to query web link reputation.
   * **Email Analyzer** (`/phishing`): Multi-line header parsing input to investigate SPF/DKIM authentication details.
   * **Malware Scan** (`/ransomware`): File drop-zone to upload binaries and check signature matches.
   * **Network Scan** (`/dashboard` / custom inputs): Triggers port checking.
   * **UPI Checker** (`/upi`): Payment handle verify input with quick security alerts.
3. **Incidents Center** (`/incidents`): Interactive incident tickets overview. Includes detailed timeline updates, analyst assignments, and text-based export actions.
4. **Indicators & Assets**:
   * **Asset Inventory**: Tabular views showing discovered machines, operating systems, open ports list, and criticality classifications.
   * **IOC Log**: Consolidated table showing correlated Indicators of Compromise.

---

## Explainable AI Signals & Result Cards
The client features a customized, expandable `ResultCard` (defined in [components/cyber/result-card.tsx](./components/cyber/result-card.tsx)) designed to translate raw scanner parameters into human-readable details:
* **Collapse/Expand Control**: Clickable link to display/hide raw detection indicators.
* **ClamAV malware details**: Displays signature name flags (e.g., Eicar test signatures) directly to the investigator.
* **Nmap raw port listings**: Renders arrays of found open ports, services, and versions rather than abstract alerts.
* **Email verification flags**: Visual lists highlighting SPF statuses, DKIM alignment, and domain checks.
* **Interactive AI Q&A Chat**: A chat interface within the result card allowing users to ask questions and receive explanations in plain terminology.

---

## Setup & Local Development

### 1. Requirements
* Node.js v18+ and `npm`

### 2. Configuration
Create a `.env.local` configuration file inside the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Execution
Install packages and start the Next.js local development server:
```bash
# Install NPM dependencies
npm install

# Spin up development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Deployment Scripts
Production deployment builds can be compiled and executed using standard Next.js build scripts:
```bash
# Build optimized production bundle
npm run build

# Start the compiled client application
npm run start
```
The client code undergoes typescript compilation and ESLint verification before bundle finalization.
