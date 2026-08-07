"use client";

import * as React from "react";
import { AppLayout, TopBar, Card, RiskBadge } from "@/components/cyber";
import { API_URL } from "@/lib/config";
import { Server, Monitor, Shield, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface Asset {
  id: number;
  hostname: string;
  ip_address: string;
  operating_system: string;
  open_ports: number[];
  last_scan: string;
  criticality: string;
  owner: string;
  department: string;
  status: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    async function fetchAssets() {
      const token = localStorage.getItem("cyberguard-token") || "";
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/v1/assets`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAssets(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, [router]);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-background">
        <TopBar title="Asset Inventory" />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold font-display text-text-primary flex items-center gap-2">
              <Server className="text-primary" /> Managed Security Assets
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-text-muted">Loading asset inventory...</div>
          ) : assets.length === 0 ? (
            <Card className="p-6 text-center text-text-muted">
              No assets cataloged. Assets are auto-populated after Nmap network scans.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map(asset => (
                <Card key={asset.id} className="p-6 space-y-4 hover:border-primary/60 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <Monitor className="text-primary" size={24} />
                      <div>
                        <h3 className="font-bold text-text-primary">{asset.hostname}</h3>
                        <span className="text-sm text-text-muted">{asset.ip_address}</span>
                      </div>
                    </div>
                    <RiskBadge severity={asset.criticality as any} />
                  </div>

                  <div className="border-t border-primary/10 pt-4 grid grid-cols-2 gap-2 text-xs text-text-muted">
                    <div>
                      <span className="block font-semibold text-text-primary">OS</span>
                      {asset.operating_system}
                    </div>
                    <div>
                      <span className="block font-semibold text-text-primary">Owner</span>
                      {asset.owner}
                    </div>
                    <div>
                      <span className="block font-semibold text-text-primary">Department</span>
                      {asset.department}
                    </div>
                    <div>
                      <span className="block font-semibold text-text-primary">Status</span>
                      <span className="text-emerald-400 font-semibold">{asset.status}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
