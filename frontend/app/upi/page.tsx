"use client";

import * as React from "react";
import { AppLayout, TopBar, Button, Input, DropZone, ResultCard, LoadingState } from "@/components/cyber";
import { API_URL } from "@/lib/config";

type RiskLevel = "safe" | "moderate" | "critical";
type PageState = "idle" | "loading" | "result";

interface ScanResult {
  risk: RiskLevel;
  title: string;
  target: string;
  flags: string[];
  aiExplanation: string;
  actions: string[];
  rawResult?: any;
}

export default function UpiPage() {
  const [upiId, setUpiId] = React.useState("");
  const [qrFile, setQrFile] = React.useState<File | null>(null);
  const [ssFile, setSsFile] = React.useState<File | null>(null);
  const [state, setState] = React.useState<PageState>("idle");
  const [result, setResult] = React.useState<ScanResult | null>(null);

  const canVerify = upiId.trim() || qrFile || ssFile;

  const handleVerify = async () => {
    if (!canVerify) return;
    setState("loading");
    
    const backendUrl = API_URL;
    const token = localStorage.getItem("cyberguard-token") || "";
    const target = upiId || qrFile?.name || ssFile?.name || "unknown";

    try {
      let rawResult: any;
      if (qrFile || ssFile) {
        const formData = new FormData();
        formData.append("file", qrFile || ssFile!);
        const res = await fetch(`${backendUrl}/api/scan/file`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "UPI file scanning failed.");
        }
        rawResult = await res.json();
      } else {
        const res = await fetch(`${backendUrl}/api/scan/upi`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ upi_id: upiId }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "UPI ID check failed.");
        }
        rawResult = await res.json();
      }

      const rawSeverity = rawResult.severity.toLowerCase();
      let risk: "safe" | "moderate" | "critical" = "safe";
      if (rawSeverity === "critical" || rawSeverity === "high") {
        risk = "critical";
      } else if (rawSeverity === "medium" || rawSeverity === "low") {
        risk = "moderate";
      }

      setResult({
        risk,
        title: rawResult.verdict === "ERROR" ? "Scan Error" : rawResult.verdict === "DANGEROUS" || rawResult.verdict === "INFECTED" ? "Fraudulent UPI detected" : rawResult.verdict === "SUSPICIOUS" ? "UPI ID needs caution" : "UPI ID appears legitimate",
        target,
        flags: [
          `Verdict: ${rawResult.verdict}`,
          `Severity: ${rawResult.severity}`,
          `Scanning Engine: ${rawResult.tool}`
        ],
        aiExplanation: rawResult.summary,
        actions: rawResult.actions,
        rawResult
      });
    } catch (err: any) {
      console.error("UPI verification failed: ", err);
      setResult({
        risk: "critical",
        title: "Verification Failed",
        target,
        flags: ["Error contacting API or session expired."],
        aiExplanation: err.message || "Failed to contact backend API or authenticate session.",
        actions: [
          "Check your network connectivity.",
          "Ensure you are logged in to your account."
        ]
      });
    }
    setState("result");
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setUpiId("");
    setQrFile(null);
    setSsFile(null);
  };

  return (
    <AppLayout waveIntensity="minimal">
      <div className="mx-auto max-w-[860px]">
        <TopBar title="UPI Payment Verifier" subtitle="Verify a payment before you send money." />

        {state !== "result" && (
          <>
            {/* QR Code */}
            <p className="section-tag mb-3">Scan a QR Code</p>
            <DropZone
              onFileSelect={setQrFile}
              selectedFile={qrFile}
              accept=".png,.jpg,.jpeg,.gif,.webp"
              acceptLabel=".png · .jpg · .jpeg · .webp"
              disabled={state === "loading"}
            />

            {/* Or divider */}
            <div className="relative my-6 flex items-center">
              <div className="flex-1 border-t border-dashed border-border" />
              <span className="mx-4 text-[11px] font-semibold uppercase text-text-muted">or</span>
              <div className="flex-1 border-t border-dashed border-border" />
            </div>

            {/* Screenshot */}
            <p className="section-tag mb-3">Upload a Screenshot</p>
            <DropZone
              onFileSelect={setSsFile}
              selectedFile={ssFile}
              accept=".png,.jpg,.jpeg,.gif,.webp"
              acceptLabel=".png · .jpg · .jpeg · .webp"
              disabled={state === "loading"}
            />

            {/* Or divider */}
            <div className="relative my-6 flex items-center">
              <div className="flex-1 border-t border-dashed border-border" />
              <span className="mx-4 text-[11px] font-semibold uppercase text-text-muted">or</span>
              <div className="flex-1 border-t border-dashed border-border" />
            </div>

            {/* UPI ID input */}
            <p className="section-tag mb-3">Enter UPI ID</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input
                  icon={<span className="text-sm font-semibold text-text-muted">@</span>}
                  placeholder="merchant@upi or 987...@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  disabled={state === "loading"}
                  onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
                />
              </div>
              <Button
                onClick={handleVerify}
                loading={state === "loading"}
                loadingText="Verifying..."
                disabled={!canVerify}
                className="sm:w-auto"
              >
                Verify Payment
              </Button>
            </div>
          </>
        )}

        {state === "loading" && (
          <div className="mt-4">
            <LoadingState
              messages={["Extracting UPI ID...", "Checking payment details...", "Running AI analysis..."]}
              interval={1000}
            />
          </div>
        )}

        {state === "result" && result && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ResultCard
              verdict={result.risk === "critical" ? "DANGEROUS" : result.risk === "moderate" ? "SUSPICIOUS" : "CLEAN"}
              severity={result.risk === "critical" ? "Critical" : result.risk === "moderate" ? "Medium" : "None"}
              title={result.title}
              target={result.target}
              aiExplanation={result.aiExplanation}
              actions={result.actions}
              onReset={handleReset}
              resetLabel="Verify Another"
              rawResult={result.rawResult}
            >
              {result.flags && result.flags.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Indicators</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-xs text-text-secondary font-mono">
                    {result.flags.map((f, idx) => <li key={idx}>{f}</li>)}
                  </ul>
                </div>
              )}
            </ResultCard>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
