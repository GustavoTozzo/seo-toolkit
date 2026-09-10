"""Valida, para uma lista de URLs, se robots.txt e canonical/meta robots estão dando
sinais consistentes de indexação — um dos jeitos mais comuns de uma página "sumir" do
índice sem ninguém perceber é justamente um sinal contradizer o outro.

Uso:
    python robots_canonical_validator.py --url https://exemplo.com.br/pagina
    python robots_canonical_validator.py --urls-file urls.txt --output result.csv
"""

from __future__ import annotations

import argparse
import csv
import sys
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

REQUEST_TIMEOUT = 15
USER_AGENT = "seo-toolkit-robots-canonical-validator/1.0 (+https://github.com/GustavoTozzo)"


@dataclass
class UrlReport:
    url: str
    robots_status: str = "Não verificado"
    canonical: str | None = None
    canonical_status: str = "Não verificado"
    meta_robots_noindex: bool = False
    x_robots_noindex: bool = False
    issues: list[str] = field(default_factory=list)
    error: str | None = None

    @property
    def status(self) -> str:
        if self.error:
            return "Erro"
        return "Atenção" if self.issues else "OK"


@dataclass
class RobotsRule:
    is_allow: bool
    path: str


def _parse_robots_groups(text: str) -> list[tuple[list[str], list[RobotsRule]]]:
    """Retorna [(user-agents-do-bloco, regras-do-bloco), ...] na ordem em que aparecem.

    Feito à mão em vez de `urllib.robotparser`: a stdlib descarta silenciosamente
    qualquer bloco "User-agent: *" além do primeiro (ver o comentário "the first
    default entry wins" em `RobotFileParser._add_entry`) — vários sites reais (ex.:
    wordpress.org) têm mais de um bloco "User-agent: *" não contíguo, e regras nesses
    blocos extras somem da validação sem aviso nenhum. Aqui todos os blocos que casam
    com o user-agent são combinados antes de decidir.
    """
    groups: list[tuple[list[str], list[RobotsRule]]] = []
    current_agents: list[str] = []
    current_rules: list[RobotsRule] = []
    saw_rule_since_agent = True

    for raw_line in text.splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line or ":" not in line:
            continue
        field_name, _, value = line.partition(":")
        field_name = field_name.strip().lower()
        value = value.strip()

        if field_name == "user-agent":
            if current_agents and saw_rule_since_agent:
                groups.append((current_agents, current_rules))
                current_agents, current_rules = [], []
                saw_rule_since_agent = False
            current_agents.append(value.lower())
        elif field_name in ("allow", "disallow") and current_agents:
            current_rules.append(RobotsRule(is_allow=field_name == "allow", path=value))
            saw_rule_since_agent = True

    if current_agents:
        groups.append((current_agents, current_rules))

    return groups


def _is_allowed(text: str, user_agent: str, path: str) -> bool:
    groups = _parse_robots_groups(text)
    lower_ua = user_agent.lower()

    matching = [rules for agents, rules in groups if lower_ua in agents]
    if not matching:
        matching = [rules for agents, rules in groups if "*" in agents]

    best: RobotsRule | None = None
    for rules in matching:
        for rule in rules:
            if not rule.path:
                continue
            if path.startswith(rule.path):
                if best is None or len(rule.path) > len(best.path):
                    best = rule
                elif len(rule.path) == len(best.path) and rule.is_allow:
                    best = rule

    return best.is_allow if best else True


class RobotsCache:
    """Evita rebaixar robots.txt do mesmo domínio a cada URL da lista.

    Busca o robots.txt com a nossa própria sessão `requests` (User-Agent identificável)
    em vez de um cliente HTTP genérico: vários sites bloqueiam User-Agents genéricos com
    403, e tratar um 403 como "bloqueia tudo" (comportamento comum nesse tipo de parser)
    geraria falso positivo de "bloqueado por robots.txt" em sites que na real permitem tudo.
    """

    def __init__(self, session: requests.Session) -> None:
        self._session = session
        self._robots_text: dict[str, str | None] = {}

    def is_allowed(self, url: str, user_agent: str) -> bool | None:
        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"

        if origin not in self._robots_text:
            robots_url = urljoin(origin, "/robots.txt")
            try:
                response = self._session.get(
                    robots_url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT
                )
                if response.status_code == 404:
                    self._robots_text[origin] = ""
                elif response.ok:
                    self._robots_text[origin] = response.text
                else:
                    self._robots_text[origin] = None
            except requests.RequestException:
                self._robots_text[origin] = None

        text = self._robots_text[origin]
        if text is None:
            return None
        return _is_allowed(text, user_agent, parsed.path or "/")


