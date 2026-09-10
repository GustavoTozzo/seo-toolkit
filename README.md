# SEO Toolkit

Cinco ferramentas de SEO técnico em Python, nascidas de rotinas reais de trabalho e
reescritas aqui como scripts de linha de comando, com documentação e um site de
apresentação em Next.js.

**Site:** https://seo-toolkit-gustavo.vercel.app _(em breve)_

## Ferramentas

| Ferramenta | O que faz | Script |
| --- | --- | --- |
| Indexação em massa via GSC | Solicita indexação de várias URLs de uma vez pela Indexing API do Google | [`scripts/gsc_bulk_indexing.py`](scripts/gsc_bulk_indexing.py) |
| Mapeamento de redirect por URL | Sugere para onde redirecionar cada URL antiga numa migração, por similaridade de slug | [`scripts/url_redirect_mapper.py`](scripts/url_redirect_mapper.py) |
| Mapeamento de redirect por H1 | Mesma ideia, mas comparando o H1 das páginas — útil quando o padrão de URL muda por completo | [`scripts/h1_redirect_mapper.py`](scripts/h1_redirect_mapper.py) |
| Extrator de URLs de sitemap | Extrai todas as URLs de um sitemap.xml, inclusive sitemap index | [`scripts/sitemap_url_extractor.py`](scripts/sitemap_url_extractor.py) |
| Validador de upload de SERPs | Confere em lote se title/description publicados batem com o planejado numa planilha | [`scripts/serp_upload_validator.py`](scripts/serp_upload_validator.py) |

Documentação completa de cada uma (problema que resolve, como funciona, requisitos e
exemplos de uso) está no site, em `/ferramentas/<slug>`, e é gerada a partir de
[`src/content/tools.ts`](src/content/tools.ts).

## Rodando os scripts

```bash
cd scripts
pip install -r requirements.txt
python sitemap_url_extractor.py --url https://exemplo.com.br/sitemap.xml
```

Os scripts que dependem de APIs do Google (indexação, planilhas) precisam de uma conta de
serviço do Google Cloud — veja `--help` em cada script ou a documentação no site para os
detalhes de escopo/permissão necessários.

## Rodando o site localmente

```bash
pnpm install
pnpm dev
```

Next.js 16 (App Router), TypeScript estrito, Tailwind CSS v4. O site lê e destaca
(syntax highlight) o conteúdo real de `scripts/*.py` em tempo de build — o código exibido
nunca fica dessincronizado dos arquivos-fonte.

## Origem

Estes scripts nasceram no dia a dia de SEO técnico, originalmente como notebooks do
Google Colab, acoplados a uma planilha e site específicos. Para publicá-los aqui, foram:

- Generalizados — nenhuma referência a domínio, cliente ou planilha específica ficou no
  código; tudo é parametrizado via linha de comando.
- Modernizados — `oauth2client` (descontinuado) trocado por `google-auth`;
  `fuzzywuzzy`/`difflib` trocados por `rapidfuzz` (mesma lógica, execução em C, bem mais
  rápida); requisições sequenciais paralelizadas onde fazia sentido (validador de SERPs).
- Transformados em CLIs de verdade — sem `input()` bloqueante nem dependência do ambiente
  do Colab, com `argparse`, mensagens de erro claras e saída em CSV/JSON.

## Próximas ferramentas

Ideias para expandir o toolkit (ver também a seção "Próximas ferramentas" no site):

- Auditor de Core Web Vitals em lote via PageSpeed Insights API
- Validador de robots.txt e tags canonical
- Detector de canibalização de palavras-chave via Search Console
- Verificador de links quebrados e cadeias de redirect
- Validador de dados estruturados (Schema.org / JSON-LD)
- Auditor de reciprocidade de hreflang
