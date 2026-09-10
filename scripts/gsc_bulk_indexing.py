"""Solicita indexação em massa ao Google via Indexing API, em vez de uma URL por vez no
Google Search Console.

Requer uma conta de serviço do Google Cloud com acesso à Indexing API e adicionada como
"proprietário" na propriedade correspondente na Search Console (ou domínio verificado).

Uso:
    python gsc_bulk_indexing.py --credentials service-account.json --urls-file urls.txt
    python gsc_bulk_indexing.py --credentials service-account.json --url https://exemplo.com/pagina-1 --url https://exemplo.com/pagina-2
"""

from __future__ import annotations

import argparse
import csv
import sys
import time
from dataclasses import dataclass

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account

SCOPES = ["https://www.googleapis.com/auth/indexing"]
ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"
REQUEST_TIMEOUT = 15
# A Indexing API tem cota diária limitada por projeto; um pequeno intervalo entre
# chamadas evita rajadas que estourem o rate limit por minuto.
DELAY_BETWEEN_REQUESTS = 0.5
MAX_RETRIES = 3


@dataclass
class IndexResult:
    url: str
    status: str


def build_session(credentials_path: str) -> AuthorizedSession:
    credentials = service_account.Credentials.from_service_account_file(
        credentials_path, scopes=SCOPES
    )
    return AuthorizedSession(credentials)


def index_url(session: AuthorizedSession, url: str, notification_type: str) -> str:
    payload = {"url": url.strip(), "type": notification_type}

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = session.post(ENDPOINT, json=payload, timeout=REQUEST_TIMEOUT)
        except Exception as exc:  # noqa: BLE001 - queremos registrar qualquer falha de rede
            if attempt == MAX_RETRIES:
                return f"Erro de conexão: {exc}"
            time.sleep(DELAY_BETWEEN_REQUESTS * attempt)
            continue

        if response.status_code == 200:
            return notification_type

        if response.status_code == 429 and attempt < MAX_RETRIES:
            time.sleep(DELAY_BETWEEN_REQUESTS * attempt * 4)
            continue

        try:
            error = response.json().get("error", {})
            return f"Erro ({error.get('code')} - {error.get('status')}): {error.get('message')}"
        except ValueError:
            return f"Erro HTTP {response.status_code}: {response.text[:200]}"

    return "Erro: número máximo de tentativas excedido"


def index_urls(
    urls: list[str], credentials_path: str, notification_type: str = "URL_UPDATED"
) -> list[IndexResult]:
    session = build_session(credentials_path)
    results: list[IndexResult] = []

    for i, url in enumerate(urls):
        status = index_url(session, url, notification_type)
        results.append(IndexResult(url=url.strip(), status=status))
        print(f"[{i + 1}/{len(urls)}] {url.strip()} -> {status}")

        if i < len(urls) - 1:
            time.sleep(DELAY_BETWEEN_REQUESTS)

    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--credentials", required=True, help="Caminho do JSON da conta de serviço")
    parser.add_argument("--urls-file", help="Arquivo texto com uma URL por linha")
    parser.add_argument("--url", action="append", default=[], help="URL individual (repetível)")
    parser.add_argument(
        "--type",
        dest="notification_type",
        choices=["URL_UPDATED", "URL_DELETED"],
        default="URL_UPDATED",
    )
    parser.add_argument("--output", default="logs.csv", help="Arquivo CSV de log")
    args = parser.parse_args()

    urls = list(args.url)
    if args.urls_file:
        with open(args.urls_file, encoding="utf-8") as file:
            urls.extend(line.strip() for line in file if line.strip())

    if not urls:
        parser.error("informe URLs via --url e/ou --urls-file")

    results = index_urls(urls, args.credentials, args.notification_type)

    with open(args.output, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["URL", "status"])
        writer.writerows([[r.url, r.status] for r in results])

    failures = sum(1 for r in results if not r.status.endswith("UPDATED") and not r.status.endswith("DELETED"))
    print(f"\nConcluído: {len(results) - failures}/{len(results)} com sucesso. Log salvo em: {args.output}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
