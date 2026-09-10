"use client";

import { useState, type FormEvent } from "react";

type Block = {
  schemaType: string;
  covered: boolean;
  missingRequired: string[];
  missingRecommended: string[];
  status: string;
};

type Result = {
  url: string;
  status?: string;
  blocks?: Block[];
  parseErrors?: string[];
  error?: string;
};

type DemoState = { status: "idle" } | { status: "loading" } | { status: "error"; message: string } | { status: "success"; result: Result };

const STATUS_STYLES: Record<string, string> = {
  OK: "text-emerald-600 dark:text-emerald-400",
  Atenção: "text-amber-600 dark:text-amber-400",
  Erro: "text-red-500",
  "Tipo não coberto pelo checklist": "text-muted",
};

export default function StructuredDataDemo() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<DemoState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/validador-dados-estruturados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok) {
        setState({ status: "error", message: data.error ?? "erro ao validar a URL" });
        return;
      }

      setState({ status: "success", result: data });
    } catch {
      setState({ status: "error", message: "não foi possível conectar ao servidor" });
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-base font-semibold">Testar agora</h3>
      <p className="mt-1 text-sm text-muted">
        Cole a URL de uma página pública. Extrai os blocos JSON-LD e confere campos
        obrigatórios/recomendados para os tipos mais comuns.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          required
          placeholder="https://exemplo.com.br/produto/123"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="w-full flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {state.status === "loading" ? "Validando…" : "Validar"}
        </button>
      </form>

      {state.status === "error" && <p className="mt-4 text-sm text-red-500">{state.message}</p>}

      {state.status === "success" && (
        <div className="mt-4 flex flex-col gap-3 text-sm">
          {state.result.error ? (
            <p className="text-red-500">{state.result.error}</p>
          ) : !state.result.blocks || state.result.blocks.length === 0 ? (
            <p className="text-muted">Nenhum dado estruturado (JSON-LD) encontrado nessa página.</p>
          ) : (
            state.result.blocks.map((block, i) => (
              <div key={`${block.schemaType}-${i}`} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium">{block.schemaType}</span>
                  <span className={STATUS_STYLES[block.status] ?? ""}>{block.status}</span>
                </div>
                {block.missingRequired.length > 0 && (
                  <p className="mt-2 text-red-500">Obrigatórios ausentes: {block.missingRequired.join(", ")}</p>
                )}
                {block.missingRecommended.length > 0 && (
                  <p className="mt-1 text-amber-600 dark:text-amber-400">
                    Recomendados ausentes: {block.missingRecommended.join(", ")}
                  </p>
                )}
              </div>
            ))
          )}
          {state.result.parseErrors && state.result.parseErrors.length > 0 && (
            <div className="rounded-lg border border-border bg-background p-3">
              {state.result.parseErrors.map((err) => (
                <p key={err} className="text-red-500">
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
