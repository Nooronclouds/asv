"use client";

import * as React from "react";
import { AppLayout, TopBar, Card, Button, RiskBadge, RiskDot, PostureChart } from "@/components/cyber";
import type { Severity } from "@/components/cyber/result-card";
import { API_URL } from "@/lib/config";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Link2,
  Shield,
  CreditCard,
  ArrowRight,
  ChevronRight,
  Clock,
  Info
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface RecentScan {
  target: string;
  type: "Phishing" | "File Scan" | "UPI Check" | "Network Scan" | "Email Analysis";
  time: string;
  severity: Severity;
}

const mockRecentScans: RecentScan[] = [
  { target: "paytm-secure.xyz", type: "Phishing", time: "14:22", severity: "Critical" },
  { target: "SERVER_RACK_04.exe", type: "File Scan", time: "12:05", severity: "Low" },
  { target: "MerchantID_7712@ybl", type: "UPI Check", time: "09:45", severity: "Medium" },
];

const riskConfig = {
  None: {
    icon: CheckCircle2,
    label: "✓ SECURE POSTURE",
    subtitle: "All checked systems clear",
    borderClass: "border-l-blue-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    textColor: "text-blue-500",
    barGradient: "from-blue-500 to-blue-500",
  },
  Low: {
    icon: CheckCircle2,
    label: "✓ ALL SYSTEMS CLEAR",
    subtitle: "Low risks detected",
    borderClass: "border-l-blue-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    textColor: "text-blue-500",
    barGradient: "from-blue-500 to-blue-500",
  },
  Medium: {
    icon: AlertTriangle,
    label: "⚠ MODERATE RISK",
    subtitle: "Some threats need attention",
    borderClass: "border-l-yellow-500",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-500",
    textColor: "text-yellow-500",
    barGradient: "from-blue-500 to-yellow-500",
  },
  High: {
    icon: ShieldAlert,
    label: "🔴 HIGH RISK",
    subtitle: "High threats detected",
    borderClass: "border-l-orange-500",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
    textColor: "text-orange-500",
    barGradient: "from-yellow-500 to-orange-500",
  },
  Critical: {
    icon: ShieldAlert,
    label: "🔴 CRITICAL RISK",
    subtitle: "Critical threats found",
    borderClass: "border-l-risk-critical",
    iconBg: "bg-risk-critical-dim",
    iconColor: "text-risk-critical",
    textColor: "text-risk-critical",
    barGradient: "from-yellow-500 to-risk-critical",
  },
};

const THREATS_OF_THE_DAY = [
  "Phishing attacks in India rose by over 40% last year. Always verify URLs before entering credentials.",
  "Ransomware attacks often start with a simple phishing email. Train your employees to spot them.",
  "UPI Fraud is the fastest-growing cybercrime in India. Never share your PIN to receive money.",
  "Outdated software causes 60% of all data breaches. Keep your systems updated.",
  "Using the same password across multiple sites makes you 5x more likely to be hacked.",
  "Most malicious links use look-alike domains (e.g. hdfc-secure.com instead of hdfcbank.com).",
  "A firewall alone isn't enough to protect against modern ransomware.",
  "Over 70% of SME owners who suffer a major data breach go out of business within a year.",
  "Always check the 'From' email address carefully. Display names are easily faked.",
  "Open RDP (Remote Desktop) ports are the #1 entry point for ransomware gangs.",
  "Self-signed SSL certificates are a major red flag for newly registered phishing domains.",
  "Multi-Factor Authentication (MFA) blocks 99.9% of automated account hacking attempts.",
  "Cyber attackers use AI to write perfect, typo-free phishing emails that look incredibly real.",
  "Fake customer care numbers on Google searches are a common way scammers steal OTPs.",
  "Regular backups are your only true defense against a successful ransomware attack."
];

