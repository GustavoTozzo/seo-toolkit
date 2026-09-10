import Link from "next/link";
import { tools } from "@/content/tools";
import ToolCard from "@/components/ToolCard";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <section className="max-w-2xl">
        <p className="font-mono text-sm text-accent">SEO técnico · Python · código aberto</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Ferramentas que nasceram de rotina de SEO técnico
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Scripts em Python, escritos originalmente para resolver problemas reais do dia a
          dia de SEO técnico — indexação em massa, migração de sites, rastreamento e QA de
          conteúdo — reescritos aqui como ferramentas de linha de comando, com
          documentação completa e código aberto.
        </p>
      </section>

      <section id="ferramentas" className="mt-16 scroll-mt-16">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          As ferramentas
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-xl border border-border bg-card p-8">
        <span className="w-fit rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
          Demonstração
        </span>
        <h2 className="mt-3 text-lg font-semibold">Dashboard de SEO + GA4 (dados fictícios)</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Um exemplo de painel de acompanhamento — cliques e impressões, palavras-chave em
          destaque, páginas indexadas e receita — com dados 100% simulados, já que não há
          acesso ao Search Console/GA4 de nenhum site real aqui.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          Ver o dashboard →
        </Link>
      </section>

      <section className="mt-8 rounded-xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold">Próximas ferramentas nessa linha</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Ideias para expandir o toolkit, mantendo o mesmo espírito de automatizar tarefas
          manuais e repetitivas de SEO técnico:
        </p>
        <ul className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2">
          <li className="rounded-lg border border-border p-3">
            <span className="font-medium text-foreground">Auditor de Core Web Vitals em lote</span>{" "}
            — roda a PageSpeed Insights API contra uma lista de URLs e consolida LCP/INP/CLS
            num único relatório.
          </li>
          <li className="rounded-lg border border-border p-3">
            <span className="font-medium text-foreground">Detector de canibalização de palavras-chave</span>{" "}
            — cruza dados do Search Console para achar múltiplas URLs competindo pela mesma
            query.
          </li>
          <li className="rounded-lg border border-border p-3">
            <span className="font-medium text-foreground">Verificador de links quebrados e cadeias de redirect</span>{" "}
            — rastreia um site inteiro sinalizando 404s e redirects encadeados (redirect
            chains), que dissipam link equity.
          </li>
          <li className="rounded-lg border border-border p-3">
            <span className="font-medium text-foreground">Auditor de hreflang</span>{" "}
            — verifica reciprocidade e consistência das tags hreflang em sites multi-idioma.
          </li>
        </ul>
      </section>
    </div>
  );
}
