import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@tampdf/config";
import { notFound } from "next/navigation";
import { StaticPage } from "@/components/static-page";
import type { Dictionary } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/get-dictionary";
import { richTextToHtml } from "@/lib/richtext";
import { getStaticPageContent, getStaticPageMetadata, type StaticPageKey } from "@/lib/static-pages";

interface Fallback {
  title: string;
  /** Short summary — also used as the SEO meta description, so keep it a single sentence. */
  intro: string;
  /** Full fallback body paragraphs shown on the page itself. Defaults to just `[intro]` when omitted. */
  body?: string[];
}

/**
 * Builds the `generateMetadata` + default-export page pair for one of the
 * six fixed informational routes. Content comes from the matching
 * `static-pages` CMS document when the admin has published one; otherwise
 * the route falls back to the existing placeholder copy in the dictionary,
 * so these pages never show up empty before anyone has edited them.
 */
export function createStaticCmsPage(
  key: StaticPageKey,
  path: string,
  getFallback: (dict: Dictionary) => Fallback,
) {
  async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale: rawLocale } = await params;
    const locale = isValidLocale(rawLocale) ? rawLocale : "en";
    const fallback = getFallback(getDictionary(locale));
    return getStaticPageMetadata(key, rawLocale, locale, path, fallback.title, fallback.intro);
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale: rawLocale } = await params;
    if (!isValidLocale(rawLocale)) notFound();
    const locale = rawLocale as Locale;
    const fallback = getFallback(getDictionary(locale));
    const doc = await getStaticPageContent(key, locale);

    if (!doc) {
      const paragraphs = fallback.body ?? [fallback.intro];
      return (
        <StaticPage locale={locale} title={fallback.title} isPlaceholder={!fallback.body}>
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </StaticPage>
      );
    }

    return (
      <StaticPage locale={locale} title={doc.title}>
        <div
          className="[&_a]:text-brand-600 [&_a]:underline [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ms-5 [&_ol]:list-decimal [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: richTextToHtml(doc.content) }}
        />
      </StaticPage>
    );
  }

  return { generateMetadata, Page };
}
