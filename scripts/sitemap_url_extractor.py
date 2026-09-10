"""Extrai recursivamente todas as URLs de um sitemap XML (incluindo sitemap index).

Uso:
    python sitemap_url_extractor.py --url https://exemplo.com.br/sitemap.xml
    python sitemap_url_extractor.py --url https://exemplo.com.br/sitemap.xml --output urls.csv --format csv
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass

import requests

SITEMAP_NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
REQUEST_TIMEOUT = 15
USER_AGENT = "seo-toolkit-sitemap-extractor/1.0 (+https://github.com/GustavoTozzo)"


@dataclass
class SitemapResult:
    urls: list[str]
    errors: list[str]


def extract_sitemap_urls(
    sitemap_url: str,
    *,
    session: requests.Session | None = None,
    _visited: set[str] | None = None,
) -> SitemapResult:
    """Busca um sitemap (ou sitemap index) e retorna todas as URLs de página encontradas.

    Sitemaps index (que apontam para outros sitemaps) são seguidos recursivamente.
    `_visited` evita loops infinitos em sitemaps mal configurados que se referenciam entre si.
    """
    session = session or requests.Session()
    visited = _visited if _visited is not None else set()

    if sitemap_url in visited:
        return SitemapResult(urls=[], errors=[])
    visited.add(sitemap_url)

    urls: list[str] = []
    errors: list[str] = []

    try:
        response = session.get(
            sitemap_url,
            headers={"User-Agent": USER_AGENT},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        root = ET.fromstring(response.content)
    except requests.RequestException as exc:
        return SitemapResult(urls=[], errors=[f"Erro ao buscar {sitemap_url}: {exc}"])
    except ET.ParseError as exc:
        return SitemapResult(urls=[], errors=[f"Erro ao interpretar XML de {sitemap_url}: {exc}"])

    for child in root:
        loc = child.find(f"{SITEMAP_NS}loc")
        if loc is None or not loc.text:
            continue
        loc_text = loc.text.strip()

        if child.tag.endswith("sitemap"):
            nested = extract_sitemap_urls(loc_text, session=session, _visited=visited)
            urls.extend(nested.urls)
            errors.extend(nested.errors)
        elif child.tag.endswith("url"):
            urls.append(loc_text)

    return SitemapResult(urls=urls, errors=errors)


def _write_output(urls: list[str], output_path: str, fmt: str) -> None:
    if fmt == "csv":
        with open(output_path, "w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)
            writer.writerow(["URL"])
            writer.writerows([[url] for url in urls])
    else:
        with open(output_path, "w", encoding="utf-8") as file:
            json.dump(urls, file, ensure_ascii=False, indent=2)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True, help="URL do sitemap.xml (ou sitemap index)")
    parser.add_argument("--output", default="sitemap_urls.csv", help="Arquivo de saída")
    parser.add_argument("--format", choices=["csv", "json"], default="csv")
    args = parser.parse_args()

    result = extract_sitemap_urls(args.url)

    for error in result.errors:
        print(error, file=sys.stderr)

    _write_output(result.urls, args.output, args.format)
    print(f"{len(result.urls)} URLs extraídas. Arquivo salvo em: {args.output}")

    if not result.urls:
        sys.exit(1)


if __name__ == "__main__":
    main()