def validate_url(session: requests.Session, url: str, robots: RobotsCache, user_agent: str) -> UrlReport:
    report = UrlReport(url=url)

    allowed = robots.is_allowed(url, user_agent)
    if allowed is None:
        report.robots_status = "robots.txt indisponível/ilegível"
    elif allowed:
        report.robots_status = "Permitido"
    else:
        report.robots_status = "Bloqueado"
        report.issues.append("Bloqueado por robots.txt")

    try:
        response = session.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as exc:
        report.error = f"Erro na requisição: {exc}"
        return report

    report.x_robots_noindex = "noindex" in response.headers.get("X-Robots-Tag", "").lower()
    if report.x_robots_noindex:
        report.issues.append("Header X-Robots-Tag com noindex")

    soup = BeautifulSoup(response.text, "html.parser")

    canonical_tag = soup.find("link", rel="canonical")
    report.canonical = canonical_tag.get("href", "").strip() if canonical_tag else None
    if not report.canonical:
        report.canonical_status = "Ausente"
        report.issues.append("Sem tag canonical")
    else:
        absolute_canonical = urljoin(url, report.canonical)
        if absolute_canonical.rstrip("/") == url.rstrip("/"):
            report.canonical_status = "Autorreferente"
        else:
            report.canonical_status = "Aponta para outra URL"
            report.issues.append(f"Canonical aponta para: {absolute_canonical}")

    meta_robots = soup.find("meta", attrs={"name": "robots"})
    if meta_robots:
        content = meta_robots.get("content", "").lower()
        report.meta_robots_noindex = "noindex" in content
        if report.meta_robots_noindex:
            report.issues.append("Meta robots com noindex")

    if report.robots_status == "Bloqueado" and report.canonical_status == "Autorreferente" and not report.meta_robots_noindex:
        report.issues.append(
            "Sinal contraditório: página parece querer ser indexada (canonical autorreferente, sem noindex) mas está bloqueada em robots.txt"
        )

    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", action="append", default=[], help="URL individual (repetível)")
    parser.add_argument("--urls-file", help="Arquivo texto com uma URL por linha")
    parser.add_argument("--user-agent", default="*", help='User-agent a validar contra robots.txt (padrão "*")')
    parser.add_argument("--output", default="robots_canonical_report.csv")
    args = parser.parse_args()

    urls = list(args.url)
    if args.urls_file:
        with open(args.urls_file, encoding="utf-8") as file:
            urls.extend(line.strip() for line in file if line.strip())

    if not urls:
        parser.error("informe URLs via --url e/ou --urls-file")

    session = requests.Session()
    robots = RobotsCache(session)
    reports = [validate_url(session, url, robots, args.user_agent) for url in urls]

    for r in reports:
        print(f"{r.url} -> {r.status} ({'; '.join(r.issues) if r.issues else r.error or 'sem problemas'})")

    with open(args.output, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(
            ["URL", "Status", "robots.txt", "Canonical", "Canonical status", "Meta noindex", "X-Robots noindex", "Problemas"]
        )
        for r in reports:
            writer.writerow(
                [
                    r.url,
                    r.status,
                    r.robots_status,
                    r.canonical or "",
                    r.canonical_status,
                    r.meta_robots_noindex,
                    r.x_robots_noindex,
                    r.error or "; ".join(r.issues),
                ]
            )

    print(f"\n{len(reports)} URLs verificadas. Relatório salvo em: {args.output}")
    sys.exit(1 if any(r.status != "OK" for r in reports) else 0)


if __name__ == "__main__":
    main()
