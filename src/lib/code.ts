import { readFile } from "node:fs/promises";
import path from "node:path";
import { codeToHtml } from "shiki";

const SCRIPTS_DIR = path.join(process.cwd(), "scripts");

export async function readScriptSource(fileName: string): Promise<string> {
  const filePath = path.join(SCRIPTS_DIR, fileName);
  return readFile(filePath, "utf-8");
}

export async function highlightPython(code: string): Promise<string> {
  return codeToHtml(code, {
    lang: "python",
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  });
}
