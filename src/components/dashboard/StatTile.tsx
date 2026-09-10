type StatTileProps = {
  label: string;
  value: string;
  delta?: number;
  deltaGoodDirection?: "up" | "down";
};

export default function StatTile({ label, value, delta, deltaGoodDirection = "up" }: StatTileProps) {
  const isGood = delta === undefined ? null : deltaGoodDirection === "up" ? delta >= 0 : delta <= 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {delta !== undefined && (
        <p
          className="mt-1 flex items-center gap-1 text-xs font-medium tabular-nums"
          style={{ color: isGood ? "var(--stat-good)" : "var(--stat-critical)" }}
        >
          <span aria-hidden>{delta >= 0 ? "▲" : "▼"}</span>
          {Math.abs(delta).toFixed(1)}% vs. período anterior
        </p>
      )}
    </div>
  );
}
