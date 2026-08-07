"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RiskBadge } from "./risk-badge";
import { Button } from "./button";
import { Sparkles, Send } from "lucide-react";

export type Verdict = "CLEAN" | "INFECTED" | "DANGEROUS" | "SUSPICIOUS" | "PHISHING" | "ERROR";
export type Severity = "None" | "Low" | "Medium" | "High" | "Critical";

interface ResultCardProps {
  verdict: Verdict;
  severity: Severity;
  title: string;
  target: string;
  aiExplanation: string;
  actions: string[];
  onReset: () => void;
  resetLabel?: string;
  initialChat?: ChatMessage[];
  children?: React.ReactNode;
  className?: string;
  rawResult?: any;
}

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export function ResultCard({
  verdict,
  severity,
  title,
  target,
  aiExplanation,
  actions,
  onReset,
  resetLabel = "Scan Again",
  initialChat = [],
  children,
  className,
  rawResult,
}: ResultCardProps) {
  const [chatInput, setChatInput] = React.useState("");
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(initialChat);
  const [isAiTyping, setIsAiTyping] = React.useState(false);
  const [showSignals, setShowSignals] = React.useState(false);

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiTyping) return;

    // Add user message
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsAiTyping(true);

    // Mock AI response (Backend developer will replace this with real API call)
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `In simple terms, ${
            userMsg.length < 20 ? `"${userMsg}"` : "that term"
          } refers to a technique attackers use to trick your system. As an SME owner, you don't need to fix this yourself — just forward this report to your IT provider.`,
        },
      ]);
      setIsAiTyping(false);
    }, 1500);
  };

  const isError = verdict === "ERROR";
  const isDanger = verdict === "INFECTED" || verdict === "DANGEROUS" || verdict === "PHISHING";
  const isWarning = verdict === "SUSPICIOUS";
  const isSafe = verdict === "CLEAN";

  if (isError) {
    return (
      <div className={cn("rounded-2xl border border-border bg-bg-card p-7 text-center", className)}>
        <h3 className="font-display text-lg font-semibold text-text-primary mb-2">{title || "Scan Failed"}</h3>
        <p className="text-sm text-text-muted mb-6">{aiExplanation || "Scan could not be completed. Please try again."}</p>
        <Button variant="ghost" onClick={onReset}>{resetLabel}</Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-bg-card p-7 backdrop-blur-lg",
        "shadow-[0_4px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,255,65,0.04)_inset]",
        isSafe && "border-l-[3px] border-l-risk-safe",
        isWarning && "border-l-[3px] border-l-risk-moderate",
        isDanger && "border-l-[3px] border-l-risk-critical",
        severity === "Critical" && "animate-border-pulse",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        {/* Verdict Badge */}
        <div className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
          isSafe && "bg-risk-safe-dim text-risk-safe",
          isWarning && "bg-risk-moderate-dim text-risk-moderate",
          isDanger && "bg-risk-critical-dim text-risk-critical",
        )}>
          {verdict}
        </div>
        {/* Severity Badge */}
        <RiskBadge severity={severity} />
      </div>

      {/* Title & Target */}
      <h3 className="font-display text-base font-semibold text-text-primary">
        {title}
      </h3>
      <p className="mt-1 font-mono text-[13px] text-text-muted">{target}</p>

      {/* Custom Content (e.g. Email Headers) */}
      {children && <div className="mt-5">{children}</div>}

      {/* Divider */}
      <div className="my-5 border-t border-dashed border-[rgba(255,255,255,0.06)] [data-theme='light']_&:border-[rgba(0,0,0,0.08)]" />

      {/* AI Explanation */}
      <div className="rounded-lg border-l-2 border-primary bg-primary-dim px-4 py-3">
        <p className="text-[15px] italic text-text-primary">{aiExplanation}</p>
      </div>

      {/* Explainable AI / Detection Signals (Phase 8 #2) */}
      {rawResult && (rawResult.raw_ports || rawResult.threat_name || rawResult.spf_status || rawResult.verdict) && (
        <div className="mt-4">
          <button
            onClick={() => setShowSignals(!showSignals)}
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors focus:outline-none"
          >
            {showSignals ? "Hide Detection Signals ▴" : "Show Detection Signals ▾"}
          </button>
          
          {showSignals && (
            <div className="mt-2.5 rounded-lg border border-border bg-bg-card p-4 space-y-3 font-mono text-xs text-text-secondary">
              <p className="font-bold text-text-primary text-[11px] uppercase tracking-wide">Structured Indicators:</p>
              
              {rawResult.threat_name && (
                <div>
                  <span className="text-risk-critical">Malware Signature:</span> {rawResult.threat_name}
                  {rawResult.threat_type && <span className="block text-text-muted">Type: {rawResult.threat_type}</span>}
                </div>
              )}

              {rawResult.raw_ports && rawResult.raw_ports.length > 0 && (
                <div>
                  <span className="text-text-primary">Open Ports List:</span>
                  <div className="mt-1 divide-y divide-border/40 max-h-[120px] overflow-y-auto">
                    {rawResult.raw_ports.map((p: any, idx: number) => (
                      <div key={idx} className="py-1 flex justify-between gap-4">
                        <span>Port {p.port} ({p.service})</span>
                        <span className={cn(
                          p.risk === "Critical" || p.risk === "High" ? "text-risk-critical" : "text-risk-safe"
                        )}>{p.risk} Risk</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(rawResult.spf_status || rawResult.dkim_status || rawResult.dmarc_status) && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="border border-border/40 p-2 rounded bg-bg-main/50">
                    <span className="block text-[10px] text-text-muted">SPF</span>
                    <span className={cn("font-bold", rawResult.spf_status === "FAIL" ? "text-risk-critical" : "text-risk-safe")}>
                      {rawResult.spf_status || "NONE"}
                    </span>
                  </div>
                  <div className="border border-border/40 p-2 rounded bg-bg-main/50">
                    <span className="block text-[10px] text-text-muted">DKIM</span>
                    <span className={cn("font-bold", rawResult.dkim_status === "FAIL" ? "text-risk-critical" : "text-risk-safe")}>
                      {rawResult.dkim_status || "NONE"}
                    </span>
                  </div>
                  <div className="border border-border/40 p-2 rounded bg-bg-main/50">
                    <span className="block text-[10px] text-text-muted">DMARC</span>
                    <span className={cn("font-bold", rawResult.dmarc_status === "FAIL" ? "text-risk-critical" : "text-risk-safe")}>
                      {rawResult.dmarc_status || "NONE"}
                    </span>
                  </div>
                </div>
              )}

              {rawResult.tool && (
                <div className="text-[10px] text-text-muted pt-2 border-t border-border/20 flex justify-between">
                  <span>Engine: {rawResult.tool}</span>
                  {rawResult.severity && <span>Severity: {rawResult.severity}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="my-5 border-t border-dashed border-[rgba(255,255,255,0.06)] [data-theme='light']_&:border-[rgba(0,0,0,0.08)]" />

      {/* Actions */}
      {actions.length > 0 && (
        <>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted">
            What To Do Now
          </p>
          <ul className="space-y-2">
            {actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-border text-[11px] font-bold text-text-muted">
                  {i + 1}
                </span>
                <span className="mt-0.5">{action}</span>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-5 border-t border-dashed border-[rgba(255,255,255,0.06)] [data-theme='light']_&:border-[rgba(0,0,0,0.08)]" />
        </>
      )}

      {/* AI Chat Interface */}
      <div className="rounded-xl border border-primary/20 bg-primary-dim/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="font-display text-sm font-semibold text-text-primary">
            Ask AI to clarify
          </h4>
        </div>

        {chatMessages.length > 0 && (
          <div className="mb-4 flex max-h-[200px] flex-col gap-3 overflow-y-auto">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-[13px]",
                  msg.role === "user"
                    ? "self-end bg-bg-main text-text-secondary border border-border"
                    : "self-start bg-primary/10 text-text-primary"
                )}
              >
                {msg.content}
              </div>
            ))}
            {isAiTyping && (
              <div className="self-start rounded-lg bg-primary/10 px-3 py-2 text-[13px] text-text-primary">
                <span className="animate-pulse">Thinking...</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleAskAI} className="relative">
          <input
            type="text"
            placeholder="What does this mean?"
            className="w-full rounded-lg border border-border bg-bg-main py-2.5 pl-3 pr-10 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isAiTyping}
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isAiTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-primary transition-colors hover:bg-primary/10 hover:text-primary-hover disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="my-5 border-t border-dashed border-[rgba(255,255,255,0.06)] [data-theme='light']_&:border-[rgba(0,0,0,0.08)]" />

      {/* Reset Button */}
      <Button variant="ghost" fullWidth onClick={onReset}>
        {resetLabel}
      </Button>
    </div>
  );
}
