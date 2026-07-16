import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@tampdf/config";
import { notFound } from "next/navigation";
import { FaqAccordion } from "@/components/faq-accordion";
import { StaticPage } from "@/components/static-page";
import { getDictionary } from "@/i18n/get-dictionary";
import { getFaqs } from "@/lib/faqs";
import { buildStaticPageMetadata } from "@/lib/static-page-metadata";

// This page is fully static per locale (no cookies/headers/search params),
// so Next prerenders it and serves it from cache — the `faqs` query below
// runs at most once per revalidation window, not per visitor, which is
// what keeps it fast regardless of traffic or FAQ count.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  return buildStaticPageMetadata(rawLocale, "/faq", dict.staticPages.faq.title, dict.staticPages.faq.intro);
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  // Single request for every published FAQ; the accordion below is a pure
  // Client Component over this already-fetched data — no further requests
  // fire when a question is expanded or collapsed.
  const faqs = await getFaqs(locale);

  const jsonLd =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null;

  return (
    <StaticPage locale={locale} title={dict.staticPages.faq.title} isPlaceholder={faqs.length === 0}>
      <p>{dict.staticPages.faq.intro}</p>
      {faqs.length > 0 && <FaqAccordion items={faqs} />}
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    </StaticPage>
  );
}
