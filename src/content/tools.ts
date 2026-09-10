export type Tool = {
  slug: string;
  title: string;
  tagline: string;
  category: string;
  scriptFile: string;
  problem: string;
  howItWorks: string[];
  requirements: string[];
  usage: { description: string; command: string }[];
  notes?: string[];
  hasLiveDemo?: boolean;
};

export const tools: Tool[] = [
  {
    slug: "indexacao-massa-gsc",
    title: "Indexação em Massa via Google Indexing API",
    tagline:
      "Solicita indexação para dezenas ou centenas de URLs de uma vez, em vez de enviar uma por uma manualmente no Search Console.",
    category: "Indexação",
    scriptFile: "gsc_bulk_indexing.py",
    problem:
      "O Google Search Console só permite solicitar reindexação de uma URL por vez, pela interface. Em migrações, relançamentos de catálogo ou publicação de muitas páginas novas, isso vira um gargalo operacional — literalmente centenas de cliques repetidos.",
    howItWorks: [
      "Autentica com uma conta de serviço do Google Cloud autorizada na Indexing API.",
      "Envia cada URL para o endpoint urlNotifications:publish, com o tipo de notificação (URL_UPDATED ou URL_DELETED).",
      "Aplica um pequeno intervalo entre chamadas e retry com backoff em respostas 429, para não estourar a cota da API.",
      "Registra o resultado de cada URL (sucesso ou motivo do erro) em um CSV de log ao final da execução.",
    ],
    requirements: [
      "Projeto no Google Cloud com a Indexing API ativada.",
      "Conta de serviço (service account) com a chave JSON baixada.",
      "A conta de serviço precisa ser adicionada como proprietária da propriedade no Search Console (ou ter delegação de domínio configurada).",
    ],
    usage: [
      {
        description: "Indexar URLs listadas em um arquivo texto (uma por linha):",
        command:
          "python gsc_bulk_indexing.py --credentials service-account.json --urls-file urls.txt",
      },
      {
        description: "Indexar URLs individuais direto pela linha de comando:",
        command:
          "python gsc_bulk_indexing.py --credentials service-account.json \\\n  --url https://exemplo.com/pagina-1 --url https://exemplo.com/pagina-2",
      },
    ],
    notes: [
      "A Indexing API tem cota diária limitada por projeto (por padrão, 200 solicitações/dia) — pensada para páginas de emprego e eventos ao vivo, uso fora desse escopo pode ser rejeitado pelo Google.",
      "Versão original usava oauth2client, uma biblioteca descontinuada desde 2017; foi substituída por google-auth, a atual recomendada pelo Google.",
    ],
  },
  {
    slug: "redirect-por-url",
    title: "Mapeamento de Redirects por Similaridade de URL",
    tagline:
      "Em uma migração de site, sugere automaticamente para qual URL nova cada URL antiga deve redirecionar, comparando os slugs por similaridade textual.",
    category: "Migração de sites",
    scriptFile: "url_redirect_mapper.py",
    problem:
      "Migrações de plataforma ou replatforming geralmente mudam a estrutura de URLs. Montar manualmente uma planilha de redirecionamentos 301 (DE/PARA) para um catálogo grande é lento e propenso a erro — e redirect quebrado ou mal direcionado é uma das formas mais comuns de perder ranking numa migração.",
    howItWorks: [
      "Lê a lista de URLs antigas (que vão deixar de existir) e a lista de URLs novas (as que responderão 200 depois da migração).",
      "Remove o domínio de ambas as listas (opcional), para comparar só o caminho/slug.",
      "Para cada URL antiga, calcula a similaridade contra todas as URLs novas usando RapidFuzz e escolhe a de maior score.",
      "Gera um CSV com URL DE, URL PARA sugerida e o score de confiança — pronto para revisão humana antes de virar regra de redirect.",
    ],
    requirements: [
      "Duas listas de URLs: uma com as URLs antigas, outra com as URLs novas (200).",
      "Podem vir de dois CSVs locais, ou de duas abas de uma planilha Google Sheets (nesse caso, é necessária uma conta de serviço com acesso de leitura).",
    ],
    usage: [
      {
        description: "A partir de dois CSVs exportados das abas DE/PARA e Rastreio:",
        command:
          "python url_redirect_mapper.py --from-csv de_para.csv --to-csv rastreio.csv \\\n  --output result.csv",
      },
      {
        description: "Direto de uma planilha Google Sheets:",
        command:
          'python url_redirect_mapper.py --sheet-url "https://docs.google.com/spreadsheets/d/..." \\\n  --credentials service-account.json --output result.csv',
      },
    ],
    notes: [
      "Score é sempre um ponto de partida, não a decisão final — scores baixos indicam que aquela URL antiga provavelmente não tem equivalente direto e merece redirecionar para uma categoria/página institucional.",
      "Versão original usava fuzzywuzzy comparando cada par manualmente em loop O(n²); a versão atual usa RapidFuzz (mesma lógica de similaridade, implementação em C) com process.extractOne, bem mais rápida em listas grandes.",
    ],
  },
  {
    slug: "redirect-por-h1",
    title: "Mapeamento de Redirects por Similaridade de H1",
    tagline:
      "Quando a estrutura de URLs muda tanto que comparar slugs não funciona, compara o H1 (título) de cada página para encontrar o par mais parecido.",
    category: "Migração de sites",
    scriptFile: "h1_redirect_mapper.py",
    problem:
      "Em replatforming completos (troca de CMS/plataforma de e-commerce, por exemplo), o padrão de URL pode mudar totalmente — mas o conteúdo da página, e portanto o H1, costuma se manter reconhecível. Comparar por URL nesse cenário não encontra bons pares.",
    howItWorks: [
      "Lê pares de H1 + URL da lista antiga e da lista nova.",
      "Normaliza acentuação e caixa (unidecode + lower) antes de comparar, para reduzir ruído.",
      "Para cada H1 antigo, encontra o H1 novo mais similar via RapidFuzz e retorna a URL correspondente.",
      "Exporta URL DE, H1 antigo, URL PARA, H1 novo e o score de similaridade para revisão.",
    ],
    requirements: [
      "Duas fontes de dados com as colunas H1 e URL — uma para as páginas antigas, outra para as novas.",
      "CSV local ou Google Sheets (com conta de serviço, igual à ferramenta de redirect por URL).",
    ],
    usage: [
      {
        description: "A partir de dois CSVs:",
        command:
          "python h1_redirect_mapper.py --from-csv de_para.csv --to-csv rastreio.csv \\\n  --output result.csv",
      },
      {
        description: "Direto de uma planilha Google Sheets:",
        command:
          'python h1_redirect_mapper.py --sheet-url "https://docs.google.com/spreadsheets/d/..." \\\n  --credentials service-account.json --output result.csv',
      },
    ],
    notes: [
      "A versão original tinha regras de filtro específicas de um projeto (URL antiga precisava terminar em /p, nova conter /produto) — foram removidas; agora o script é genérico e essas regras de negócio ficam a critério de quem chama.",
      "Trocado difflib.SequenceMatcher (Python puro) por RapidFuzz — mesma ideia de comparação de string, execução bem mais rápida em listas grandes.",
    ],
  },
  {
    slug: "extrator-sitemap",
    title: "Extrator de URLs de Sitemap",
    tagline:
      "Cola a URL de um sitemap.xml e recebe todas as URLs listadas nele — incluindo sitemaps index, que apontam para outros sitemaps.",
    category: "Rastreamento",
    scriptFile: "sitemap_url_extractor.py",
    problem:
      "Antes de rastrear um site, auditar indexação ou comparar URLs planejadas vs. publicadas, é preciso ter a lista completa de URLs do sitemap — que em sites grandes costuma estar dividida em múltiplos arquivos (sitemap index).",
    howItWorks: [
      "Faz o download do XML do sitemap informado.",
      "Se for um sitemap index (aponta para outros sitemaps via <sitemap>), busca cada um recursivamente.",
      "Se for um sitemap de páginas (<url>), coleta cada <loc>.",
      "Evita loops infinitos em sitemaps mal configurados que se referenciam entre si, e reporta erros de rede/XML sem interromper o restante da extração.",
    ],
    requirements: ["Apenas a URL pública do sitemap — nenhuma credencial necessária."],
    usage: [
      {
        description: "Extrair para CSV (padrão):",
        command: "python sitemap_url_extractor.py --url https://exemplo.com.br/sitemap.xml",
      },
      {
        description: "Extrair para JSON, em um arquivo específico:",
        command:
          "python sitemap_url_extractor.py --url https://exemplo.com.br/sitemap.xml \\\n  --output urls.json --format json",
      },
    ],
    hasLiveDemo: true,
  },
  {
    slug: "validador-upload-serps",
    title: "Validador de Upload de SERPs",
    tagline:
      "Confere em lote se o title e a meta description planejados numa planilha realmente foram publicados no site — sem abrir uma página por vez.",
    category: "QA de conteúdo",
    scriptFile: "serp_upload_validator.py",
    problem:
      "Depois de um upload de metadados (title/description) em massa — via CMS, feed ou script de terceiros —, confirmar manualmente página por página se tudo foi aplicado corretamente não escala, principalmente com múltiplos projetos rodando em paralelo.",
    howItWorks: [
      "Lê uma planilha índice com uma linha por projeto, cada uma apontando para a planilha de SERPs daquele projeto.",
      "Para cada projeto marcado para validar, busca ao vivo o <title> e a <meta name=\"description\"> de cada URL (em paralelo, com um pool de threads).",
      "Compara o title/description publicados com os planejados na planilha e classifica cada URL como 'Upload Correto' ou 'Corrigir'.",
      "Gera um CSV por projeto, um overview geral e um CSV só com os erros, compactados em result.zip.",
    ],
    requirements: [
      "Uma planilha índice de projetos e as planilhas de SERPs de cada projeto, no Google Sheets.",
      "Conta de serviço com acesso de leitura às planilhas.",
    ],
    usage: [
      {
        description: "Validar todos os projetos marcados na planilha índice:",
        command:
          'python serp_upload_validator.py --sheet-url "https://docs.google.com/spreadsheets/d/..." \\\n  --credentials service-account.json',
      },
    ],
    notes: [
      "A versão original fazia as requisições HTTP uma de cada vez, em sequência — a versão atual usa um ThreadPoolExecutor para paralelizar as buscas, reduzindo bastante o tempo total em planilhas grandes.",
      "O nome da planilha e demais referências de projeto foram removidos do código; tudo é passado por parâmetro.",
    ],
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}
