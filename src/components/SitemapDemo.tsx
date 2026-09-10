"use client";

import { useState, type FormEvent } from "react";

type DemoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; urls: string[]; total: number; truncated: boolean };

export default function SitemapDemo() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<DemoState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/extrator-sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok) {
        setState({ status: "error", message: data.error ?? "erro ao processar o sitemap" });
        return;
      }

      setState({
        status: "success",
        urls: data.urls,
        total: data.total,
        truncated: data.truncated,
      });
    } catch {
      setState({ status: "error", message: "não foi possível conectar ao servidor" });
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-base font-semibold">Testar agora</h3>
      <p className="mt-1 text-sm text-muted">
        Cole a URL de um sitemap.xml público. A extração roda no servidor, com limite de
        tamanho e tempo para manter a demonstração leve.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          required
          placeholder="https://exemplo.com.br/sitemap.xml"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="w-full flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {state.status === "loading" ? "Extraindo…" : "Extrair URLs"}
        </button>
      </form>

      {state.status === "error" && (
        <p className="mt-4 text-sm text-red-500">{state.message}</p>
      )}

      {state.status === "success" && (
        <div className="mt-4">
          <p className="text-sm text-muted">
            {state.total} URL{state.total === 1 ? "" : "s"} encontrada
            {state.total === 1 ? "" : "s"}
            {state.truncated ? " (exibindo as primeiras 500)" : ""}.
          </p>
          <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-border bg-background p-3 font-mono text-xs">
            {state.urls.map((entry, index) => (
              <div key={`${index}-${entry}`} className="truncate py-0.5">
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
