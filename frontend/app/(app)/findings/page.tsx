import FindingsView from "@/components/asv/FindingsView";
import { getFindings } from "@/lib/asv/data";

export default async function FindingsPage() {
  const findings = await getFindings();
  return (
    <>
      <div className="eyebrow">Triage · ranked worst-first</div>
      <h2 className="screen">Findings</h2>
      <p className="screen-sub">
        Every exposure the last scan flagged, with a plain-language reason. Click a row to read why it matters.
      </p>
      <FindingsView findings={findings} />
    </>
  );
}
