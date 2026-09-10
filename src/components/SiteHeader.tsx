import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const GITHUB_URL = "https://github.com/GustavoTozzo/seo-toolkit";

export default function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-mono text-lg font-semibold tracking-tight">
            seo<span className="text-accent">-toolkit</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted sm:gap-x-6">
          <Link href="/#ferramentas" className="transition-colors hover:text-foreground">
            Ferramentas
          </Link>
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
