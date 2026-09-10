import Link from "next/link";

const GITHUB_URL = "https://github.com/GustavoTozzo/seo-toolkit";

export default function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-mono text-lg font-semibold tracking-tight">
            seo<span className="text-accent">-toolkit</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/#ferramentas" className="transition-colors hover:text-foreground">
            Ferramentas
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
