"""Preenche uma planilha de redirecionamentos (DE/PARA) comparando o H1 de cada página,
em vez da URL — útil quando as URLs mudam de padrão entre o site antigo e o novo, mas o
conteúdo (e portanto o H1) se mantém parecido.

Uso (com CSVs locais, exportados das abas "DE/PARA" e "Rastreio" da planilha):
    python h1_redirect_mapper.py --from-csv de_para.csv --to-csv rastreio.csv --output result.csv

Uso (lendo direto do Google Sheets, com uma conta de serviço):
    python h1_redirect_mapper.py --sheet-url "https://docs.google.com/spreadsheets/d/..." \\
        --credentials service-account.json --output result.csv

Cada CSV/aba precisa das colunas "H1" e "URL".
"""

from __future__ import annotations

import argparse
import csv

from rapidfuzz import fuzz, process
from unidecode import unidecode

from sheet_source import add_source_args, load_rows


def normalize(text: str) -> str:
    return unidecode(str(text)).lower().strip()


def map_by_h1(
    from_rows: list[dict[str, str]],
    to_rows: list[dict[str, str]],
) -> list[dict[str, str]]:
    to_h1_normalized = [normalize(row["H1"]) for row in to_rows]
    matches: list[dict[str, str]] = []

    for i, row in enumerate(from_rows):
        h1_antigo = row["H1"]
        url_antiga = row["URL"]
        query = normalize(h1_antigo)

        match = process.extractOne(query, to_h1_normalized, scorer=fuzz.ratio, score_cutoff=0)
        _, score, idx = match
        destino = to_rows[idx]

        matches.append(
            {
                "URL DE": url_antiga,
                "H1 Antigo": h1_antigo,
                "URL PARA": destino["URL"],
                "H1 Novo": destino["H1"],
                "Score": f"{score:.2f}",
            }
        )
        print(
            f"[{i + 1}/{len(from_rows)}] \"{h1_antigo}\" -> \"{destino['H1']}\" "
            f"(score {score:.1f})"
        )

    return matches


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    add_source_args(parser, from_label="páginas antigas", to_label="páginas novas")
    parser.add_argument("--output", default="urls_redirecionamento.csv")
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

    from_rows = [r for r in from_rows if r.get("H1") and r.get("URL")]
    to_rows = [r for r in to_rows if r.get("H1") and r.get("URL")]

    if not from_rows or not to_rows:
        parser.error("nenhuma linha com H1 e URL preenchidos foi encontrada")

    matches = map_by_h1(from_rows, to_rows)

    with open(args.output, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["URL DE", "H1 Antigo", "URL PARA", "H1 Novo", "Score"])
        writer.writeheader()
        writer.writerows(matches)

    print(f"\n{len(matches)} redirecionamentos sugeridos. Arquivo salvo em: {args.output}")


if __name__ == "__main__":
    main()
