"use client";

import { useState, type FormEvent } from "react";

type Result = {
  url: string;
  robotsStatus?: string;
  canonical?: string | null;
  canonicalStatus?: string;
  metaNoindex?: boolean;
  xRobotsNoindex?: boolean;
  issues?: string[];
  status?: string;
  error?: string;
};

type DemoState = { status: "idle" } | { status: "loading" } | { status: "error"; message: string } | { status: "success"; result: Result };

export default function RobotsCanonicalDemo() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<DemoState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/validador-robots-canonical", {
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
        Cole a URL de uma página pública. Checa robots.txt, tag canonical, meta robots e
        o header X-Robots-Tag em tempo real.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          required
          placeholder="https://exemplo.com.br/pagina"
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
        <div className="mt-4 flex flex-col gap-2 text-sm">
          {state.result.error ? (
            <p className="text-red-500">{state.result.error}</p>
          ) : (
            <>
              <Row label="Status geral" value={state.result.status} emphasize />
              <Row label="robots.txt" value={state.result.robotsStatus} />
              <Row label="Canonical" value={state.result.canonical ?? "—"} />
              <Row label="Status do canonical" value={state.result.canonicalStatus} />
              <Row label="Meta robots noindex" value={state.result.metaNoindex ? "Sim" : "Não"} />
              <Row label="X-Robots-Tag noindex" value={state.result.xRobotsNoindex ? "Sim" : "Não"} />
              {state.result.issues && state.result.issues.length > 0 && (
                <div className="mt-2 rounded-lg border border-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Problemas encontrados</p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {state.result.issues.map((issue) => (
                      <li key={issue} className="text-red-500">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, emphasize }: { label: string; value?: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-1.5 last:border-none">
      <span className="text-muted">{label}</span>
      <span className={emphasize ? "font-medium text-accent" : ""}>{value}</span>
    </div>
  );
}
