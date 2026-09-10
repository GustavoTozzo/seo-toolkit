"""Extrai e valida os blocos JSON-LD (Schema.org) de uma ou mais páginas, checando
campos obrigatórios/recomendados para os tipos mais comuns em SEO (Product, Article,
FAQPage, BreadcrumbList, Organization, LocalBusiness, Recipe, Event, Review, VideoObject).

Não é um validador completo da especificação Schema.org (isso é o trabalho do Rich
Results Test do próprio Google) — é um checklist rápido para pegar omissões óbvias antes
de submeter para validação oficial ou publicar em produção.

Uso:
    python structured_data_validator.py --url https://exemplo.com.br/produto/123
    python structured_data_validator.py --urls-file urls.txt --output result.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import dataclass, field

import requests
from bs4 import BeautifulSoup

REQUEST_TIMEOUT = 15
USER_AGENT = "seo-toolkit-structured-data-validator/1.0 (+https://github.com/GustavoTozzo)"

# Checklist prático, não a especificação completa — cobre os tipos mais comuns em SEO de
# e-commerce/conteúdo. Campos aninhados (ex.: offers.price) são checados por presença da
# chave de topo (ex.: "offers"), não do valor aninhado.
SCHEMA_RULES: dict[str, dict[str, list[str]]] = {
    "Product": {
        "required": ["name", "image"],
        "recommended": ["description", "offers", "aggregateRating", "brand", "sku"],
    },
    "Article": {
        "required": ["headline", "image", "datePublished"],
        "recommended": ["author", "dateModified", "publisher"],
    },
    "BlogPosting": {
        "required": ["headline", "image", "datePublished"],
        "recommended": ["author", "dateModified", "publisher"],
    },
    "NewsArticle": {
        "required": ["headline", "image", "datePublished"],
        "recommended": ["author", "dateModified", "publisher"],
    },
    "FAQPage": {"required": ["mainEntity"], "recommended": []},
    "BreadcrumbList": {"required": ["itemListElement"], "recommended": []},
    "Organization": {"required": ["name", "url"], "recommended": ["logo", "sameAs", "contactPoint"]},
    "LocalBusiness": {
        "required": ["name", "address"],
        "recommended": ["telephone", "openingHoursSpecification", "geo", "priceRange"],
    },
    "Recipe": {
        "required": ["name", "image", "recipeIngredient", "recipeInstructions"],
        "recommended": ["author", "prepTime", "cookTime", "nutrition", "aggregateRating"],
    },
    "Event": {
        "required": ["name", "startDate", "location"],
        "recommended": ["endDate", "offers", "performer", "eventStatus"],
    },
    "Review": {"required": ["itemReviewed", "author", "reviewRating"], "recommended": []},
    "VideoObject": {
        "required": ["name", "description", "thumbnailUrl", "uploadDate"],
        "recommended": ["duration", "contentUrl", "embedUrl"],
    },
}


@dataclass
class SchemaBlockReport:
    schema_type: str
    covered: bool
    missing_required: list[str] = field(default_factory=list)
    missing_recommended: list[str] = field(default_factory=list)

    @property
    def status(self) -> str:
        if not self.covered:
            return "Tipo não coberto pelo checklist"
        if self.missing_required:
            return "Erro"
        if self.missing_recommended:
            return "Atenção"
        return "OK"


@dataclass
class PageReport:
    url: str
    blocks: list[SchemaBlockReport] = field(default_factory=list)
    parse_errors: list[str] = field(default_factory=list)
    fetch_error: str | None = None

    @property
    def status(self) -> str:
        if self.fetch_error:
            return "Erro"
        if not self.blocks and not self.parse_errors:
            return "Nenhum dado estruturado encontrado"
        if self.parse_errors or any(b.status == "Erro" for b in self.blocks):
            return "Erro"
        if any(b.status == "Atenção" for b in self.blocks):
            return "Atenção"
        return "OK"


def _iter_schema_objects(payload: object):
    if isinstance(payload, list):
        for item in payload:
            yield from _iter_schema_objects(item)
    elif isinstance(payload, dict):
        if "@graph" in payload and isinstance(payload["@graph"], list):
            for item in payload["@graph"]:
                yield from _iter_schema_objects(item)
        else:
            yield payload


def evaluate_block(obj: dict) -> SchemaBlockReport:
    schema_type = obj.get("@type", "Desconhecido")
    if isinstance(schema_type, list):
        schema_type = ", ".join(schema_type)

    rules = SCHEMA_RULES.get(str(schema_type))
    if rules is None:
        return SchemaBlockReport(schema_type=str(schema_type), covered=False)

    missing_required = [field_name for field_name in rules["required"] if field_name not in obj]
    missing_recommended = [field_name for field_name in rules["recommended"] if field_name not in obj]
    return SchemaBlockReport(
        schema_type=str(schema_type),
        covered=True,
        missing_required=missing_required,
        missing_recommended=missing_recommended,
    )


def validate_page(session: requests.Session, url: str) -> PageReport:
    report = PageReport(url=url)

    try:
        response = session.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as exc:
        report.fetch_error = f"Erro na requisição: {exc}"
        return report

    soup = BeautifulSoup(response.text, "html.parser")
    scripts = soup.find_all("script", type="application/ld+json")

    for script in scripts:
        raw = script.string or script.get_text()
        if not raw or not raw.strip():
            continue
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as exc:
            report.parse_errors.append(f"JSON inválido: {exc}")
            continue

        for obj in _iter_schema_objects(payload):
            if isinstance(obj, dict) and "@type" in obj:
                report.blocks.append(evaluate_block(obj))

    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", action="append", default=[], help="URL individual (repetível)")
    parser.add_argument("--urls-file", help="Arquivo texto com uma URL por linha")
    parser.add_argument("--output", default="structured_data_report.csv")
    args = parser.parse_args()

    urls = list(args.url)
    if args.urls_file:
        with open(args.urls_file, encoding="utf-8") as file:
            urls.extend(line.strip() for line in file if line.strip())

    if not urls:
        parser.error("informe URLs via --url e/ou --urls-file")

    session = requests.Session()
    reports = [validate_page(session, url) for url in urls]

    rows: list[list[str]] = []
    for r in reports:
        print(f"\n{r.url} -> {r.status}")
        if r.fetch_error:
            print(f"  {r.fetch_error}")
            rows.append([r.url, "", r.status, r.fetch_error, ""])
            continue
        if not r.blocks and not r.parse_errors:
            rows.append([r.url, "", r.status, "", ""])
            continue
        for error in r.parse_errors:
            print(f"  {error}")
            rows.append([r.url, "", "Erro", error, ""])
        for block in r.blocks:
            print(
                f"  [{block.schema_type}] {block.status} — "
                f"faltando obrigatórios: {block.missing_required or '-'}, "
                f"recomendados: {block.missing_recommended or '-'}"
            )
            rows.append(
                [
                    r.url,
                    block.schema_type,
                    block.status,
                    "; ".join(block.missing_required),
                    "; ".join(block.missing_recommended),
                ]
            )

    with open(args.output, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["URL", "Tipo Schema.org", "Status", "Campos obrigatórios ausentes", "Campos recomendados ausentes"])
        writer.writerows(rows)

    print(f"\nRelatório salvo em: {args.output}")
    sys.exit(1 if any(r.status == "Erro" for r in reports) else 0)


if __name__ == "__main__":
    main()
