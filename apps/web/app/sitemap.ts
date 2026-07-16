import type { MetadataRoute } from "next";
import { locales, siteConfig, tools } from "@tampdf/config";

const STATIC_PAGE_PATHS = [
  "/about",
  "/contact",
  "/blog",
  "/faq",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const languageAlternates = (path: string) => ({
    ...Object.fromEntries(locales.map((locale) => [locale, `${siteConfig.url}/${locale}${path}`])),
    "x-default": `${siteConfig.url}/en${path}`,
  });

  const homeEntries: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${siteConfig.url}/${locale}`,
    changeFrequency: "weekly",
    priority: 1,
    alternates: { languages: languageAlternates("") },
  }));

  const toolEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    tools.map((tool) => ({
      url: `${siteConfig.url}/${locale}/${tool.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: { languages: languageAlternates(`/${tool.slug}`) },
    })),
  );

  const staticPageEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    STATIC_PAGE_PATHS.map((path) => ({
      url: `${siteConfig.url}/${locale}${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
      alternates: { languages: languageAlternates(path) },
    })),
  );

  return [...homeEntries, ...toolEntries, ...staticPageEntries];
}
