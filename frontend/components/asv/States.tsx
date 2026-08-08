import Link from "next/link";

export function Loading({ label = "LOADING" }: { label?: string }) {
  return <div className="state-line"><span className="blink">»</span> {label}…</div>;
}

export function ErrorState({ msg }: { msg: string }) {
  return (
    <div className="state-box err">
      <div className="state-title">» TRANSMISSION ERROR</div>
      <p>{msg}</p>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  hint: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="state-box ticked">
      <div className="state-title">{title}</div>
      <p>{hint}</p>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="btn" style={{ marginTop: 6 }}>▶ {ctaLabel}</Link>
      )}
    </div>
  );
}
