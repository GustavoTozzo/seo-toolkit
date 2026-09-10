"""Valida se os title/meta description publicados em produção batem com o que foi
planejado numa planilha de SERPs — útil para conferir em lote se um upload de metadados
(ex.: via CMS, feed ou script) realmente foi aplicado no site.

Lê uma planilha "índice" com uma linha por projeto (cada uma apontando para a planilha de
SERPs daquele projeto), busca ao vivo o <title> e <meta name="description"> de cada URL
marcada para validar, e compara com o title/description planejados.

Uso:
    python serp_upload_validator.py --sheet-url "https://docs.google.com/spreadsheets/d/..." \\
        --credentials service-account.json

A planilha índice precisa de uma aba com as colunas: Validar, Projeto, Planilha, Aba,
Título Automático (sufixo opcional, ex. " | Minha Loja"). Cada planilha de projeto
referenciada precisa das colunas: Upload, URL, Title novo, Description nova.
"""

from __future__ import annotations

import argparse
import csv
import os
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass

import requests
from bs4 import BeautifulSoup

from sheet_source import load_rows_from_sheet

REQUEST_TIMEOUT = 15
MAX_WORKERS = 8
USER_AGENT = "seo-toolkit-serp-validator/1.0 (+https://github.com/GustavoTozzo)"


@dataclass
class ValidationRow:
    url: str
    title_produzido: str
    description_produzida: str
    title_atual: str | None
    description_atual: str | None
    validacao: str


def fetch_meta(session: requests.Session, url: str) -> tuple[str | None, str | None, str | None]:
    """Retorna (title, description, erro)."""
    try:
        response = session.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as exc:
        return None, None, f"Erro na requisição: {exc}"

    soup = BeautifulSoup(response.text, "html.parser")
    title = soup.title.string.strip() if soup.title and soup.title.string else None
    meta_tag = soup.find("meta", attrs={"name": "description"})
    description = meta_tag.get("content", "").strip() if meta_tag else None
    return title, description, None


def validate_row(session: requests.Session, row: dict, title_suffix: str) -> ValidationRow:
    url = row["URL"]
    title_produzido = row.get("Title novo", "").strip()
    description_produzida = row.get("Description nova", "").strip()

    title_atual, description_atual, erro = fetch_meta(session, url)

    if erro:
        return ValidationRow(url, title_produzido, description_produzida, None, None, erro)

    expected_title = title_produzido + title_suffix
    ok = expected_title == title_atual and description_produzida == description_atual
    validacao = "Upload Correto" if ok else "Corrigir"

    return ValidationRow(
        url, title_produzido, description_produzida, title_atual, description_atual, validacao
    )


def validate_project(
    session: requests.Session, rows: list[dict], title_suffix: str
) -> list[ValidationRow]:
    results: list[ValidationRow] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(validate_row, session, row, title_suffix): row
            for row in rows
            if row.get("Upload") == "TRUE"
        }
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            print(f"{result.url} -> {result.validacao}")

    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sheet-url", required=True, help="URL da planilha índice de projetos")
    parser.add_argument("--index-worksheet", default="Planilhas", help="Aba da planilha índice")
    parser.add_argument("--credentials", required=True, help="JSON da conta de serviço")
    parser.add_argument("--output-dir", default="logs", help="Pasta de saída dos relatórios")
    args = parser.parse_args()

    index_rows = load_rows_from_sheet(args.sheet_url, args.index_worksheet, args.credentials)
    projects = [row for row in index_rows if row.get("Validar") == "TRUE"]

    if not projects:
        parser.error('nenhum projeto marcado com Validar = "TRUE" na planilha índice')

    os.makedirs(args.output_dir, exist_ok=True)
    session = requests.Session()

    overview: list[dict] = []
    all_errors: list[ValidationRow] = []

    for project in projects:
        nome_projeto = project["Projeto"]
        rows = load_rows_from_sheet(project["Planilha"], project["Aba"], args.credentials)
        title_suffix = project.get("Título Automático", "") or ""

        print(f"\n=== Projeto: {nome_projeto} ===")
        results = validate_project(session, rows, title_suffix)

        out_path = os.path.join(args.output_dir, f"results-{nome_projeto}.csv")
        with open(out_path, "w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)
            writer.writerow(
                ["URL", "Title Produzido", "Description Produzida", "Title Atual", "Description Atual", "Validação"]
            )
            for r in results:
                writer.writerow(
                    [r.url, r.title_produzido, r.description_produzida, r.title_atual, r.description_atual, r.validacao]
                )

        errors = [r for r in results if r.validacao != "Upload Correto"]
        all_errors.extend(errors)
        overview.append({"Projeto": nome_projeto, "Status": "Corrigir Erros" if errors else "OK"})

    with open(os.path.join(args.output_dir, "overview.csv"), "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["Projeto", "Status"])
        writer.writeheader()
        writer.writerows(overview)

    with open(os.path.join(args.output_dir, "errors.csv"), "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(
            ["URL", "Title Produzido", "Description Produzida", "Title Atual", "Description Atual", "Validação"]
        )
        for r in all_errors:
            writer.writerow(
                [r.url, r.title_produzido, r.description_produzida, r.title_atual, r.description_atual, r.validacao]
            )

    shutil.make_archive("result", "zip", args.output_dir)
    print(f"\nConcluído. Relatórios em '{args.output_dir}/' e compactados em 'result.zip'.")


if __name__ == "__main__":
    main()
