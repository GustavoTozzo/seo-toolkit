"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useColorMode } from "@/lib/use-color-mode";
import { CHART_THEME, categorical } from "@/lib/chart-colors";

type Props = {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  label: string;
  formatValue?: (value: number) => string;
  seriesIndex?: number;
};

export default function LineTrend({ data, xKey, yKey, label, formatValue, seriesIndex = 0 }: Props) {
  const mode = useColorMode();
  const theme = CHART_THEME[mode];
  const color = categorical(mode)[seriesIndex];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-3 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={theme.gridline} strokeDasharray="0" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: theme.muted, fontSize: 11 }}
              axisLine={{ stroke: theme.baseline }}
              tickLine={false}
              minTickGap={32}
            />
            <YAxis
              tick={{ fill: theme.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v: number) => (formatValue ? formatValue(v) : String(v))}
            />
            <Tooltip
              cursor={{ stroke: theme.baseline, strokeWidth: 1 }}
              contentStyle={{
                background: theme.surface,
                border: `1px solid ${theme.gridline}`,
                borderRadius: 8,
                fontSize: 12,
                color: theme.textPrimary,
              }}
              formatter={(value) => [formatValue ? formatValue(Number(value)) : Number(value), label]}
            />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
