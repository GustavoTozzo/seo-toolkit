import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://seo-toolkit-nine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SEO Toolkit — ferramentas de SEO técnico em Python",
    template: "%s | SEO Toolkit",
  },
  description:
    "Ferramentas de SEO técnico em Python de código aberto: indexação em massa, mapeamento de redirects, extração de sitemap, validação de robots.txt/canonicals e de dados estruturados.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SEO Toolkit",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
