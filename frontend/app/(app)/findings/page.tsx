"use client";

import FindingsView from "@/components/asv/FindingsView";
import { EmptyState, ErrorState, Loading } from "@/components/asv/States";
import { apiGetFindings } from "@/lib/asv/api";
import { useResource } from "@/lib/asv/useResource";

export default function FindingsPage() {
  const { data, loading, error } = useResource(apiGetFindings);

  return (
    <>
      <div className="eyebrow">Triage · ranked worst-first</div>
      <h2 className="screen">Findings</h2>
      <p className="screen-sub">
        Every exposure the last scan flagged, with a plain-language reason. Click a row to read why it matters.
      </p>

      {loading && <Loading label="LOADING FINDINGS" />}
      {error && <ErrorState msg={error} />}
      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          title="NO FINDINGS"
          hint="Either nothing has been scanned yet, or the last scan surfaced no exposures worth flagging. Run a scan to check your surface."
          ctaHref="/scan"
          ctaLabel="Run a scan"
        />
      )}
      {!loading && !error && data && data.length > 0 && <FindingsView findings={data} />}
    </>
  );
}
