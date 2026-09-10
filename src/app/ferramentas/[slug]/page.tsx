import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getToolBySlug, tools } from "@/content/tools";
import { readScriptSource } from "@/lib/code";
import CodeBlock from "@/components/CodeBlock";
import SitemapDemo from "@/components/SitemapDemo";
import RobotsCanonicalDemo from "@/components/RobotsCanonicalDemo";
import StructuredDataDemo from "@/components/StructuredDataDemo";

const DEMOS: Record<string, ComponentType> = {
  "extrator-sitemap": SitemapDemo,
  "validador-robots-canonical": RobotsCanonicalDemo,
  "validador-dados-estruturados": StructuredDataDemo,
};

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/GustavoTozzo/seo-toolkit/main/scripts";
const GITHUB_BLOB_BASE = "https://github.com/GustavoTozzo/seo-toolkit/blob/main/scripts";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata(
  props: PageProps<"/ferramentas/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  return {
    title: tool.title,
    description: tool.tagline,
    openGraph: { title: tool.title, description: tool.tagline },
  };
}

export default async function ToolPage(props: PageProps<"/ferramentas/[slug]">) {
  const { slug } = await props.params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const source = await readScriptSource(tool.scriptFile);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/#ferramentas" className="text-sm text-muted hover:text-accent">
        ← Todas as ferramentas
      </Link>

      <span className="mt-6 block w-fit rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
        {tool.category}
      </span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{tool.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">{tool.tagline}</p>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Problema</h2>
        <p className="mt-3 leading-relaxed">{tool.problem}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Como funciona
        </h2>
        <ol className="mt-3 flex flex-col gap-2">
          {tool.howItWorks.map((step, i) => (
            <li key={step} className="flex gap-3 leading-relaxed">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {tool.requirements.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Requisitos
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {tool.requirements.map((req) => (
              <li key={req} className="flex gap-2 leading-relaxed text-muted">
                <span className="text-accent">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Como usar</h2>
        <div className="mt-3 flex flex-col gap-4">
          {tool.usage.map((step) => (
            <div key={step.command}>
              <p className="text-sm text-muted">{step.description}</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-card p-4 font-mono text-sm">
                {step.command}
              </pre>
            </div>
          ))}
        </div>
      </section>

      {tool.hasLiveDemo && DEMOS[tool.slug] && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Demo</h2>
          <div className="mt-3">
            {(() => {
              const Demo = DEMOS[tool.slug];
              return <Demo />;
            })()}
          </div>
        </section>
      )}

      {tool.notes && tool.notes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Notas técnicas
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {tool.notes.map((note) => (
              <li key={note} className="flex gap-2 text-sm leading-relaxed text-muted">
                <span className="text-accent">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Código-fonte
          </h2>
          <div className="flex gap-4 text-sm">
            <a
              href={`${GITHUB_BLOB_BASE}/${tool.scriptFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Ver no GitHub
            </a>
            <a
              href={`${GITHUB_RAW_BASE}/${tool.scriptFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Baixar (.py)
            </a>
          </div>
        </div>
        <div className="mt-3">
          <CodeBlock code={source} />
        </div>
      </section>
    </div>
  );
}
