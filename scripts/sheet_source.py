"""Helper compartilhado para ler dados tabulares de um CSV local ou de uma aba do Google Sheets.

Os scripts deste repositório nasceram no Google Colab, lendo tudo direto de planilhas
Google Sheets com autenticação implícita do ambiente (`google.colab.auth`). Fora do Colab,
isso é substituído por uma conta de serviço (--credentials) autorizada a ler a planilha,
mas o caminho mais simples para rodar localmente/testar é exportar a aba como CSV.
"""

from __future__ import annotations

import csv
from typing import Any

Row = dict[str, str]


def load_rows_from_csv(path: str) -> list[Row]:
    with open(path, newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def load_rows_from_sheet(sheet_url: str, worksheet_name: str, credentials_path: str) -> list[Row]:
    try:
        import gspread
        from google.oauth2.service_account import Credentials
    except ImportError as exc:  # pragma: no cover - dependência opcional
        raise SystemExit(
            "Para ler direto do Google Sheets instale as dependências opcionais: "
            "pip install gspread google-auth"
        ) from exc

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
    ]
    credentials = Credentials.from_service_account_file(credentials_path, scopes=scopes)
    client = gspread.authorize(credentials)
    spreadsheet = client.open_by_url(sheet_url)
    worksheet = spreadsheet.worksheet(worksheet_name)
    return worksheet.get_all_records()


def load_rows(
    *,
    csv_path: str | None = None,
    sheet_url: str | None = None,
    worksheet_name: str | None = None,
    credentials_path: str | None = None,
) -> list[Row]:
    if csv_path:
        return load_rows_from_csv(csv_path)
    if sheet_url and worksheet_name and credentials_path:
        return load_rows_from_sheet(sheet_url, worksheet_name, credentials_path)
    raise ValueError(
        "informe --csv OU (--sheet-url + --worksheet + --credentials) como fonte de dados"
    )


def add_source_args(parser: Any, *, from_label: str, to_label: str) -> None:
    """Registra os argumentos de CLI comuns para escolher a fonte de dados (DE e PARA)."""
    parser.add_argument("--from-csv", help=f"CSV local com os dados de origem ({from_label})")
    parser.add_argument("--to-csv", help=f"CSV local com os dados de destino ({to_label})")
    parser.add_argument("--sheet-url", help="URL da planilha Google Sheets (alternativa ao CSV)")
    parser.add_argument("--from-worksheet", default="DE/PARA", help="Nome da aba de origem")
    parser.add_argument("--to-worksheet", default="Rastreio", help="Nome da aba de destino")
    parser.add_argument("--credentials", help="JSON da conta de serviço (necessário para --sheet-url)")