export default function DashboardPage() {
  const router = useRouter();
  const [threatOfDay, setThreatOfDay] = React.useState("");
  
  const [stats, setStats] = React.useState({
    totalDevices: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    criticalRisk: 0,
    threatsFound: 0,
    scansClean: 0,
    alertsActive: 0,
    riskScore: 100,
    overallRisk: "None" as "None" | "Low" | "Medium" | "High" | "Critical"
  });
  const [recentScans, setRecentScans] = React.useState<RecentScan[]>([]);
  const [chartData, setChartData] = React.useState<{ date: string; score: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const day = new Date().getDate();
    setThreatOfDay(THREATS_OF_THE_DAY[day % THREATS_OF_THE_DAY.length]);
  }, []);

  React.useEffect(() => {
    async function loadDashboard() {
      const backendUrl = API_URL;
      const token = localStorage.getItem("cyberguard-token") || "";

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // 1. Fetch Summary
        const resSummary = await fetch(`${backendUrl}/dashboard-summary`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!resSummary.ok) {
          if (resSummary.status === 401) {
            throw new Error("Session expired");
          }
          throw new Error("API Offline");
        }
        const summary = await resSummary.json();

        // 2. Fetch History
        const resHistory = await fetch(`${backendUrl}/scan-history`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!resHistory.ok) throw new Error();
        const historyData = await resHistory.json();

        // Map recent scans
        const scans = historyData.slice(-3).reverse().map((item: any) => {
          let verdict = "CLEAN";
          try {
            const cleanJsonStr = item.result
              .replace(/'/g, '"')
              .replace(/None/g, 'null')
              .replace(/True/g, 'true')
              .replace(/False/g, 'false');
            const parsed = JSON.parse(cleanJsonStr);
            verdict = parsed.verdict || "CLEAN";
          } catch(e) {}
          
          let severity: Severity = "None";
          if (verdict === "DANGEROUS" || verdict === "INFECTED" || verdict === "PHISHING") severity = "Critical";
          else if (verdict === "SUSPICIOUS") severity = "Medium";
          
          return {
            target: item.target,
            type: item.scan_type,
            time: "Recently",
            severity
          };
        });

        // Generate chart data (rolling average score)
        let rollingScore = 100;
        const chartPoints = historyData.map((item: any, idx: number) => {
          let scoreVal = 100;
          if (item.result.includes("DANGEROUS") || item.result.includes("INFECTED") || item.result.includes("PHISHING")) {
            scoreVal = 10;
          } else if (item.result.includes("SUSPICIOUS")) {
            scoreVal = 50;
          }
          rollingScore = Math.round((rollingScore * idx + scoreVal) / (idx + 1));
          return {
            date: `Scan #${idx + 1}`,
            score: rollingScore
          };
        });

        let computedRisk: "None" | "Low" | "Medium" | "High" | "Critical" = "None";
        if (rollingScore < 40) computedRisk = "Critical";
        else if (rollingScore < 65) computedRisk = "High";
        else if (rollingScore < 85) computedRisk = "Medium";
        else if (rollingScore < 100) computedRisk = "Low";

        setStats({
          totalDevices: summary.total_devices || 0,
          highRisk: summary.high_risk || 0,
          mediumRisk: summary.medium_risk || 0,
          lowRisk: summary.low_risk || 0,
          criticalRisk: summary.critical_risk || 0,
          threatsFound: summary.high_risk + summary.critical_risk,
          scansClean: summary.low_risk,
          alertsActive: summary.high_risk + summary.critical_risk,
          riskScore: rollingScore,
          overallRisk: computedRisk
        });
        setRecentScans(scans);
        setChartData(chartPoints);
      } catch (err) {
        console.warn("Unauthorized or backend offline, redirecting to login", err);
        localStorage.removeItem("cyberguard-token");
        localStorage.removeItem("cyberguard-user");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <AppLayout waveIntensity="low">
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-text-muted">Loading security credentials...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const config = riskConfig[stats.overallRisk];
  const Icon = config.icon;

  return (
    <AppLayout waveIntensity="low">
      <div className="mx-auto max-w-[860px]">
        <TopBar
          title="Security Dashboard"
          subtitle="Your business protection overview"
        />

        {/* Threat of the Day Banner */}
        {threatOfDay && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary-dim/30 px-5 py-4 flex items-start gap-3 shadow-[0_2px_10px_rgba(0,255,65,0.05)]">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Threat of the Day</p>
              <p className="text-sm text-text-primary/90">{threatOfDay}</p>
            </div>
          </div>
        )}

        {/* Hero Card */}
        <Card className={cn("mb-8 border-l-[3px]", config.borderClass)}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl", config.iconBg)}>
                <Icon className={cn("h-[22px] w-[22px]", config.iconColor)} />
              </div>
              <div>
                <h2 className={cn("font-display text-lg font-bold", config.textColor)}>
                  {config.label}
                </h2>
                <p className="text-[13px] text-text-muted">
                  {config.subtitle}
                </p>
              </div>
            </div>
            <Link href="/phishing">
              <Button variant="ghost" size="sm">
                Run New Scan <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Risk Bar */}
          <div className="mt-6">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bg-card-hover">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", config.barGradient)}
                style={{ width: `${stats.riskScore}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-[11px] text-text-muted">
              Security Score: {stats.riskScore}%
            </p>
          </div>

          <div className="my-5 border-t border-dashed border-[rgba(255,255,255,0.06)]" />

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display text-2xl font-bold text-risk-critical">
                {stats.threatsFound}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Threats Found
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-risk-safe">
                {stats.scansClean}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Scans Clean
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-yellow-500">
                {stats.alertsActive}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Alerts Active
              </p>
            </div>
          </div>

          <div className="my-5 border-t border-dashed border-[rgba(255,255,255,0.06)]" />

          {/* Security Posture History Chart */}
          <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">Rolling Security Posture Trend</p>
          <PostureChart data={chartData} />

          <div className="my-5 border-t border-dashed border-[rgba(255,255,255,0.06)]" />

          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Clock className="h-3.5 w-3.5" />
            <span>Updates dynamically based on all historical scan modules.</span>
          </div>
        </Card>

        {/* Quick Actions */}
        <p className="section-tag mb-4">Quick Actions</p>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: Link2,
              title: "Phishing Checker",
              description: "Check suspicious links and emails",
              href: "/phishing",
              btnLabel: "Analyze →",
            },
            {
              icon: Shield,
              title: "Ransomware Scanner",
              description: "Scan files and check exposed ports",
              href: "/ransomware",
              btnLabel: "Scan →",
            },
            {
              icon: CreditCard,
              title: "UPI Verifier",
              description: "Verify payment handles before paying",
              href: "/upi",
              btnLabel: "Verify →",
            },
          ].map((item) => {
            const ItemIcon = item.icon;
            return (
              <Card key={item.title} className="flex flex-col">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary-dim">
                  <ItemIcon className="h-[18px] w-[18px] text-primary" />
                </div>
                <h3 className="font-display text-[15px] font-semibold text-text-primary">
                  {item.title}
                </h3>
                <p className="mt-1 flex-1 text-xs text-text-secondary">
                  {item.description}
                </p>
                <Link href={item.href} className="mt-4">
                  <Button variant="ghost" size="sm" fullWidth>
                    {item.btnLabel}
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <p className="section-tag mb-4">Recent Activity</p>
        {recentScans.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-border bg-bg-card/20">
            <p className="text-sm text-text-muted mb-2">No scan activity logged yet.</p>
            <p className="text-xs text-text-muted">Perform any scan check to build your posture overview.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-border p-0 overflow-hidden">
            {recentScans.map((scan, i) => (
              <Link
                key={i}
                href="/reports"
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-bg-card-hover"
              >
                <RiskDot severity={scan.severity} />
                <span className="flex-1 truncate font-mono text-sm text-text-primary">
                  {scan.target}
                </span>
                <span className="hidden text-xs text-text-muted sm:inline">
                  {scan.type}
                </span>
                <span className="text-xs text-text-muted">{scan.time}</span>
                <RiskBadge severity={scan.severity} />
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </Link>
            ))}
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
