"use client";

import * as React from "react";
import {
  AppLayout,
  TopBar,
  Button,
  Input,
  DropZone,
  ResultCard,
  RiskBadge,
  LoadingState,
  Card,
} from "@/components/cyber";
import type { Verdict, Severity } from "@/components/cyber/result-card";
import { API_URL } from "@/lib/config";

type PageState = "idle" | "loading" | "result";

interface PortResult {
  port: number;
  service: string;
  risk: Severity;
  note: string;
}

interface ScanResult {
  tool: string;
  verdict: Verdict;
  severity: Severity;
  title: string;
  target: string;
  aiExplanation: string;
  actions: string[];
  threat_name?: string;
  rawResult?: any;
}

interface NetworkScanResult extends ScanResult {
  total_open_ports: number;
  ports: PortResult[];
}

const mockPortResults: PortResult[] = [
  { port: 3389, service: "RDP", risk: "Critical", note: "WannaCry spread through here" },
  { port: 443, service: "HTTPS", risk: "Low", note: "Encrypted, generally safe" },
  { port: 445, service: "SMB", risk: "Critical", note: "EternalBlue exploit path" },
  { port: 80, service: "HTTP", risk: "Medium", note: "No encryption" },
  { port: 22, service: "SSH", risk: "Low", note: "Standard access port" },
];

