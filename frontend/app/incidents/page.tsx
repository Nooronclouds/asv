"use client";

import * as React from "react";
import { AppLayout, TopBar, Card, Button, RiskBadge } from "@/components/cyber";
import { API_URL } from "@/lib/config";
import { AlertCircle, ShieldAlert, CheckCircle, Clock, User, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface Incident {
  id: number;
  title: string;
  severity: string;
  status: string;
  assigned_analyst: string;
  mitre_mapping: { tactic: string; technique: string; sub_technique: string; confidence: string };
  affected_assets: string[];
  recommendations: string[];
  created_at: string;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = React.useState<Incident[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedIncident, setSelectedIncident] = React.useState<Incident | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    async function fetchIncidents() {
      const token = localStorage.getItem("cyberguard-token") || "";
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/v1/incidents`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIncidents(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchIncidents();
  }, [router]);

  const handleUpdateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("cyberguard-token") || "";
    try {
      const res = await fetch(`${API_URL}/api/v1/incidents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status } : inc));
        if (selectedIncident?.id === id) {
          setSelectedIncident(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-background">
        <TopBar title="Incident Management" />
        <main className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold font-display text-text-primary flex items-center gap-2">
                <AlertCircle className="text-primary" /> Active Alerts & Incidents
              </h2>
              {loading ? (
                <div className="text-center py-12 text-text-muted">Loading incidents...</div>
              ) : incidents.length === 0 ? (
                <Card className="p-6 text-center text-text-muted">
                  No incidents detected. System is running cleanly.
                </Card>
              ) : (
                incidents.map(inc => (
                  <Card
                    key={inc.id}
                    className={`p-4 cursor-pointer hover:border-primary transition-colors ${selectedIncident?.id === inc.id ? "border-primary" : ""}`}
                    onClick={() => setSelectedIncident(inc)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-text-primary">{inc.title}</h3>
                        <div className="flex gap-2 items-center mt-2 text-sm text-text-muted">
                          <span>ID: {inc.id}</span>
                          <span>•</span>
                          <span>{new Date(inc.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <RiskBadge severity={inc.severity as any} />
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${inc.status === "Closed" ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary"}`}>
                          {inc.status}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div>
              {selectedIncident ? (
                <Card className="p-6 space-y-6 border-primary/40 bg-surface-dark">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{selectedIncident.title}</h3>
                    <div className="mt-2 flex justify-between items-center">
                      <RiskBadge severity={selectedIncident.severity as any} />
                      <select
                        value={selectedIncident.status}
                        onChange={(e) => handleUpdateStatus(selectedIncident.id, e.target.value)}
                        className="bg-background-dark border border-primary/20 text-text-primary text-sm rounded p-1 outline-none"
                      >
                        <option value="Open">Open</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Contained">Contained</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-primary/10 pt-4">
                    <h4 className="font-semibold text-sm text-text-primary">MITRE ATT&CK Tactic Map</h4>
                    {selectedIncident.mitre_mapping && selectedIncident.mitre_mapping.tactic !== "Reconnaissance" ? (
                      <div className="p-3 rounded bg-primary/5 border border-primary/10 space-y-1">
                        <div className="text-sm font-bold text-primary">{selectedIncident.mitre_mapping.tactic}</div>
                        <div className="text-xs text-text-muted">Technique: {selectedIncident.mitre_mapping.technique} ({selectedIncident.mitre_mapping.sub_technique})</div>
                      </div>
                    ) : (
                      <div className="text-sm text-text-muted">No tactic mapping generated.</div>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-primary/10 pt-4">
                    <h4 className="font-semibold text-sm text-text-primary">Affected Assets</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedIncident.affected_assets.map((asset, index) => (
                        <span key={index} className="px-2 py-1 rounded bg-background-dark text-xs border border-primary/10 text-text-primary">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-primary/10 pt-4">
                    <h4 className="font-semibold text-sm text-text-primary">Containment Recommendations</h4>
                    <ul className="list-disc list-inside text-sm text-text-muted space-y-1">
                      {selectedIncident.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 text-center text-text-muted border-dashed">
                  Select an incident to view details, timelines, assets, and MITRE maps.
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
