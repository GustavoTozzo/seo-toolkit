"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useColorMode } from "@/lib/use-color-mode";
import { CHART_THEME, categorical } from "@/lib/chart-colors";
import type { WeekRevenue } from "@/lib/mock-seo-data";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function WeeklyBar({ data }: { data: WeekRevenue[] }) {
  const mode = useColorMode();
  const theme = CHART_THEME[mode];
  const color = categorical(mode)[0];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium">Receita por semana (GA4, simulado)</p>
      <div className="mt-3 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={theme.gridline} />
            <XAxis dataKey="week" tick={{ fill: theme.muted, fontSize: 11 }} axisLine={{ stroke: theme.baseline }} tickLine={false} />
            <YAxis
              tick={{ fill: theme.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v: number) => currency(v)}
            />
            <Tooltip
              cursor={{ fill: theme.gridline }}
              contentStyle={{
                background: theme.surface,
                border: `1px solid ${theme.gridline}`,
                borderRadius: 8,
                fontSize: 12,
                color: theme.textPrimary,
              }}
              formatter={(value) => [currency(Number(value)), "Receita"]}
            />
            <Bar dataKey="revenue" fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
