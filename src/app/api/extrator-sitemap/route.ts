import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_SITEMAPS_FOLLOWED = 15;
const MAX_URLS_RETURNED = 500;
const USER_AGENT = "seo-toolkit-demo/1.0 (+https://github.com/GustavoTozzo)";

const parser = new XMLParser({ ignoreAttributes: true });

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "0.0.0.0" || lower === "::1") return true;
  if (/^127\./.test(lower)) return true;
  if (/^10\./.test(lower)) return true;
  if (/^192\.168\./.test(lower)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)) return true;
  if (/^169\.254\./.test(lower)) return true;
  return false;
}

function parseTargetUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (isBlockedHost(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

async function fetchSitemap(url: string): Promise<{ urls: string[]; sitemaps: string[] } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
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

  const target = typeof body.url === "string" ? parseTargetUrl(body.url) : null;
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
