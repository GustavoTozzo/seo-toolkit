"use client";

import { useColorMode } from "@/lib/use-color-mode";
import { STATUS } from "@/lib/chart-colors";
import type { Coverage } from "@/lib/mock-seo-data";

const STATUS_ICON: Record<Coverage["status"], string> = { good: "●", warning: "▲", critical: "✕" };

export default function CoverageBar({ data }: { data: Coverage[] }) {
  const mode = useColorMode();
  const colors = STATUS[mode];
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium">Cobertura de indexação (Search Console, simulado)</p>

      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full">
        {data.map((d) => (
          <div
            key={d.label}
            style={{ width: `${(d.value / total) * 100}%`, backgroundColor: colors[d.status] }}
            title={`${d.label}: ${d.value}`}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span style={{ color: colors[d.status] }} aria-hidden>
              {STATUS_ICON[d.status]}
            </span>
            <span className="text-muted">{d.label}</span>
            <span className="font-medium tabular-nums">{d.value.toLocaleString("pt-BR")}</span>
            <span className="text-xs text-muted">({((d.value / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
