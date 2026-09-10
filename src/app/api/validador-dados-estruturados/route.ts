import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { DEMO_USER_AGENT, parsePublicUrl } from "@/lib/safe-url";
import { SCHEMA_RULES, evaluateBlock, iterSchemaObjects, type SchemaBlockResult } from "@/lib/structured-data";

export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = 10_000;

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let html: string;
  try {
    const response = await fetch(target.toString(), {
      headers: { "User-Agent": DEMO_USER_AGENT },
      signal: controller.signal,
    });
    if (!response.ok) {
      return NextResponse.json({ url: target.toString(), error: `A página respondeu HTTP ${response.status}` });
    }
    html = await response.text();
  } catch (exc) {
    return NextResponse.json({
      url: target.toString(),
      error: `Erro na requisição: ${exc instanceof Error ? exc.message : "desconhecido"}`,
    });
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);
  const blocks: SchemaBlockResult[] = [];
  const parseErrors: string[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw || !raw.trim()) return;
    try {
      const payload = JSON.parse(raw);
      for (const obj of iterSchemaObjects(payload)) {
        if (obj && typeof obj === "object" && "@type" in obj) {
          blocks.push(evaluateBlock(obj as Record<string, unknown>));
        }
      }
    } catch (exc) {
      parseErrors.push(`JSON inválido: ${exc instanceof Error ? exc.message : "erro desconhecido"}`);
    }
  });

  const hasErrors = parseErrors.length > 0 || blocks.some((b) => b.status === "Erro");
  const hasWarnings = blocks.some((b) => b.status === "Atenção");
  const status =
    blocks.length === 0 && parseErrors.length === 0
      ? "Nenhum dado estruturado encontrado"
      : hasErrors
        ? "Erro"
        : hasWarnings
          ? "Atenção"
          : "OK";

  return NextResponse.json({
    url: target.toString(),
    status,
    blocks,
    parseErrors,
    coveredTypes: Object.keys(SCHEMA_RULES),
  });
}
