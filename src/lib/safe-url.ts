// Guarda compartilhada pelas demos ao vivo que aceitam uma URL do visitante e buscam
// esse endereço a partir do servidor — bloqueia alvos óbvios de SSRF (localhost, IPs
// privados/link-local) e exige http(s).

export const DEMO_USER_AGENT = "seo-toolkit-demo/1.0 (+https://github.com/GustavoTozzo)";

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

export function parsePublicUrl(raw: unknown): URL | null {
  if (typeof raw !== "string") return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (isBlockedHost(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}
