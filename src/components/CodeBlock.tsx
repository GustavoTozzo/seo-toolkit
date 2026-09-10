import { highlightPython } from "@/lib/code";

export default async function CodeBlock({ code }: { code: string }) {
  const html = await highlightPython(code);

  return (
    <div
      className="overflow-x-auto rounded-lg border border-border text-sm [&_pre]:p-4 [&_pre]:leading-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
