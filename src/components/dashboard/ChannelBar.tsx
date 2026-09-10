"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useColorMode } from "@/lib/use-color-mode";
import { CHART_THEME, categorical } from "@/lib/chart-colors";
import type { ChannelRow } from "@/lib/mock-seo-data";

export default function ChannelBar({ data }: { data: ChannelRow[] }) {
  const mode = useColorMode();
  const theme = CHART_THEME[mode];
  const colors = categorical(mode);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium">Sessões por canal de aquisição (GA4, simulado)</p>
      <div className="mt-3 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={theme.gridline} />
            <XAxis dataKey="channel" tick={{ fill: theme.muted, fontSize: 11 }} axisLine={{ stroke: theme.baseline }} tickLine={false} />
            <YAxis tick={{ fill: theme.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              cursor={{ fill: theme.gridline }}
              contentStyle={{
                background: theme.surface,
                border: `1px solid ${theme.gridline}`,
                borderRadius: 8,
                fontSize: 12,
                color: theme.textPrimary,
              }}
              formatter={(value) => [Number(value).toLocaleString("pt-BR"), "Sessões"]}
            />
            <Bar dataKey="sessions" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((entry, i) => (
                <Cell key={entry.channel} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
