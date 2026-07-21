import type { MetadataRoute } from "next";
import { locales, siteConfig, tools } from "@tampdf/config";
import { getPayloadClient } from "@/lib/payload-client";

const STATIC_PAGE_PATHS = [
  "/about",
  "/contact",
  "/blog",
  "/faq",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
];

type LanguageAlternates = (path: string) => Record<string, string>;

// Like `[locale]/layout.tsx`, this route is prerendered at build time (SSG)
// and would otherwise stay frozen with whatever posts existed at the last
// deploy -- a newly published article would never appear in sitemap.xml
// until the next rebuild. Revalidating in the background at most every 60s
// keeps it in sync with Payload without needing a full redeploy.
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const languageAlternates: LanguageAlternates = (path) => ({
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

  const postEntries = await getPublishedPostEntries(languageAlternates);

  return [...homeEntries, ...toolEntries, ...staticPageEntries, ...postEntries];
}

/**
 * Published blog posts, fetched from Payload. Isolated in its own
 * try/catch so a database outage at build or request time degrades the
 * sitemap to "every tool and static page" instead of failing it outright
 * -- matching this codebase's existing pattern (see lib/get-settings.ts)
 * of treating a DB error as "serve reduced content", never "crash".
 *
 * `slug` isn't a localized field (see payload/collections/Posts.ts -- it
 * has no `localized: true`, unlike title/excerpt/content), so a single,
 * locale-agnostic query covers every post once; the locale loop below only
 * varies the URL/hreflang, not which posts get fetched.
 */
async function getPublishedPostEntries(
  languageAlternates: LanguageAlternates,
): Promise<MetadataRoute.Sitemap> {
  try {
    const payload = await getPayloadClient();
    const { docs: posts } = await payload.find({
      collection: "posts",
      where: { status: { equals: "published" } },
      depth: 0,
      limit: 0,
    });

    return locales.flatMap((locale) =>
      posts.map((post) => {
        const path = `/blog/${post.slug}`;
        return {
          url: `${siteConfig.url}/${locale}${path}`,
          lastModified: post.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.6,
          alternates: { languages: languageAlternates(path) },
        };
      }),
    );
  } catch (error) {
    console.error("sitemap: failed to fetch published posts, omitting them from sitemap.xml:", error);
    return [];
  }
}
