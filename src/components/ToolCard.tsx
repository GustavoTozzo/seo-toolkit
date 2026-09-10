import Link from "next/link";
import type { Tool } from "@/content/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/ferramentas/${tool.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent"
    >
      <span className="w-fit rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
        {tool.category}
      </span>
      <h3 className="text-lg font-semibold tracking-tight group-hover:text-accent">
        {tool.title}
      </h3>
      <p className="text-sm leading-relaxed text-muted">{tool.tagline}</p>
      <span className="mt-2 text-sm font-medium text-accent">Ver documentação →</span>
    </Link>
  );
}
