import type { MetadataRoute } from "next";
import { tools } from "@/content/tools";

const SITE_URL = "https://seo-toolkit-nine.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    ...tools.map((tool) => ({
      url: `${SITE_URL}/ferramentas/${tool.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
