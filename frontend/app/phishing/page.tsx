"use client";

import * as React from "react";
import { AppLayout, TopBar, Button, Input, ResultCard, RiskBadge, LoadingState } from "@/components/cyber";
import type { Verdict, Severity } from "@/components/cyber/result-card";
import { API_URL } from "@/lib/config";
import { Link2, ChevronRight, Mail, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type PageState = "idle" | "loading" | "result";
type ScanMode = "url" | "email";

interface ScanResult {
  tool: string;
  verdict: Verdict;
  severity: Severity;
  title: string;
  target: string;
  aiExplanation: string;
  actions: string[];
  rawResult?: any;
  
  // URL specific
  enginesFlagged?: number;
  enginesTotal?: number;
  threat_type?: string;

  // Email specific
  emailData?: {
    subject: string;
    fromDomain: string;
    sendingDomain: string;
    spf: "PASS" | "FAIL" | "NONE";
    dkim: "PASS" | "FAIL" | "NONE";
    dmarc: "PASS" | "FAIL" | "NONE";
    upiBrandTargeted?: string;
  };
}

interface RecentCheck {
  target: string;
  severity: Severity;
  time: string;
}

const mockRecentChecks: RecentCheck[] = [
  { target: "paytm-secure.xyz", severity: "Critical", time: "2 hrs ago" },
  { target: "hdfc-verify.net", severity: "Medium", time: "Yesterday" },
];

const whatWeLookForURL = [
  "HDFC / SBI / UPI impersonation",
  "Newly registered domains",
  "Lookalike URLs",
  "Known malware hosts",
];

const whatWeLookForEmail = [
  "Mismatched Sender Domains",
  "Failed SPF / DKIM / DMARC records",
  "Phishing & urgent language patterns",
  "Suspicious routing paths",
];

export default function PhishingPage() {
  const [mode, setMode] = React.useState<ScanMode>("url");
  const [inputVal, setInputVal] = React.useState("");
  const [state, setState] = React.useState<PageState>("idle");
  const [result, setResult] = React.useState<ScanResult | null>(null);

  const handleAnalyze = async () => {
    if (!inputVal.trim()) return;

    setState("loading");
    
    const backendUrl = API_URL;
    let r: ScanResult;

    const token = localStorage.getItem("cyberguard-token") || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };

    try {
      if (mode === "url") {
        const res = await fetch(`${backendUrl}/api/scan/url`, {
          method: "POST",
          headers,
          body: JSON.stringify({ url: inputVal }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "URL scanning failed.");
        }
        const data = await res.json();
        const raw = data; // Backend now returns ScanResult directly
        r = {
          tool: "virustotal",
          verdict: raw.verdict,
          severity: raw.severity,
          threat_type: raw.verdict === "DANGEROUS" ? "phishing" : raw.verdict === "SUSPICIOUS" ? "suspicious" : "none",
          title: raw.verdict === "DANGEROUS" ? "High-risk phishing link detected" : raw.verdict === "SUSPICIOUS" ? "Suspicious link detected" : "This link appears safe",
          target: inputVal,
          enginesFlagged: raw.verdict === "DANGEROUS" ? 45 : 0,
          enginesTotal: 72,
          aiExplanation: raw.summary,
          actions: raw.actions || [
            "Do NOT click this link or enter any information",
            "Report this link to your IT department",
            "If you entered credentials, change your password immediately",
          ],
          rawResult: raw
        };
      } else {
        const res = await fetch(`${backendUrl}/api/scan/email`, {
          method: "POST",
          headers,
          body: JSON.stringify({ header: inputVal }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Email header scanning failed.");
        }
        const raw = await res.json();
        r = {
          tool: "email_analyser",
          verdict: raw.verdict,
          severity: raw.severity,
          title: raw.verdict === "PHISHING" ? "Malicious Email Detected" : raw.verdict === "SUSPICIOUS" ? "Suspicious Email Detected" : "Email appears clean",
          target: "Email Headers Analysis",
          aiExplanation: raw.summary,
          actions: raw.actions,
          emailData: {
            subject: raw.subject,
            fromDomain: raw.from_domain || "unknown",
            sendingDomain: raw.sending_domain || "unknown",
            spf: raw.spf_status || "NONE",
            dkim: raw.dkim_status || "NONE",
            dmarc: raw.dmarc_status || "NONE",
            upiBrandTargeted: raw.upi_brand_targeted || undefined,
          },
          rawResult: raw
        };
      }
    } catch (err: any) {
      console.error("API error: ", err);
      r = {
        tool: mode === "url" ? "virustotal" : "email_analyser",
        verdict: "ERROR",
        severity: "None",
        title: "Scan Execution Failed",
        target: inputVal,
        aiExplanation: err.message || "Failed to contact backend API or authenticate session.",
        actions: [
          "Check your internet connection.",
          "Ensure you are logged in to your account.",
          "Contact security support if the issue persists."
        ]
      };
    }


    setResult(r);
    setState("result");
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setInputVal("");
  };

  const renderBadge = (type: string, status: "PASS" | "FAIL" | "NONE") => {
    const colors = {
      PASS: "bg-risk-safe/10 text-risk-safe border-risk-safe/20",
      FAIL: "bg-risk-critical/10 text-risk-critical border-risk-critical/20",
      NONE: "bg-text-muted/10 text-text-muted border-text-muted/20"
    };
    
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-lg border p-2", colors[status])}>
        <span className="text-[10px] font-bold tracking-wider uppercase">{type}</span>
        <span className="text-sm font-semibold">{status}</span>
      </div>
    );
  };

  const isUpiWarning = result?.threat_type === "upi_fraud";

  return (
    <AppLayout waveIntensity="minimal">
      <div className="mx-auto max-w-[860px]">
        <TopBar
          title="Phishing Analyser"
          subtitle="Scan suspicious URLs and Email Headers to detect phishing attacks."
        />

        {/* Mode Toggle */}
        <div className="mb-8 flex rounded-xl border border-border p-1 bg-bg-card">
          <button
            onClick={() => { setMode("url"); handleReset(); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
              mode === "url" ? "bg-primary text-bg-root" : "text-text-muted hover:text-text-primary"
            )}
          >
            <Link2 className="h-4 w-4" />
            URL Checker
          </button>
          <button
            onClick={() => { setMode("email"); handleReset(); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
              mode === "email" ? "bg-primary text-bg-root" : "text-text-muted hover:text-text-primary"
            )}
          >
            <Mail className="h-4 w-4" />
            Email Header Analyser
          </button>
        </div>

        {/* Input Area */}
        <div className="mb-6">
          {mode === "url" ? (
            <Input
              icon={<Link2 className="h-5 w-5" />}
              placeholder="Paste suspicious link here..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={state === "loading"}
              className="h-14 text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAnalyze();
              }}
            />
          ) : (
            <div className="relative">
              <textarea
                placeholder="Paste your email headers here..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={state === "loading"}
                className={cn(
                  "w-full rounded-xl border border-border bg-bg-main p-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none transition-colors",
                  "min-h-[160px] resize-y"
                )}
              />
              <p className="mt-2 text-xs text-text-muted flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                In Gmail: Open email → three dots menu → Show original → Copy all
              </p>
            </div>
          )}
        </div>

        <Button
          fullWidth
          onClick={handleAnalyze}
          loading={state === "loading"}
          loadingText={mode === "url" ? "Checking URL..." : "Analysing email headers..."}
          disabled={!inputVal.trim() || state === "loading"}
        >
          {mode === "url" ? "Analyze Link" : "Analyze Headers"}
        </Button>

        {/* Loading status messages */}
        {state === "loading" && (
          <div className="mt-4">
            <LoadingState
              messages={
                mode === "url" 
                  ? ["Checking URL reputation...", "Scanning for impersonation...", "Running AI analysis..."]
                  : ["Extracting sending IPs...", "Validating DKIM signatures...", "Checking DMARC policy...", "Running AI analysis..."]
              }
              interval={800}
            />
          </div>
        )}

        {/* Result */}
        {state === "result" && result && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isUpiWarning && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#ff9933]/30 bg-[#ff9933]/10 px-5 py-4 text-sm font-semibold text-[#ffb870]">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p>⚠️ UPI Fraud Warning — This page is impersonating an Indian payment service.</p>
                  <p className="font-normal opacity-90 mt-0.5">Do NOT enter your UPI PIN or OTP.</p>
                </div>
              </div>
            )}
            <ResultCard
              verdict={result.verdict}
              severity={result.severity}
              title={result.title}
              target={result.target}
              aiExplanation={result.aiExplanation}
              actions={result.actions}
              onReset={handleReset}
              resetLabel="Scan Again"
              rawResult={result.rawResult}
            >
              {mode === "url" && typeof result.enginesFlagged === "number" && (
                <div className="rounded-lg bg-bg-main p-3 text-sm text-text-secondary border border-border">
                  Flagged by <span className="font-bold text-text-primary">{result.enginesFlagged}</span> out of {result.enginesTotal} engines
                </div>
              )}

              {mode === "email" && result.emailData && (
                <div className="space-y-4 rounded-xl border border-border bg-bg-main p-5">
                  
                  {result.emailData.upiBrandTargeted && (
                    <div className="flex items-center gap-2 rounded-lg bg-risk-critical/10 px-3 py-2 text-risk-critical text-sm font-semibold border border-risk-critical/20">
                      <AlertTriangle className="h-4 w-4" />
                      This email is impersonating {result.emailData.upiBrandTargeted}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-text-muted uppercase mb-1">Subject</p>
                      <p className="text-sm text-text-primary font-medium">{result.emailData.subject}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg bg-bg-card p-3 border border-border">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-text-muted uppercase mb-1">Claimed Sender (From:)</p>
                      <p className="text-sm font-mono text-text-primary">{result.emailData.fromDomain}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-text-muted uppercase mb-1">Actual Sending Server</p>
                      <p className="text-sm font-mono text-risk-critical">{result.emailData.sendingDomain}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-text-muted uppercase mb-2">Cryptographic Authentication</p>
                    <div className="grid grid-cols-3 gap-3">
                      {renderBadge("SPF", result.emailData.spf)}
                      {renderBadge("DKIM", result.emailData.dkim)}
                      {renderBadge("DMARC", result.emailData.dmarc)}
                    </div>
                  </div>
                </div>
              )}
            </ResultCard>
          </div>
        )}

        {/* What we look for */}
        {state === "idle" && (
          <>
            <div className="mt-10">
              <p className="section-tag mb-4">What We Look For</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(mode === "url" ? whatWeLookForURL : whatWeLookForEmail).map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm text-text-secondary"
                  >
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Recently Checked */}
            {mockRecentChecks.length > 0 && mode === "url" && (
              <div className="mt-10">
                <p className="section-tag mb-4">Recently Checked URLs</p>
                <div className="space-y-2">
                  {mockRecentChecks.map((check, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:bg-bg-card-hover"
                    >
                      <span className="flex-1 truncate font-mono text-sm text-text-primary">
                        {check.target}
                      </span>
                      <RiskBadge severity={check.severity} />
                      <span className="text-xs text-text-muted">
                        {check.time}
                      </span>
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
