// Dados 100% fictícios, gerados com uma seed fixa (determinística — mesmo resultado em
// todo build/SSR, sem risco de hydration mismatch). Não representam nenhum site real:
// existem só para mostrar como um dashboard de SEO + GA4 se comportaria com dados de
// verdade. Ver o aviso na própria página do dashboard.

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260909);

export type DailyPoint = { date: string; clicks: number; impressions: number; ctr: number; position: number };
export type QueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };
export type PageRow = { page: string; clicks: number; impressions: number; ctr: number; position: number };
export type WeekRevenue = { week: string; revenue: number; transactions: number };
export type ChannelRow = { channel: string; sessions: number };
export type Coverage = { label: string; value: number; status: "good" | "warning" | "critical" };

const DAYS = 90;

function formatDate(daysAgo: number): string {
  const date = new Date("2026-09-09T00:00:00Z");
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export const dailySeries: DailyPoint[] = Array.from({ length: DAYS }, (_, i) => {
  const daysAgo = DAYS - 1 - i;
  const dayOfWeek = new Date(formatDate(daysAgo)).getUTCDay();
  const weekendDip = dayOfWeek === 0 || dayOfWeek === 6 ? 0.75 : 1;
  const trend = 1 + i / DAYS / 3; // leve crescimento ao longo do período
  const noise = 0.85 + rand() * 0.3;

  const impressions = Math.round(9000 * trend * weekendDip * noise);
  const baseCtr = 0.028 + (i / DAYS) * 0.01; // CTR melhora um pouco ao longo do tempo
  const clicks = Math.round(impressions * baseCtr * (0.85 + rand() * 0.3));
  const position = Math.max(6, 18 - (i / DAYS) * 8 + (rand() - 0.5) * 2);

  return {
    date: formatDate(daysAgo),
    clicks,
    impressions,
    ctr: Math.round((clicks / impressions) * 1000) / 10,
    position: Math.round(position * 10) / 10,
  };
});

const QUERY_TEMPLATES = [
  "comprar tênis esportivo online",
  "melhor notebook custo benefício",
  "como fazer bolo de cenoura",
  "tênis de corrida masculino",
  "receita de pão caseiro fácil",
  "notebook para trabalho remoto",
  "como escolher fone de ouvido",
  "tênis confortável para caminhada",
  "presente de aniversário criativo",
  "como organizar guarda-roupa pequeno",
  "notebook gamer barato",
  "receita de suco detox",
];

export const topQueries: QueryRow[] = QUERY_TEMPLATES.map((query, i) => {
  const impressions = Math.round(4200 * Math.pow(0.78, i) * (0.85 + rand() * 0.3));
  const ctr = 2 + rand() * 6;
  const clicks = Math.max(1, Math.round((impressions * ctr) / 100));
  const position = Math.round((3 + i * 0.8 + rand() * 2) * 10) / 10;
  return { query, clicks, impressions, ctr: Math.round(ctr * 10) / 10, position };
}).sort((a, b) => b.clicks - a.clicks);

const PAGE_TEMPLATES = [
  "/",
  "/produto/tenis-esportivo-x200",
  "/blog/como-escolher-notebook-para-trabalho",
  "/produto/notebook-14-polegadas",
  "/blog/receita-bolo-de-cenoura-cobertura-chocolate",
  "/categoria/tenis-corrida",
  "/produto/fone-de-ouvido-bluetooth",
  "/blog/como-organizar-guarda-roupa-pequeno",
  "/categoria/notebooks",
  "/sobre",
];

export const topPages: PageRow[] = PAGE_TEMPLATES.map((page, i) => {
  const impressions = Math.round(6000 * Math.pow(0.72, i) * (0.85 + rand() * 0.3));
  const ctr = 2.5 + rand() * 7;
  const clicks = Math.max(1, Math.round((impressions * ctr) / 100));
  const position = Math.round((2 + i * 0.6 + rand() * 2) * 10) / 10;
  return { page, clicks, impressions, ctr: Math.round(ctr * 10) / 10, position };
}).sort((a, b) => b.clicks - a.clicks);

const WEEKS = 13;
export const weeklyRevenue: WeekRevenue[] = Array.from({ length: WEEKS }, (_, i) => {
  const trend = 1 + i / WEEKS / 2;
  const noise = 0.8 + rand() * 0.4;
  const revenue = Math.round(18000 * trend * noise);
  const transactions = Math.round(revenue / (180 + rand() * 60));
  const weeksAgo = WEEKS - 1 - i;
  return { week: `S-${weeksAgo === 0 ? "atual" : weeksAgo}`, revenue, transactions };
});

export const channelSessions: ChannelRow[] = [
  { channel: "Orgânico", sessions: Math.round(14200 * (0.9 + rand() * 0.2)) },
  { channel: "Direto", sessions: Math.round(6100 * (0.9 + rand() * 0.2)) },
  { channel: "Pago", sessions: Math.round(4300 * (0.9 + rand() * 0.2)) },
  { channel: "Social", sessions: Math.round(2800 * (0.9 + rand() * 0.2)) },
  { channel: "Referral", sessions: Math.round(1500 * (0.9 + rand() * 0.2)) },
];

export const coverage: Coverage[] = [
  { label: "Válidas", value: 1284, status: "good" },
  { label: "Excluídas", value: 341, status: "warning" },
  { label: "Erro", value: 27, status: "critical" },
];

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export const kpis = {
  totalClicks: sum(dailySeries.map((d) => d.clicks)),
  totalImpressions: sum(dailySeries.map((d) => d.impressions)),
  avgCtr: Math.round((sum(dailySeries.map((d) => d.clicks)) / sum(dailySeries.map((d) => d.impressions))) * 1000) / 10,
  avgPosition: Math.round((sum(dailySeries.map((d) => d.position)) / dailySeries.length) * 10) / 10,
  indexedPages: coverage[0].value,
  totalRevenue: sum(weeklyRevenue.map((w) => w.revenue)),
};

// Deltas fictícios vs. período anterior, só para ilustrar o layout de stat tile.
export const kpiDeltas = {
  totalClicks: 8.2,
  totalImpressions: 5.1,
  avgCtr: 1.4,
  avgPosition: -6.7, // negativo = melhora (posição caiu, ou seja subiu no ranking)
  indexedPages: 2.3,
  totalRevenue: 11.6,
};
