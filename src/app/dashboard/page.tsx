import type { Metadata } from "next";
import DashboardContent from "@/components/dashboard/DashboardContent";

export const metadata: Metadata = {
  title: "Dashboard de SEO (dados fictícios)",
  description:
    "Exemplo de dashboard de SEO + GA4 com dados 100% simulados, para mostrar como a leitura de cliques, impressões, palavras-chave e receita ficaria na prática.",
  robots: { index: false, follow: true },
};

export default function DashboardPage() {
  return <DashboardContent />;
}
