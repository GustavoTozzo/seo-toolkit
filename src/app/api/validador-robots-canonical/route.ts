import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { DEMO_USER_AGENT, parsePublicUrl } from "@/lib/safe-url";
import { isAllowedByRobots } from "@/lib/robots-txt";

export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { headers: { "User-Agent": DEMO_USER_AGENT }, signal: controller.signal });
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
    return NextResponse.json({ error: "informe uma URL http(s) pública e válida" }, { status: 400 });
  }

  let robotsStatus = "robots.txt indisponível/ilegível";
  let allowed: boolean | null = null;
  try {
    const robotsResponse = await fetchWithTimeout(`${target.origin}/robots.txt`);
    if (robotsResponse.status === 404) {
      allowed = true;
      robotsStatus = "Permitido (sem robots.txt)";
    } else if (robotsResponse.ok) {
      const robotsText = await robotsResponse.text();
      allowed = isAllowedByRobots(robotsText, "*", target.pathname || "/");
      robotsStatus = allowed ? "Permitido" : "Bloqueado";
    }
  } catch {
    // mantém "indisponível/ilegível"
  }

  const issues: string[] = [];
  if (allowed === false) issues.push("Bloqueado por robots.txt");

  let pageResponse: Response;
  try {
    pageResponse = await fetchWithTimeout(target.toString());
    if (!pageResponse.ok) {
      return NextResponse.json({
        url: target.toString(),
        robotsStatus,
        error: `A página respondeu HTTP ${pageResponse.status}`,
      });
    }
  } catch (exc) {
    return NextResponse.json({
      url: target.toString(),
      robotsStatus,
      error: `Erro na requisição: ${exc instanceof Error ? exc.message : "desconhecido"}`,
    });
  }

  const xRobotsNoindex = (pageResponse.headers.get("x-robots-tag") ?? "").toLowerCase().includes("noindex");
  if (xRobotsNoindex) issues.push("Header X-Robots-Tag com noindex");

  const html = await pageResponse.text();
  const $ = cheerio.load(html);

  const canonicalHref = $('link[rel="canonical"]').attr("href") ?? null;
  let canonicalStatus = "Ausente";
  let canonicalAbsolute: string | null = null;
  if (!canonicalHref) {
    issues.push("Sem tag canonical");
  } else {
    canonicalAbsolute = new URL(canonicalHref, target).toString();
    if (canonicalAbsolute.replace(/\/$/, "") === target.toString().replace(/\/$/, "")) {
      canonicalStatus = "Autorreferente";
    } else {
      canonicalStatus = "Aponta para outra URL";
      issues.push(`Canonical aponta para: ${canonicalAbsolute}`);
    }
  }

  const metaRobotsContent = ($('meta[name="robots" i]').attr("content") ?? "").toLowerCase();
  const metaNoindex = metaRobotsContent.includes("noindex");
  if (metaNoindex) issues.push("Meta robots com noindex");

  if (allowed === false && canonicalStatus === "Autorreferente" && !metaNoindex) {
    issues.push(
      "Sinal contraditório: a página parece querer ser indexada (canonical autorreferente, sem noindex), mas está bloqueada em robots.txt"
    );
  }

  return NextResponse.json({
    url: target.toString(),
    robotsStatus,
    canonical: canonicalAbsolute,
    canonicalStatus,
    metaNoindex,
    xRobotsNoindex,
    issues,
    status: issues.length > 0 ? "Atenção" : "OK",
  });
}
