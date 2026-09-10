"use client";

import StatTile from "@/components/dashboard/StatTile";
import LineTrend from "@/components/dashboard/LineTrend";
import WeeklyBar from "@/components/dashboard/WeeklyBar";
import ChannelBar from "@/components/dashboard/ChannelBar";
import CoverageBar from "@/components/dashboard/CoverageBar";
import DataTable from "@/components/dashboard/DataTable";
import {
  channelSessions,
  coverage,
  dailySeries,
  kpiDeltas,
  kpis,
  topPages,
  topQueries,
  weeklyRevenue,
} from "@/lib/mock-seo-data";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const compact = (v: number) => v.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const percent = (v: number) => `${v}%`;

export default function DashboardContent() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <strong>Dados fictícios.</strong> Este dashboard não está conectado a nenhum Google
        Search Console ou GA4 real — os números abaixo são gerados aleatoriamente (com seed
        fixa) só para ilustrar como um painel de SEO ficaria com dados de verdade.
      </div>

      <div className="mt-8 max-w-2xl">
        <p className="font-mono text-sm text-accent">Demonstração</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard de SEO + GA4</h1>
        <p className="mt-4 leading-relaxed text-muted">
          Cliques e impressões vindos de um Search Console simulado, receita e canais de
          aquisição de um GA4 simulado — o tipo de painel que centralizaria o
          acompanhamento de SEO de um site real.
        </p>
      </div>

      <section className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Cliques (90d)" value={compact(kpis.totalClicks)} delta={kpiDeltas.totalClicks} />
        <StatTile label="Impressões (90d)" value={compact(kpis.totalImpressions)} delta={kpiDeltas.totalImpressions} />
        <StatTile label="CTR médio" value={`${kpis.avgCtr}%`} delta={kpiDeltas.avgCtr} />
        <StatTile
          label="Posição média"
          value={kpis.avgPosition.toString()}
          delta={kpiDeltas.avgPosition}
          deltaGoodDirection="down"
        />
        <StatTile label="Páginas indexadas" value={kpis.indexedPages.toLocaleString("pt-BR")} delta={kpiDeltas.indexedPages} />
        <StatTile label="Receita (GA4)" value={currency(kpis.totalRevenue)} delta={kpiDeltas.totalRevenue} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <LineTrend data={dailySeries} xKey="date" yKey="clicks" label="Cliques por dia" seriesIndex={0} />
        <LineTrend
          data={dailySeries}
          xKey="date"
          yKey="impressions"
          label="Impressões por dia"
          seriesIndex={1}
          formatValue={compact}
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <LineTrend data={dailySeries} xKey="date" yKey="ctr" label="CTR por dia (%)" seriesIndex={2} formatValue={percent} />
        <LineTrend data={dailySeries} xKey="date" yKey="position" label="Posição média por dia" seriesIndex={3} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <WeeklyBar data={weeklyRevenue} />
        <ChannelBar data={channelSessions} />
      </section>

      <section className="mt-4">
        <CoverageBar data={coverage} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <DataTable
          title="Principais palavras-chave"
          rows={topQueries}
          columns={[
            { key: "query", label: "Query" },
            { key: "clicks", label: "Cliques", align: "right" },
            { key: "impressions", label: "Impressões", align: "right", format: (v) => compact(v as number) },
            { key: "ctr", label: "CTR", align: "right", format: (v) => percent(v as number) },
            { key: "position", label: "Posição", align: "right" },
          ]}
        />
        <DataTable
          title="Páginas com mais cliques"
          rows={topPages}
          columns={[
            { key: "page", label: "Página" },
            { key: "clicks", label: "Cliques", align: "right" },
            { key: "impressions", label: "Impressões", align: "right", format: (v) => compact(v as number) },
            { key: "ctr", label: "CTR", align: "right", format: (v) => percent(v as number) },
            { key: "position", label: "Posição", align: "right" },
          ]}
        />
      </section>
    </div>
  );
}
