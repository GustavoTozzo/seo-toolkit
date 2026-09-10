"""Preenche automaticamente uma planilha de redirecionamentos (DE/PARA) para migração de sites.

Compara a URL de cada página antiga (que vai deixar de existir) com a lista de URLs novas
(200) por similaridade de texto, e sugere o melhor destino de redirect para cada uma.

Uso (com CSVs locais, exportados das abas "DE/PARA" e "Rastreio" da planilha):
    python url_redirect_mapper.py --from-csv de_para.csv --to-csv rastreio.csv --output result.csv

Uso (lendo direto do Google Sheets, com uma conta de serviço):
    python url_redirect_mapper.py --sheet-url "https://docs.google.com/spreadsheets/d/..." \\
        --credentials service-account.json --output result.csv
"""

from __future__ import annotations

import argparse
import csv

from rapidfuzz import fuzz, process

from sheet_source import add_source_args, load_rows

FROM_COLUMN_DEFAULT = "URL DE"
TO_COLUMN_DEFAULT = "URL"
EARLY_STOP_SCORE = 90


def strip_domain(url: str, domain: str) -> str:
    return url[len(domain):] if domain and url.startswith(domain) else url


def map_redirects(
    from_urls: list[str],
    to_urls: list[str],
    *,
    domain: str = "",
) -> list[tuple[str, str, float]]:
    """Para cada URL antiga, retorna (url_de, melhor_url_para, score 0-100)."""
    candidates = [strip_domain(url, domain) for url in to_urls]
    results: list[tuple[str, str, float]] = []

    for i, url in enumerate(from_urls):
        query = strip_domain(url, domain)
        match = process.extractOne(query, candidates, scorer=fuzz.ratio, score_cutoff=0)

        if match is None:
            results.append((url, "", 0.0))
        else:
            _, score, idx = match
            results.append((url, to_urls[idx], score))

        print(f"[{i + 1}/{len(from_urls)}] {url} -> {results[-1][1]} (score {results[-1][2]:.1f})")

    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    add_source_args(parser, from_label="URLs antigas", to_label="URLs novas (200)")
    parser.add_argument("--from-column", default=FROM_COLUMN_DEFAULT)
    parser.add_argument("--to-column", default=TO_COLUMN_DEFAULT)
    parser.add_argument("--domain", default="", help="Domínio a ignorar na comparação, se as URLs o incluírem")
    parser.add_argument("--output", default="result-de-para.csv")
    args = parser.parse_args()

    from_rows = load_rows(
        csv_path=args.from_csv,
        sheet_url=args.sheet_url,
        worksheet_name=args.from_worksheet,
        credentials_path=args.credentials,
    )
    to_rows = load_rows(
        csv_path=args.to_csv,
        sheet_url=args.sheet_url,
        worksheet_name=args.to_worksheet,
        credentials_path=args.credentials,
    )

    from_urls = [row[args.from_column].strip() for row in from_rows if row.get(args.from_column)]
    to_urls = [row[args.to_column].strip() for row in to_rows if row.get(args.to_column)]

    if not from_urls or not to_urls:
        parser.error("nenhuma URL encontrada nas colunas informadas")

    results = map_redirects(from_urls, to_urls, domain=args.domain)

    with open(args.output, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["URL DE", "URL PARA", "Score"])
        writer.writerows(results)

    print(f"\n{len(results)} redirecionamentos sugeridos. Arquivo salvo em: {args.output}")


if __name__ == "__main__":
    main()
