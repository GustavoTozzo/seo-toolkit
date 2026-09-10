// Parser simplificado de robots.txt — cobre o caso comum (grupos User-agent com
// Allow/Disallow, escolhendo a regra de prefixo mais específico, com empate para Allow,
// como o Googlebot documenta) para viabilizar a demo ao vivo do site sem depender de um
// pacote externo. Não implementa wildcards `*`/`$` dentro do path.

type Rule = { type: "allow" | "disallow"; path: string };
type Group = { agents: string[]; rules: Rule[] };

function parseGroups(robotsText: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  let sawRuleSinceLastAgent = true;

  for (const rawLine of robotsText.split("\n")) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;

    const [rawField, ...rest] = line.split(":");
    if (!rawField || rest.length === 0) continue;
    const field = rawField.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (field === "user-agent") {
      if (current && sawRuleSinceLastAgent) {
        current = null;
      }
      if (!current) {
        current = { agents: [], rules: [] };
        groups.push(current);
        sawRuleSinceLastAgent = false;
      }
      current.agents.push(value.toLowerCase());
    } else if ((field === "allow" || field === "disallow") && current) {
      current.rules.push({ type: field, path: value });
      sawRuleSinceLastAgent = true;
    }
  }

  return groups;
}

// robots.txt permite múltiplos blocos "User-agent: X" não contíguos para o mesmo agente
// (o wordpress.org faz isso, por exemplo) — todos precisam ser combinados, não só o
// primeiro que bater, senão regras "escondidas" num segundo bloco somem da validação.
function collectRules(groups: Group[], userAgent: string): Rule[] {
  const lowerUA = userAgent.toLowerCase();
  const exactMatches = groups.filter((g) => g.agents.includes(lowerUA));
  const matches = exactMatches.length > 0 ? exactMatches : groups.filter((g) => g.agents.includes("*"));
  return matches.flatMap((g) => g.rules);
}

export function isAllowedByRobots(robotsText: string, userAgent: string, pathname: string): boolean {
  const rules = collectRules(parseGroups(robotsText), userAgent);
  if (rules.length === 0) return true;

  let best: Rule | null = null;
  for (const rule of rules) {
    if (rule.path === "") continue; // "Disallow:" vazio = permite tudo
    if (pathname.startsWith(rule.path)) {
      if (!best || rule.path.length > best.path.length) {
        best = rule;
      } else if (rule.path.length === best.path.length && rule.type === "allow") {
        best = rule;
      }
    }
  }

  return best ? best.type === "allow" : true;
}