export default function RansomwarePage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [state, setState] = React.useState<PageState>("idle");
  const [result, setResult] = React.useState<ScanResult | null>(null);

  // Port scanner state
  const [portIp, setPortIp] = React.useState("");
  const [portScanning, setPortScanning] = React.useState(false);
  const [portResult, setPortResult] = React.useState<NetworkScanResult | null>(null);

  const handleScan = async () => {
    if (!file) return;
    setState("loading");
    
    const backendUrl = API_URL;
    let r: ScanResult;

    const token = localStorage.getItem("cyberguard-token") || "";

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${backendUrl}/api/scan/file`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "File scanning failed.");
      }
      const raw = await res.json();
      r = {
        tool: raw.tool || "clamav",
        verdict: raw.verdict,
        severity: raw.severity,
        title: raw.verdict === "INFECTED" ? "Ransomware signatures detected" : raw.verdict === "CLEAN" ? "File appears clean" : "Suspicious file detected",
        target: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        threat_name: raw.threat_name || undefined,
        aiExplanation: raw.summary,
        actions: raw.actions || [
          "Delete this file immediately",
          "Scan your system with antivirus software",
        ],
        rawResult: raw
      };
    } catch (err: any) {
      console.error("File Scan error: ", err);
      r = {
        tool: "clamav",
        verdict: "ERROR",
        severity: "None",
        title: "File Scan Failed",
        target: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        aiExplanation: err.message || "Failed to contact backend API or authenticate session.",
        actions: [
          "Verify that the file is not too large or locked.",
          "Check your login session and network connectivity."
        ]
      };
    }

    setResult(r);
    setState("result");
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setFile(null);
  };

  const handlePortScan = async (profile: "quick" | "deep") => {
    if (!portIp.trim()) return;
    setPortScanning(true);
    
    const backendUrl = API_URL;
    const token = localStorage.getItem("cyberguard-token") || "";

    try {
      const res = await fetch(`${backendUrl}/api/scan/network`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ target: portIp }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Network port scanning failed.");
      }
      const raw = await res.json();
      setPortResult({
        tool: raw.tool || "nmap",
        verdict: raw.verdict,
        severity: raw.severity,
        title: raw.verdict === "DANGEROUS" ? "Network Vulnerabilities Found" : "Network Appears Secure",
        target: portIp,
        total_open_ports: raw.total_open_ports || 0,
        ports: (raw.ports || []).map((p: any) => ({
          port: p.port,
          service: p.service,
          risk: p.risk,
          note: p.reason
        })),
        aiExplanation: raw.summary,
        actions: raw.actions,
        rawResult: raw
      });
    } catch (err: any) {
      console.error("Port scan error: ", err);
      setPortResult({
        tool: "nmap",
        verdict: "ERROR",
        severity: "None",
        title: "Network Scan Failed",
        target: portIp,
        total_open_ports: 0,
        ports: [],
        aiExplanation: err.message || "Failed to contact backend API or authenticate session.",
        actions: [
          "Ensure the target hostname or IP is correct.",
          "Check your network connectivity and login state."
        ]
      });
    }
    setPortScanning(false);
  };

  const cleanThreatName = result?.threat_name
    ? result.threat_name.split(":").pop()?.trim()
    : null;

  return (
    <AppLayout waveIntensity="minimal">
      <div className="mx-auto max-w-[860px]">
        <TopBar
          title="Ransomware Scanner"
          subtitle="Upload a suspicious file. We'll check it before you open it."
        />

        {/* Drop Zone / File Chip */}
        <div className="mb-4">
          <DropZone
            onFileSelect={setFile}
            selectedFile={file}
            disabled={state === "loading"}
          />
        </div>

        <Button
          fullWidth
          onClick={handleScan}
          loading={state === "loading"}
          loadingText="Scanning file, please wait... (this takes ~25 seconds)"
          disabled={!file || state === "loading"}
        >
          Scan File
        </Button>

        {/* Loading */}
        {state === "loading" && (
          <div className="mt-4">
            <LoadingState
              messages={[
                "Extracting signature...",
                "Checking threat database...",
                "Running AI analysis...",
              ]}
              interval={1200}
            />
          </div>
        )}

        {/* Result */}
        {state === "result" && result && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ResultCard
              verdict={result.verdict}
              severity={result.severity}
              title={result.title}
              target={result.target}
              aiExplanation={result.aiExplanation}
              actions={result.actions}
              onReset={handleReset}
              resetLabel="Scan Another File"
              rawResult={result.rawResult}
            >
              {cleanThreatName && (
                <div className="rounded-lg bg-risk-critical/10 p-3 text-sm border border-risk-critical/20">
                  <span className="font-semibold text-risk-critical">Malware Signature:</span>{" "}
                  <span className="font-mono text-text-primary">{cleanThreatName}</span>
                </div>
              )}
            </ResultCard>
          </div>
        )}

        <div className="my-10 border-t border-dashed border-[rgba(255,255,255,0.06)] [data-theme='light']_&:border-[rgba(0,0,0,0.08)]" />

        {/* Port Scanner — always visible below */}
        <div className="mt-10 mb-20">
          <TopBar
            title="Network Scanner"
            subtitle="Check if your servers are exposing vulnerable ports to the internet."
          />
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Enter IP address or domain name..."
                  value={portIp}
                  onChange={(e) => setPortIp(e.target.value)}
                  disabled={portScanning}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePortScan("quick");
                  }}
                />
              </div>
              <Button
                variant="ghost"
                onClick={() => handlePortScan("quick")}
                loading={portScanning}
                loadingText="Scanning..."
                disabled={!portIp.trim()}
                className="sm:w-auto"
              >
                Quick Scan
              </Button>
              <Button
                onClick={() => handlePortScan("deep")}
                loading={portScanning}
                loadingText="Scanning..."
                disabled={!portIp.trim()}
                className="sm:w-auto"
              >
                Deep Scan
              </Button>
            </div>

            {portScanning && (
              <LoadingState
                messages={[
                  "Initializing Nmap...",
                  "Scanning common ports...",
                  "Identifying services...",
                ]}
                interval={600}
              />
            )}

            {/* Port Results via ResultCard */}
            {portResult && !portScanning && (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ResultCard
                  verdict={portResult.verdict}
                  severity={portResult.severity}
                  title={portResult.title}
                  target={portResult.target}
                  aiExplanation={portResult.aiExplanation}
                  actions={portResult.actions}
                  onReset={() => { setPortResult(null); setPortIp(""); }}
                  resetLabel="Clear Network Scan"
                  rawResult={portResult.rawResult}
                >
                  <p className="text-xs text-text-muted mb-3 uppercase tracking-wider font-semibold">
                    {portResult.total_open_ports} Open Ports Found
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-border bg-bg-main">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-border bg-bg-card">
                          <th className="py-2.5 pl-4 pr-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Port</th>
                          <th className="py-2.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Service</th>
                          <th className="py-2.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Risk</th>
                          <th className="py-2.5 pr-4 pl-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {portResult.ports.map((port) => (
                          <tr key={port.port} className={
                            port.risk === "Critical" ? "bg-risk-critical/5" :
                            port.risk === "High" || port.risk === "Medium" ? "bg-risk-moderate/5" : ""
                          }>
                            <td className="py-2.5 pl-4 pr-2 font-mono font-medium text-text-primary">{port.port}</td>
                            <td className="py-2.5 px-2 text-text-primary">{port.service}</td>
                            <td className="py-2.5 px-2"><RiskBadge severity={port.risk} /></td>
                            <td className="py-2.5 pr-4 pl-2 text-xs text-text-secondary">{port.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ResultCard>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
