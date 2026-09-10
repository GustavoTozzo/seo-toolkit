import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { DEMO_USER_AGENT, parsePublicUrl } from "@/lib/safe-url";

export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_SITEMAPS_FOLLOWED = 15;
const MAX_URLS_RETURNED = 500;

const parser = new XMLParser({ ignoreAttributes: true });

async function fetchSitemap(url: string): Promise<{ urls: string[]; sitemaps: string[] } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": DEMO_USER_AGENT },
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const xml = await response.text();
    const parsed = parser.parse(xml);

    const urlset = parsed?.urlset?.url;
    const sitemapindex = parsed?.sitemapindex?.sitemap;

    const toArray = <T,>(value: T | T[] | undefined): T[] =>
      value === undefined ? [] : Array.isArray(value) ? value : [value];

    const urls = toArray(urlset)
      .map((entry: { loc?: string }) => entry?.loc)
      .filter((loc): loc is string => Boolean(loc));

    const sitemaps = toArray(sitemapindex)
      .map((entry: { loc?: string }) => entry?.loc)
      .filter((loc): loc is string => Boolean(loc));

    return { urls, sitemaps };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "corpo da requisição inválido" }, { status: 400 });
  }

  const target = parsePublicUrl(body.url);
  if (!target) {
    return NextResponse.json(
      { error: "informe uma URL http(s) pública e válida" },
      { status: 400 }
    );
  }

  const visited = new Set<string>();
  const queue = [target.toString()];
  const urls: string[] = [];
  let sitemapsFollowed = 0;

  while (queue.length > 0 && sitemapsFollowed < MAX_SITEMAPS_FOLLOWED && urls.length < MAX_URLS_RETURNED) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    sitemapsFollowed += 1;

    const result = await fetchSitemap(current);
    if (!result) continue;

    urls.push(...result.urls);
    for (const nested of result.sitemaps) {
      if (!visited.has(nested)) queue.push(nested);
    }
  }

  return NextResponse.json({
    urls: urls.slice(0, MAX_URLS_RETURNED),
    total: urls.length,
    truncated: urls.length > MAX_URLS_RETURNED,
  });
}
